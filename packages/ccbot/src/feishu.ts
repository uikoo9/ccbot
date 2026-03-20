import * as lark from '@larksuiteoapi/node-sdk';

export interface FeishuConfig {
  appId: string;
  appSecret: string;
}

const MAX_MSG_LEN = 4000;

export function createFeishuClient(config: FeishuConfig) {
  return new lark.Client({
    appId: config.appId,
    appSecret: config.appSecret,
    appType: lark.AppType.SelfBuild,
  });
}

export function createEventDispatcher(onMessage: (userId: string, messageId: string, text: string) => void) {
  return new lark.EventDispatcher({}).register({
    'im.message.receive_v1': async (data: any) => {
      const message = data.message;
      if (!message || message.message_type !== 'text') return;

      const userId = data.sender?.sender_id?.open_id;
      const messageId = message.message_id;

      try {
        const content = JSON.parse(message.content);
        const text = content.text?.trim();
        if (text && userId && messageId) {
          onMessage(userId, messageId, text);
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
  if (text.length <= MAX_MSG_LEN) {
    await replyMessage(client, messageId, text);
    return;
  }

  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += MAX_MSG_LEN) {
    chunks.push(text.slice(i, i + MAX_MSG_LEN));
  }

  for (let i = 0; i < chunks.length; i++) {
    const prefix = `[${i + 1}/${chunks.length}]\n`;
    await replyMessage(client, messageId, prefix + chunks[i]);
  }
}

async function replyMessage(client: lark.Client, messageId: string, text: string) {
  await client.im.message.reply({
    path: { message_id: messageId },
    data: {
      msg_type: 'text',
      content: JSON.stringify({ text }),
    },
  });
}
