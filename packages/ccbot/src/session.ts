import { v4 as uuidv4 } from 'uuid';

interface QueueItem {
  message: string;
  reply: (text: string) => Promise<void>;
}

class UserSession {
  sessionId: string;
  queue: QueueItem[] = [];
  busy = false;
  private processor: (message: string, sessionId: string, reply: (text: string) => Promise<void>) => Promise<void>;

  constructor(processor: UserSession['processor']) {
    this.sessionId = uuidv4();
    this.processor = processor;
  }

  reset() {
    this.sessionId = uuidv4();
  }

  async enqueue(message: string, reply: (text: string) => Promise<void>) {
    if (this.busy) {
      const pos = this.queue.length + 1;
      await reply(`已排队，前面还有 ${pos} 条消息`);
      this.queue.push({ message, reply });
      return;
    }

    this.busy = true;
    try {
      await this.processor(message, this.sessionId, reply);
      while (this.queue.length > 0) {
        const next = this.queue.shift()!;
        await this.processor(next.message, this.sessionId, next.reply);
      }
    } finally {
      this.busy = false;
    }
  }
}

export class SessionManager {
  private sessions = new Map<string, UserSession>();
  private processor: UserSession['processor'];

  constructor(processor: UserSession['processor']) {
    this.processor = processor;
  }

  getSession(userId: string): UserSession {
    let session = this.sessions.get(userId);
    if (!session) {
      session = new UserSession(this.processor);
      this.sessions.set(userId, session);
    }
    return session;
  }

  resetSession(userId: string) {
    const session = this.sessions.get(userId);
    if (session) {
      session.reset();
    }
  }

  getSessionInfo(userId: string): { sessionId: string; queueLength: number; busy: boolean } | null {
    const session = this.sessions.get(userId);
    if (!session) return null;
    return {
      sessionId: session.sessionId,
      queueLength: session.queue.length,
      busy: session.busy,
    };
  }
}
