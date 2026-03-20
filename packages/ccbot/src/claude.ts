import { spawn } from 'child_process';

export interface ClaudeConfig {
  bin: string;
  workDir: string;
  timeoutMs: number;
  authToken: string;
  baseUrl: string;
}

function extractText(line: string): { text?: string; result?: string } {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'assistant') {
      const parts = obj.message?.content;
      if (Array.isArray(parts)) {
        return {
          text: parts
            .filter((p: { type: string }) => p.type === 'text')
            .map((p: { text: string }) => p.text)
            .join(''),
        };
      }
    }
    if (obj.type === 'result') {
      return { result: obj.result ?? '' };
    }
  } catch {
    // ignore malformed lines
  }
  return {};
}

export function runClaude(
  prompt: string,
  sessionId: string,
  isNew: boolean,
  config: ClaudeConfig,
  onData?: (accumulated: string) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      '--print',
      '--output-format',
      'stream-json',
      '--verbose',
      ...(isNew ? ['--session-id', sessionId] : ['--resume', sessionId]),
      '--dangerously-skip-permissions',
      '-p',
      prompt,
    ];

    const child = spawn(config.bin, args, {
      cwd: config.workDir,
      env: {
        ...process.env,
        ANTHROPIC_AUTH_TOKEN: config.authToken,
        ANTHROPIC_BASE_URL: config.baseUrl,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let accumulated = '';
    let finalResult: string | undefined;
    let stderr = '';
    let buf = '';

    child.stdout.on('data', (data: Buffer) => {
      buf += data.toString();
      const lines = buf.split('\n');
      buf = lines.pop()!;
      for (const line of lines) {
        if (!line.trim()) continue;
        const { text, result } = extractText(line);
        if (text) {
          accumulated += (accumulated ? '\n\n' : '') + text;
          onData?.(accumulated);
        }
        if (result !== undefined) {
          finalResult = result;
        }
      }
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('执行超时'));
    }, config.timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(finalResult ?? accumulated.trim());
      } else {
        reject(new Error(stderr || `Claude exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
