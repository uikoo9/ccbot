import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { createFeishuClient, createEventDispatcher, startWsClient, sendReply } from './feishu.js';
import { runClaude, type ClaudeConfig } from './claude.js';
import { SessionManager } from './session.js';

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
    const pkgPath = resolve(fileURLToPath(import.meta.url), '../../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function main() {
  const config = loadConfig();
  const client = createFeishuClient(config.feishu);

  const sessionManager = new SessionManager(async (message, sessionId, isNew, reply, signal) => {
    console.log(`[${sessionId}] Processing message: ${message.substring(0, 100)}...`);
    try {
      await reply('正在处理...');
    } catch (err) {
      console.error(`[${sessionId}] Failed to send "processing" message:`, err);
    }

    try {
      const result = await runClaude(message, sessionId, isNew, config.claude, signal);
      console.log(`[${sessionId}] Claude completed, output length: ${result?.length || 0}`);
      await reply(result || '(无输出)');
    } catch (err: unknown) {
      console.error(`[${sessionId}] Error:`, err);
      const errMsg =
        err instanceof Error && err.message === '执行超时'
          ? '执行超时，请重试或简化问题'
          : err instanceof Error && err.message === '已终止'
            ? '已终止当前请求'
            : `执行出错: ${err instanceof Error ? err.message : String(err)}`;
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

    if (text === '/new') {
      sessionManager.resetSession(chatId);
      replyFn('会话已重置，开始新的对话').catch((err) => {
        console.error(`[${chatId}] Failed to send /new reply:`, err);
      });
      return;
    }

    if (text === '/stop') {
      const stopped = sessionManager.stopSession(chatId);
      replyFn(stopped ? '已终止当前请求' : '当前没有正在执行的请求').catch((err) => {
        console.error(`[${chatId}] Failed to send /stop reply:`, err);
      });
      return;
    }

    if (text === '/status') {
      const info = sessionManager.getSessionInfo(chatId);
      if (!info) {
        replyFn('暂无会话').catch((err) => {
          console.error(`[${chatId}] Failed to send /status reply:`, err);
        });
      } else {
        const msg = `Session: ${info.sessionId}\n项目目录: ${config.claude.workDir}\n状态: ${info.busy ? '执行中' : '空闲'}\n队列: ${info.queueLength} 条`;
        replyFn(msg).catch((err) => {
          console.error(`[${chatId}] Failed to send /status reply:`, err);
        });
      }
      return;
    }

    if (text === '/version') {
      replyFn(`CCBot v${getVersion()}`).catch((err) => {
        console.error(`[${chatId}] Failed to send /version reply:`, err);
      });
      return;
    }

    const session = sessionManager.getSession(chatId);
    session.enqueue(text, replyFn).catch((err) => {
      console.error(`[${chatId}] Enqueue failed:`, err);
      replyFn('系统错误，请稍后重试').catch((replyErr) => {
        console.error(`[${chatId}] Failed to send error reply:`, replyErr);
      });
    });
  });

  await startWsClient(config.feishu, eventDispatcher);
  console.log(`ccbot server started. workDir: ${config.claude.workDir}`);
}

main();
