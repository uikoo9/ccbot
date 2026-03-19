import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import inquirer from 'inquirer';
import pc from 'picocolors';
import { ensurePm2, connectPm2, startOrReload, disconnectPm2, savePm2 } from './pm2.js';

const CONFIG_FILE = 'ccbot.json';
const PROCESS_NAME = 'ccbot';

async function ensureConfig(): Promise<string> {
  const configPath = resolve(process.cwd(), CONFIG_FILE);

  if (existsSync(configPath)) {
    return configPath;
  }

  console.log(pc.yellow(`${CONFIG_FILE} not found, starting setup...\n`));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'claudeBin',
      message: 'Claude Code path (press enter for default):',
      default: 'claude',
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Anthropic Base URL:',
      validate: (v: string) => (v.trim() ? true : 'Base URL is required'),
    },
    {
      type: 'input',
      name: 'authToken',
      message: 'Anthropic Auth Token:',
      validate: (v: string) => (v.trim() ? true : 'Auth token is required'),
    },
    {
      type: 'input',
      name: 'appId',
      message: 'Feishu App ID:',
      validate: (v: string) => (v.trim() ? true : 'App ID is required'),
    },
    {
      type: 'password',
      name: 'appSecret',
      message: 'Feishu App Secret:',
      validate: (v: string) => (v.trim() ? true : 'App Secret is required'),
    },
    {
      type: 'number',
      name: 'timeoutMs',
      message: 'Timeout in ms (press enter for default):',
      default: 300000,
    },
  ]);

  const config = {
    feishu: {
      appId: answers.appId.trim(),
      appSecret: answers.appSecret.trim(),
    },
    claude: {
      bin: answers.claudeBin.trim(),
      workDir: process.cwd(),
      timeoutMs: answers.timeoutMs,
      authToken: answers.authToken.trim(),
      baseUrl: answers.baseUrl.trim(),
    },
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(pc.green(`✔ Config saved to ${configPath}\n`));
  return configPath;
}

export async function start() {
  const configPath = await ensureConfig();

  ensurePm2();
  await connectPm2();

  try {
    const serverScript = new URL('./server.js', import.meta.url).pathname;
    await startOrReload(PROCESS_NAME, serverScript, configPath);
    savePm2();
    console.log(pc.green(`✔ ccbot started. Use "ccbot logs" to view output.`));
  } finally {
    disconnectPm2();
  }
}

export async function stop() {
  const { execSync } = await import('child_process');
  try {
    execSync(`pm2 stop ${PROCESS_NAME}`, { stdio: 'inherit' });
    execSync(`pm2 delete ${PROCESS_NAME}`, { stdio: 'inherit' });
    console.log(pc.green('✔ ccbot stopped.'));
  } catch {
    console.error(pc.red('Failed to stop ccbot. Is it running?'));
  }
}

export async function restart() {
  const { execSync } = await import('child_process');
  try {
    execSync(`pm2 restart ${PROCESS_NAME}`, { stdio: 'inherit' });
    console.log(pc.green('✔ ccbot restarted.'));
  } catch {
    console.error(pc.red('Failed to restart ccbot. Is it running? Try "ccbot start" instead.'));
  }
}

export async function status() {
  const { execSync } = await import('child_process');
  try {
    execSync(`pm2 describe ${PROCESS_NAME}`, { stdio: 'inherit' });
  } catch {
    console.log(pc.yellow('ccbot is not running.'));
  }
}
