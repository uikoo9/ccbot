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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPostText(content: Record<string, any>): string {
  const lang = Object.keys(content)[0];
  if (!lang) return '';
  const post = content[lang];
  const parts: string[] = [];
  if (post.title) parts.push(post.title);
  for (const paragraph of post.content || []) {
    const line = paragraph
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((el: any) => el.tag === 'text' || el.tag === 'a')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((el: any) => el.text || '')
      .join('');
    if (line) parts.push(line);
  }
  return parts.join('\n');
}

export function createEventDispatcher(onMessage: (chatId: string, messageId: string, text: string) => void) {
  return new lark.EventDispatcher({}).register({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'im.message.receive_v1': async (data: any) => {
      const message = data.message;
      if (!message || (message.message_type !== 'text' && message.message_type !== 'post')) return;

      const chatId = message.chat_id;
      const messageId = message.message_id;

      try {
        const content = JSON.parse(message.content);
        const text = message.message_type === 'post' ? extractPostText(content)?.trim() : content.text?.trim();
        if (text && chatId && messageId) {
          onMessage(chatId, messageId, text);
        }
      } catch {
        // ignore unparseable messages
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
    const content = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[$1]($2)');
    await client.im.message.reply({
      path: { message_id: messageId },
      data: {
        msg_type: 'interactive',
        content: JSON.stringify({
          elements: [{ tag: 'markdown', content }],
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
