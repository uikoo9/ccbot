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
  signal?: AbortSignal,
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

    console.log(`[${sessionId}] Spawning Claude: ${config.bin} ${args.slice(0, -1).join(' ')} -p <prompt>`);

    const child = spawn(config.bin, args, {
      cwd: config.workDir,
      env: {
        ...process.env,
        ANTHROPIC_AUTH_TOKEN: config.authToken,
        ANTHROPIC_BASE_URL: config.baseUrl,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    const onAbort = () => {
      console.log(`[${sessionId}] Aborting Claude process`);
      child.kill('SIGTERM');
      reject(new Error('已终止'));
    };

    if (signal) {
      if (signal.aborted) {
        child.kill('SIGTERM');
        reject(new Error('已终止'));
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stderr += chunk;
      console.error(`[${sessionId}] Claude stderr:`, chunk);
    });

    const timer = setTimeout(() => {
      console.log(`[${sessionId}] Claude timeout after ${config.timeoutMs}ms`);
      child.kill('SIGTERM');
      reject(new Error('执行超时'));
    }, config.timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      console.log(`[${sessionId}] Claude exited with code ${code}`);
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        const errorMsg = stderr || `Claude exited with code ${code}`;
        console.error(`[${sessionId}] Claude error:`, errorMsg);
        reject(new Error(errorMsg));
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      console.error(`[${sessionId}] Claude spawn error:`, err);
      reject(err);
    });
  });
}
