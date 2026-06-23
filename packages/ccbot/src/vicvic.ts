import WebSocket from 'ws';
import type { ReplyFn } from './dispatch.js';
import type { VicvicConfig } from './types.js';

// One ccbot instance == one bot == one owner == one workDir, so a single
// session key is enough (all prompts serialize through the same queue).
const VICVIC_SESSION_KEY = 'vicvic';
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

type Dispatch = (chatId: string, text: string, reply: ReplyFn) => void;

interface ServerFrame {
  type?: string;
  msgUid?: string;
  text?: string;
}

// Start the vicvic.im adapter: connect out to app-server's /bot/connect WS,
// forward incoming "prompt" frames to the shared dispatcher, and send Claude's
// output back as "reply" frames. Auto-reconnects with exponential backoff.
export function startVicvic(cfg: VicvicConfig, dispatch: Dispatch, logPrompt: boolean) {
  const url = `${cfg.baseUrl.replace(/^http/, 'ws')}/bot/connect?token=${encodeURIComponent(cfg.token)}`;
  let attempt = 0;
  let stopped = false;

  const connect = () => {
    const ws = new WebSocket(url);

    ws.on('open', () => {
      attempt = 0;
      console.log('[vicvic] connected');
    });

    ws.on('message', (data) => {
      let frame: ServerFrame;
      try {
        frame = JSON.parse(data.toString());
      } catch {
        return; // ignore non-JSON frames
      }
      if (frame.type === 'ready') {
        console.log('[vicvic] ready');
        return;
      }
      if (frame.type === 'prompt' && typeof frame.text === 'string' && frame.text.length > 0) {
        console.log(logPrompt ? `[vicvic] prompt: ${frame.text.slice(0, 100)}...` : '[vicvic] prompt');
        dispatch(VICVIC_SESSION_KEY, frame.text, makeReply(ws, frame.msgUid));
      }
    });

    ws.on('close', () => {
      console.log('[vicvic] disconnected');
      reconnect();
    });

    ws.on('error', (err: Error) => {
      console.error('[vicvic] ws error:', err.message); // "close" fires next → reconnect
    });
  };

  const reconnect = () => {
    if (stopped) return;
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
    attempt += 1;
    console.log(`[vicvic] reconnecting in ${Math.round(delay / 1000)}s`);
    setTimeout(connect, delay);
  };

  connect();
  return { stop: () => (stopped = true) };
}

// Build a ReplyFn that sends one "reply" frame back to app-server. app-server
// then delivers it to the owner as a RongCloud private message (and persists it).
function makeReply(ws: WebSocket, msgUid?: string): ReplyFn {
  return (text: string) =>
    new Promise<void>((resolve, reject) => {
      ws.send(JSON.stringify({ type: 'reply', msgUid, text }), (err) => (err ? reject(err) : resolve()));
    });
}
