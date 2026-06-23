import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { SessionManager } from './session.js';
import type { Config } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVersion(): string {
  try {
    const pkgPath = resolve(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

const HELP_TEXT = `Available commands:
/new — Start a new conversation
/stop — Abort current request
/status — Show session info
/model [name] — View or switch model
/cost — Show session cost
/version — Show ccbot version
/help — Show this help

Other /commands will be sent to Claude as prompts.`;

export type ReplyFn = (text: string) => Promise<void>;

// Shared incoming-text handler used by every adapter (feishu, vicvic, ...).
// Parses slash commands; anything else is enqueued to Claude as a prompt.
// `chatId` is the per-conversation session key (feishu chat_id, or "vicvic").
export function createTextDispatcher(sessionManager: SessionManager, config: Config) {
  const logPrompt = config.claude.logPrompt !== false;

  return function dispatch(chatId: string, text: string, reply: ReplyFn): void {
    console.log(
      logPrompt ? `[${chatId}] Received message: ${text.substring(0, 100)}...` : `[${chatId}] Received message`,
    );

    if (text.startsWith('/') && handleCommand(sessionManager, config, chatId, text, reply)) {
      return;
    }

    const prompt = text.startsWith('/') ? text.slice(1) : text;
    const session = sessionManager.getSession(chatId);
    session.enqueue(prompt, reply).catch((err) => {
      console.error(`[${chatId}] Enqueue failed:`, err);
      reply('System error, please try again later.').catch((replyErr) => {
        console.error(`[${chatId}] Failed to send error reply:`, replyErr);
      });
    });
  };
}

// Handle a recognized slash command. Returns true if handled (caller stops),
// false if the command is unknown (caller forwards it to Claude as a prompt).
function handleCommand(
  sessionManager: SessionManager,
  config: Config,
  chatId: string,
  text: string,
  reply: ReplyFn,
): boolean {
  const [cmd, ...args] = text.split(/\s+/);
  const send = (msg: string) =>
    reply(msg).catch((err) => console.error(`[${chatId}] Failed to send ${cmd} reply:`, err));

  switch (cmd) {
    case '/new':
      sessionManager.resetSession(chatId);
      send('Session reset. Starting a new conversation.');
      return true;
    case '/stop':
      send(sessionManager.stopSession(chatId) ? 'Current request aborted.' : 'No running request to stop.');
      return true;
    case '/status':
      send(statusText(sessionManager, config, chatId));
      return true;
    case '/model':
      send(modelText(sessionManager, config, chatId, args.join(' ').trim()));
      return true;
    case '/cost': {
      const info = sessionManager.getSessionInfo(chatId);
      send(`Session cost: $${(info ? info.totalCostUsd : 0).toFixed(4)}`);
      return true;
    }
    case '/version':
      send(`CCBot v${getVersion()}`);
      return true;
    case '/help':
      send(HELP_TEXT);
      return true;
    default:
      return false;
  }
}

function statusText(sessionManager: SessionManager, config: Config, chatId: string): string {
  const info = sessionManager.getSessionInfo(chatId);
  if (!info) return 'No active session.';
  const model = info.model || config.claude.model || 'default';
  const cost = info.totalCostUsd > 0 ? `\nCost: $${info.totalCostUsd.toFixed(4)}` : '';
  return `Session: ${info.sessionId}\nWork dir: ${config.claude.workDir}\nModel: ${model}\nStatus: ${info.busy ? 'busy' : 'idle'}\nQueue: ${info.queueLength}${cost}`;
}

function modelText(sessionManager: SessionManager, config: Config, chatId: string, modelName: string): string {
  const session = sessionManager.getSession(chatId);
  if (!modelName) return `Current model: ${session.model || config.claude.model || 'default'}`;
  session.model = modelName;
  return `Model switched to: ${modelName}`;
}
