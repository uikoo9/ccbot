import { readFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';
import { createFeishuClient, createEventDispatcher, startWsClient, sendReply } from './feishu';
import { runClaude, type ClaudeConfig } from './claude';
import { SessionManager } from './session';

const SUPPORTED_COMMANDS = ['/new', '/stop', '/status', '/version', '/add-dir'] as const;

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

async function main() {
  const config = loadConfig();
  const client = createFeishuClient(config.feishu);

  const sessionManager = new SessionManager(async (message, sessionId, isNew, reply, signal, addDirs) => {
    console.log(`[${sessionId}] Processing message: ${message.substring(0, 100)}...`);
    try {
      await reply('Processing...');
    } catch (err) {
      console.error(`[${sessionId}] Failed to send "processing" message:`, err);
    }

    try {
      const result = await runClaude(message, sessionId, isNew, config.claude, signal, addDirs);
      console.log(`[${sessionId}] Claude completed, output length: ${result?.length || 0}`);
      await reply(result || '(no output)');
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
    console.log(`[${chatId}] Received message: ${text.substring(0, 100)}...`);
    const replyFn = (msg: string) => sendReply(client, messageId, msg);

    // Command handling
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
            const dirs = info.addDirs.length > 0 ? `\nExtra dirs: ${info.addDirs.join(', ')}` : '';
            const msg = `Session: ${info.sessionId}\nWork dir: ${config.claude.workDir}${dirs}\nStatus: ${info.busy ? 'busy' : 'idle'}\nQueue: ${info.queueLength}`;
            replyFn(msg).catch((err) => {
              console.error(`[${chatId}] Failed to send /status reply:`, err);
            });
          }
          return;
        }

        case '/version': {
          replyFn(`CCBot v${getVersion()}`).catch((err) => {
            console.error(`[${chatId}] Failed to send /version reply:`, err);
          });
          return;
        }

        case '/add-dir': {
          const dirPath = args.join(' ').trim();
          if (!dirPath) {
            replyFn('Usage: /add-dir <directory-path>').catch((err) => {
              console.error(`[${chatId}] Failed to send /add-dir reply:`, err);
            });
            return;
          }
          const resolvedPath = resolve(dirPath);
          if (!existsSync(resolvedPath) || !statSync(resolvedPath).isDirectory()) {
            replyFn(`Directory not found: ${resolvedPath}`).catch((err) => {
              console.error(`[${chatId}] Failed to send /add-dir reply:`, err);
            });
            return;
          }
          const session = sessionManager.getSession(chatId);
          if (session.addDirs.includes(resolvedPath)) {
            replyFn(`Directory already added: ${resolvedPath}`).catch((err) => {
              console.error(`[${chatId}] Failed to send /add-dir reply:`, err);
            });
            return;
          }
          session.addDirs.push(resolvedPath);
          replyFn(`Working directory added: ${resolvedPath}`).catch((err) => {
            console.error(`[${chatId}] Failed to send /add-dir reply:`, err);
          });
          return;
        }

        default: {
          replyFn(`Unknown command: ${cmd}\nSupported commands: ${SUPPORTED_COMMANDS.join(', ')}`).catch((err) => {
            console.error(`[${chatId}] Failed to send unknown command reply:`, err);
          });
          return;
        }
      }
    }

    const session = sessionManager.getSession(chatId);
    session.enqueue(text, replyFn).catch((err) => {
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
