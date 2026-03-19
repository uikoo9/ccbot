import { readFileSync } from 'fs';
import { resolve } from 'path';
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

async function main() {
  const config = loadConfig();
  const client = createFeishuClient(config.feishu);

  const sessionManager = new SessionManager(async (message, sessionId, isNew, reply) => {
    await reply('正在处理...');
    try {
      const result = await runClaude(message, sessionId, isNew, config.claude);
      await reply(result || '(无输出)');
    } catch (err: any) {
      const errMsg = err.message === '执行超时' ? '执行超时，请重试或简化问题' : `执行出错: ${err.message}`;
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
        const msg = `Session: ${info.sessionId}\n状态: ${info.busy ? '执行中' : '空闲'}\n队列: ${info.queueLength} 条`;
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
