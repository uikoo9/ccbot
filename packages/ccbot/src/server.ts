import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createFeishuClient, createEventDispatcher, startWsClient, sendReply } from './feishu.js';
import { runClaude, type ClaudeConfig } from './claude.js';
import { SessionManager } from './session.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Config {
  feishu: {
    appId: string;
    appSecret: string;
  };
  claude: ClaudeConfig;
}

function loadConfig(): Config {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error('Usage: server.js <config-path>');
    process.exit(1);
  }
  const raw = readFileSync(resolve(configPath), 'utf-8');
  return JSON.parse(raw);
}

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

async function main() {
  const config = loadConfig();
  const client = createFeishuClient(config.feishu);

  const logPrompt = config.claude.logPrompt !== false;

  const sessionManager = new SessionManager(async (message, sessionId, isNew, reply, signal, session) => {
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

  const eventDispatcher = createEventDispatcher((chatId, messageId, text) => {
    console.log(
      logPrompt ? `[${chatId}] Received message: ${text.substring(0, 100)}...` : `[${chatId}] Received message`,
    );
    const replyFn = (msg: string) => sendReply(client, messageId, msg);

    if (text.startsWith('/')) {
      const [cmd, ...args] = text.split(/\s+/);

      switch (cmd) {
        case '/new': {
          sessionManager.resetSession(chatId);
          replyFn('Session reset. Starting a new conversation.').catch((err) => {
            console.error(`[${chatId}] Failed to send /new reply:`, err);
          });
          return;
        }

        case '/stop': {
          const stopped = sessionManager.stopSession(chatId);
          replyFn(stopped ? 'Current request aborted.' : 'No running request to stop.').catch((err) => {
            console.error(`[${chatId}] Failed to send /stop reply:`, err);
          });
          return;
        }

        case '/status': {
          const info = sessionManager.getSessionInfo(chatId);
          if (!info) {
            replyFn('No active session.').catch((err) => {
              console.error(`[${chatId}] Failed to send /status reply:`, err);
            });
          } else {
            const model = info.model || config.claude.model || 'default';
            const cost = info.totalCostUsd > 0 ? `\nCost: $${info.totalCostUsd.toFixed(4)}` : '';
            const msg = `Session: ${info.sessionId}\nWork dir: ${config.claude.workDir}\nModel: ${model}\nStatus: ${info.busy ? 'busy' : 'idle'}\nQueue: ${info.queueLength}${cost}`;
            replyFn(msg).catch((err) => {
              console.error(`[${chatId}] Failed to send /status reply:`, err);
            });
          }
          return;
        }

        case '/model': {
          const modelName = args.join(' ').trim();
          const session = sessionManager.getSession(chatId);
          if (!modelName) {
            const current = session.model || config.claude.model || 'default';
            replyFn(`Current model: ${current}`).catch((err) => {
              console.error(`[${chatId}] Failed to send /model reply:`, err);
            });
          } else {
            session.model = modelName;
            replyFn(`Model switched to: ${modelName}`).catch((err) => {
              console.error(`[${chatId}] Failed to send /model reply:`, err);
            });
          }
          return;
        }

        case '/cost': {
          const info = sessionManager.getSessionInfo(chatId);
          const cost = info ? info.totalCostUsd : 0;
          replyFn(`Session cost: $${cost.toFixed(4)}`).catch((err) => {
            console.error(`[${chatId}] Failed to send /cost reply:`, err);
          });
          return;
        }

        case '/version': {
          replyFn(`CCBot v${getVersion()}`).catch((err) => {
            console.error(`[${chatId}] Failed to send /version reply:`, err);
          });
          return;
        }

        case '/help': {
          replyFn(HELP_TEXT).catch((err) => {
            console.error(`[${chatId}] Failed to send /help reply:`, err);
          });
          return;
        }

        default:
          break;
      }
    }

    const prompt = text.startsWith('/') ? text.slice(1) : text;
    const session = sessionManager.getSession(chatId);
    session.enqueue(prompt, replyFn).catch((err) => {
      console.error(`[${chatId}] Enqueue failed:`, err);
      replyFn('System error, please try again later.').catch((replyErr) => {
        console.error(`[${chatId}] Failed to send error reply:`, replyErr);
      });
    });
  });

  await startWsClient(config.feishu, eventDispatcher);
  console.log(`ccbot server started. workDir: ${config.claude.workDir}`);
}

main();
