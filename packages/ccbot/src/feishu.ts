import * as lark from '@larksuiteoapi/node-sdk';

export interface FeishuConfig {
  appId: string;
  appSecret: string;
}

const MAX_MSG_LEN = 4000;

const MD_PATTERNS = [
  /^#{1,6}\s/m, // headings
  /\*\*.+?\*\*/, // bold
  /`.+?`/, // inline code
  /```[\s\S]*?```/, // code blocks
  /^\s*[-*]\s/m, // unordered list
  /^\s*\d+\.\s/m, // ordered list
  /\[.+?\]\(.+?\)/, // links
];

function hasMarkdown(text: string): boolean {
  return MD_PATTERNS.some((p) => p.test(text));
}

export function createFeishuClient(config: FeishuConfig) {
  return new lark.Client({
    appId: config.appId,
    appSecret: config.appSecret,
    appType: lark.AppType.SelfBuild,
  });
}

export function createEventDispatcher(onMessage: (chatId: string, messageId: string, text: string) => void) {
  return new lark.EventDispatcher({}).register({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'im.message.receive_v1': async (data: any) => {
      const message = data.message;
      if (!message || message.message_type !== 'text') return;

      const chatId = message.chat_id;
      const messageId = message.message_id;

      try {
        const content = JSON.parse(message.content);
        const text = content.text?.trim();
        if (text && chatId && messageId) {
          onMessage(chatId, messageId, text);
        }
      } catch {
        // ignore non-text messages
      }
    },
  });
}

export async function startWsClient(config: FeishuConfig, eventDispatcher: ReturnType<typeof createEventDispatcher>) {
  const wsClient = new lark.WSClient({
    appId: config.appId,
    appSecret: config.appSecret,
    loggerLevel: lark.LoggerLevel.info,
  });
  await wsClient.start({ eventDispatcher });
  return wsClient;
}

export async function sendReply(client: lark.Client, messageId: string, text: string) {
  console.log(`[feishu] Sending reply to ${messageId}, length: ${text.length}`);
  if (text.length <= MAX_MSG_LEN) {
    await replyMessage(client, messageId, text);
    return;
  }

  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += MAX_MSG_LEN) {
    chunks.push(text.slice(i, i + MAX_MSG_LEN));
  }

  console.log(`[feishu] Splitting message into ${chunks.length} chunks`);
  for (let i = 0; i < chunks.length; i++) {
    const prefix = `[${i + 1}/${chunks.length}]\n`;
    await replyMessage(client, messageId, prefix + chunks[i]);
  }
}

async function replyMessage(client: lark.Client, messageId: string, text: string) {
  if (hasMarkdown(text)) {
    await client.im.message.reply({
      path: { message_id: messageId },
      data: {
        msg_type: 'interactive',
        content: JSON.stringify({
          elements: [{ tag: 'markdown', content: text }],
        }),
      },
    });
  } else {
    await client.im.message.reply({
      path: { message_id: messageId },
      data: {
        msg_type: 'text',
        content: JSON.stringify({ text }),
      },
    });
  }
}
