import { spawn } from 'child_process';

export interface ClaudeConfig {
  bin: string;
  workDir: string;
  timeoutMs: number;
  authToken: string;
  baseUrl: string;
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
      'text',
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

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
      onData?.(stdout);
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
        resolve(stdout.trim());
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
