import { v4 as uuidv4 } from 'uuid';

interface QueueItem {
  message: string;
  reply: (text: string) => Promise<void>;
}

class UserSession {
  sessionId: string;
  isNew = true;
  queue: QueueItem[] = [];
  busy = false;
  abortController: AbortController | null = null;
  addDirs: string[] = [];
  private processor: (
    message: string,
    sessionId: string,
    isNew: boolean,
    reply: (text: string) => Promise<void>,
    signal: AbortSignal,
    addDirs: string[],
  ) => Promise<void>;

  constructor(processor: UserSession['processor']) {
    this.sessionId = uuidv4();
    this.processor = processor;
  }

  reset() {
    this.sessionId = uuidv4();
    this.isNew = true;
  }

  stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.queue = [];
  }

  async enqueue(message: string, reply: (text: string) => Promise<void>) {
    if (this.busy) {
      const pos = this.queue.length + 1;
      console.log(`[${this.sessionId}] Message queued, position: ${pos}`);
      await reply(`已排队，前面还有 ${pos} 条消息`);
      this.queue.push({ message, reply });
      return;
    }

    this.busy = true;
    console.log(`[${this.sessionId}] Starting to process message`);
    try {
      this.abortController = new AbortController();
      await this.processor(message, this.sessionId, this.isNew, reply, this.abortController.signal, this.addDirs);
      this.abortController = null;
      this.isNew = false;
      while (this.queue.length > 0) {
        const next = this.queue.shift()!;
        console.log(`[${this.sessionId}] Processing next queued message, ${this.queue.length} remaining`);
        this.abortController = new AbortController();
        await this.processor(next.message, this.sessionId, this.isNew, next.reply, this.abortController.signal, this.addDirs);
        this.abortController = null;
      }
    } catch (err) {
      console.error(`[${this.sessionId}] Enqueue processing error:`, err);
      throw err;
    } finally {
      this.abortController = null;
      this.busy = false;
      console.log(`[${this.sessionId}] Finished processing, busy=false`);
    }
  }
}

export class SessionManager {
  private sessions = new Map<string, UserSession>();
  private processor: UserSession['processor'];

  constructor(processor: UserSession['processor']) {
    this.processor = processor;
  }

  getSession(chatId: string): UserSession {
    let session = this.sessions.get(chatId);
    if (!session) {
      session = new UserSession(this.processor);
      this.sessions.set(chatId, session);
    }
    return session;
  }

  resetSession(chatId: string) {
    const session = this.sessions.get(chatId);
    if (session) {
      session.reset();
    }
  }

  stopSession(chatId: string): boolean {
    const session = this.sessions.get(chatId);
    if (session && session.busy) {
      session.stop();
      return true;
    }
    return false;
  }

  getSessionInfo(chatId: string): { sessionId: string; queueLength: number; busy: boolean; addDirs: string[] } | null {
    const session = this.sessions.get(chatId);
    if (!session) return null;
    return {
      sessionId: session.sessionId,
      queueLength: session.queue.length,
      busy: session.busy,
      addDirs: session.addDirs,
    };
  }
}
