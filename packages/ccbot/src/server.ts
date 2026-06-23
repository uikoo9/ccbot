import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createFeishuClient, createEventDispatcher, startWsClient, sendReply } from './feishu.js';
import { runClaude } from './claude.js';
import { SessionManager } from './session.js';
import { createTextDispatcher } from './dispatch.js';
import { startVicvic } from './vicvic.js';
import type { Config } from './types.js';

function loadConfig(): Config {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error('Usage: server.js <config-path>');
    process.exit(1);
  }
  const raw = readFileSync(resolve(configPath), 'utf-8');
  return JSON.parse(raw);
}

// Claude run loop (adapter-agnostic): every queued prompt runs here and the
// result is sent back via `reply`, whatever adapter (feishu / vicvic) produced it.
function buildSessionManager(config: Config): SessionManager {
  const logPrompt = config.claude.logPrompt !== false;
  return new SessionManager(async (message, sessionId, isNew, reply, signal, session) => {
    console.log(
      logPrompt
        ? `[${sessionId}] Processing message: ${message.substring(0, 100)}...`
        : `[${sessionId}] Processing message`,
    );
    try {
      await reply('Processing...');
    } catch (err) {
      console.error(`[${sessionId}] Failed to send "processing" message:`, err);
    }

    try {
      const { text, sdkSessionId, costUsd } = await runClaude(
        message,
        sessionId,
        isNew,
        config.claude,
        signal,
        session.model,
      );
      if (sdkSessionId) {
        session.updateSessionId(sdkSessionId);
        session.isNew = false;
      }
      if (costUsd) {
        session.addCost(costUsd);
      }
      console.log(`[${sessionId}] Claude completed, output length: ${text?.length || 0}`);
      await reply(text || '(no output)');
    } catch (err: unknown) {
      console.error(`[${sessionId}] Error:`, err);
      const errMsg =
        err instanceof Error && err.message === 'Execution timeout'
          ? 'Execution timeout, please retry or simplify your question'
          : err instanceof Error && err.message === 'Aborted'
            ? 'Request aborted'
            : `Error: ${err instanceof Error ? err.message : String(err)}`;
      try {
        await reply(errMsg);
      } catch (replyErr) {
        console.error(`[${sessionId}] Failed to send error message:`, replyErr);
      }
    }
  });
}

async function main() {
  const config = loadConfig();
  const sessionManager = buildSessionManager(config);
  const dispatch = createTextDispatcher(sessionManager, config);

  let started = false;

  // Feishu adapter (optional): each chat_id is its own session.
  const feishu = config.feishu;
  if (feishu?.appId) {
    const client = createFeishuClient(feishu);
    const eventDispatcher = createEventDispatcher((chatId, messageId, text) =>
      dispatch(chatId, text, (msg) => sendReply(client, messageId, msg)),
    );
    await startWsClient(feishu, eventDispatcher);
    console.log('feishu adapter started');
    started = true;
  }

  // vicvic.im adapter (optional): single outbound WS, one session per ccbot.
  const vicvic = config.vicvic;
  if (vicvic?.token) {
    startVicvic(vicvic, dispatch, config.claude.logPrompt !== false);
    console.log('vicvic adapter started');
    started = true;
  }

  if (!started) {
    console.error('No adapter configured (set feishu or vicvic in ccbot.json).');
    process.exit(1);
  }
  console.log(`ccbot server started. workDir: ${config.claude.workDir}`);
}

main();
