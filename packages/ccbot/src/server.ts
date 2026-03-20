import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createFeishuClient, createEventDispatcher, startWsClient, sendReply, updateMessage } from './feishu.js';
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

async function main() {
  const config = loadConfig();
  const client = createFeishuClient(config.feishu);

  const sessionManager = new SessionManager(async (message, sessionId, isNew, reply) => {
    const replyMsgId = await reply('正在处理...');
    let accumulated = '';
    let lastUpdated = '';

    const timer = setInterval(async () => {
      if (accumulated && accumulated !== lastUpdated && replyMsgId) {
        lastUpdated = accumulated;
        try {
          await updateMessage(client, replyMsgId, accumulated);
        } catch {
          // ignore update errors
        }
      }
    }, 3000);

    try {
      const result = await runClaude(message, sessionId, isNew, config.claude, (text) => {
        accumulated = text;
      });
      clearInterval(timer);
      await reply(result || '(无输出)');
    } catch (err: unknown) {
      clearInterval(timer);
      const errMsg =
        err instanceof Error && err.message === '执行超时'
          ? '执行超时，请重试或简化问题'
          : `执行出错: ${err instanceof Error ? err.message : err}`;
      await reply(errMsg);
    }
  });

  const eventDispatcher = createEventDispatcher((chatId, messageId, text) => {
    const replyFn = (msg: string) => sendReply(client, messageId, msg);

    if (text === '/new') {
      sessionManager.resetSession(chatId);
      replyFn('会话已重置，开始新的对话').catch(console.error);
      return;
    }

    if (text === '/status') {
      const info = sessionManager.getSessionInfo(chatId);
      if (!info) {
        replyFn('暂无会话').catch(console.error);
      } else {
        const msg = `Session: ${info.sessionId}\n项目目录: ${config.claude.workDir}\n状态: ${info.busy ? '执行中' : '空闲'}\n队列: ${info.queueLength} 条`;
        replyFn(msg).catch(console.error);
      }
      return;
    }

    const session = sessionManager.getSession(chatId);
    session.enqueue(text, replyFn).catch(console.error);
  });

  await startWsClient(config.feishu, eventDispatcher);
  console.log(`ccbot server started. workDir: ${config.claude.workDir}`);
}

main();
