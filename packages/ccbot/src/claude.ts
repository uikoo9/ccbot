import { execSync, spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { SpawnOptions, SpawnedProcess, Options, SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';

export interface ClaudeConfig {
  bin: string;
  workDir: string;
  timeoutMs: number;
  logPrompt: boolean;
  model?: string;
}

export interface ClaudeResult {
  text: string;
  sdkSessionId?: string;
  costUsd?: number;
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

const isWindows = process.platform === 'win32';

function resolveClaudePath(configBin?: string): string {
  if (configBin && configBin !== 'claude') return configBin;
  if (process.env.CLAUDE_EXECUTABLE_PATH) return process.env.CLAUDE_EXECUTABLE_PATH;
  try {
    const cmd = isWindows ? 'where claude' : 'which claude';
    return execSync(cmd, { encoding: 'utf-8' }).trim().split(/\r?\n/)[0];
  } catch {
    return isWindows ? 'claude' : '/usr/local/bin/claude';
  }
}

function createCustomSpawn(systemConfig: {
  authToken?: string;
  baseUrl?: string;
}): (options: SpawnOptions) => SpawnedProcess {
  return (options: SpawnOptions): SpawnedProcess => {
    const baseEnv =
      options.env && Object.keys(options.env).length > 0 ? { ...process.env, ...options.env } : { ...process.env };

    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(baseEnv)) {
      if (!key.startsWith('CLAUDE') && value !== undefined) {
        env[key] = value;
      }
    }

    if (systemConfig.authToken) env.ANTHROPIC_AUTH_TOKEN = systemConfig.authToken;
    if (systemConfig.baseUrl) env.ANTHROPIC_BASE_URL = systemConfig.baseUrl;

    const child = spawn(options.command, options.args, {
      cwd: options.cwd,
      env,
      signal: options.signal,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return child as unknown as SpawnedProcess;
  };
}

export function runClaude(
  prompt: string,
  sessionId: string,
  isNew: boolean,
  config: ClaudeConfig,
  signal?: AbortSignal,
  modelOverride?: string,
): Promise<ClaudeResult> {
  return new Promise((resolvePromise, reject) => {
    const systemConfig = getClaudeSystemConfig();
    if (!systemConfig.authToken && !systemConfig.baseUrl) {
      console.log(
        `[${sessionId}] ANTHROPIC_AUTH_TOKEN or ANTHROPIC_BASE_URL not configured, using Claude Code default auth (e.g. OAuth)`,
      );
    }

    const abortController = new AbortController();

    if (signal) {
      if (signal.aborted) {
        reject(new Error('Aborted'));
        return;
      }
      signal.addEventListener('abort', () => abortController.abort(), { once: true });
    }

    const timer = setTimeout(() => {
      console.log(`[${sessionId}] Claude timeout after ${config.timeoutMs}ms`);
      abortController.abort();
    }, config.timeoutMs);

    const queryOptions: Options = {
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      cwd: config.workDir,
      abortController,
      spawnClaudeCodeProcess: createCustomSpawn(systemConfig),
      pathToClaudeCodeExecutable: resolveClaudePath(config.bin),
    };

    if (!isNew && sessionId) {
      queryOptions.resume = sessionId;
    }

    const model = modelOverride || config.model;
    if (model) {
      queryOptions.model = model;
    }

    console.log(`[${sessionId}] Starting Claude via SDK, cwd: ${config.workDir}, resume: ${!isNew}`);

    (async () => {
      let resultText = '';
      let sdkSessionId: string | undefined;
      let costUsd: number | undefined;

      try {
        const stream = query({ prompt, options: queryOptions });

        for await (const message of stream) {
          if ('session_id' in message && message.session_id) {
            sdkSessionId = message.session_id as string;
          }
          if (message.type === 'result') {
            const resultMsg = message as SDKResultMessage;
            costUsd = resultMsg.total_cost_usd;
            if (resultMsg.subtype === 'success') {
              resultText = resultMsg.result || '';
            } else {
              throw new Error(resultMsg.errors?.join('; ') || 'Claude execution failed');
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message === 'This operation was aborted')) {
          if (signal?.aborted) {
            throw new Error('Aborted'); // eslint-disable-line preserve-caught-error
          }
          throw new Error('Execution timeout'); // eslint-disable-line preserve-caught-error
        }
        throw err;
      }

      console.log(
        `[${sessionId}] Claude completed via SDK, output length: ${resultText.length}, cost: $${costUsd?.toFixed(4) || '?'}, sdkSessionId: ${sdkSessionId?.slice(0, 8) || 'none'}`,
      );
      return { text: resultText, sdkSessionId, costUsd };
    })()
      .then((result) => {
        clearTimeout(timer);
        resolvePromise(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        console.error(`[${sessionId}] Claude SDK error:`, err);
        reject(err);
      });
  });
}
