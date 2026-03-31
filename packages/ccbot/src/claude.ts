import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';

export interface ClaudeConfig {
  bin: string;
  workDir: string;
  timeoutMs: number;
}

function getClaudeSystemConfig(): { authToken?: string; baseUrl?: string } {
  const settingsPath = resolve(homedir(), '.claude', 'settings.json');
  if (!existsSync(settingsPath)) {
    return {};
  }
  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    return {
      authToken: settings.env?.ANTHROPIC_AUTH_TOKEN,
      baseUrl: settings.env?.ANTHROPIC_BASE_URL,
    };
  } catch {
    return {};
  }
}

export function runClaude(
  prompt: string,
  sessionId: string,
  isNew: boolean,
  config: ClaudeConfig,
  signal?: AbortSignal,
  addDirs?: string[],
): Promise<string> {
  return new Promise((resolve, reject) => {
    const systemConfig = getClaudeSystemConfig();
    if (!systemConfig.authToken || !systemConfig.baseUrl) {
      console.log(
        `[${sessionId}] ANTHROPIC_AUTH_TOKEN 或 ANTHROPIC_BASE_URL 未配置，将使用 Claude Code 默认认证方式（如 OAuth）`,
      );
    }

    const args = [
      '--print',
      '--output-format',
      'text',
      ...(isNew ? ['--session-id', sessionId] : ['--resume', sessionId]),
      '--dangerously-skip-permissions',
      ...(addDirs || []).flatMap((dir) => ['--add-dir', dir]),
      '-p',
      prompt,
    ];

    console.log(`[${sessionId}] Spawning Claude: ${config.bin} ${args.slice(0, -1).join(' ')} -p <prompt>`);

    const env = { ...process.env };
    delete env.ANTHROPIC_AUTH_TOKEN;
    delete env.ANTHROPIC_BASE_URL;
    if (systemConfig.authToken) env.ANTHROPIC_AUTH_TOKEN = systemConfig.authToken;
    if (systemConfig.baseUrl) env.ANTHROPIC_BASE_URL = systemConfig.baseUrl;

    const child = spawn(config.bin, args, {
      cwd: config.workDir,
      env,
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
