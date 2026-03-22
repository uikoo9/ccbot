import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, basename } from 'path';
import inquirer from 'inquirer';
import pc from 'picocolors';
import { ensurePm2, connectPm2, startOrReload, disconnectPm2, savePm2 } from './pm2.js';

const CONFIG_FILE = 'ccbot.json';

export function getProcessName(configPath: string): string {
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  const workDir = config.claude?.workDir || process.cwd();
  return `ccbot-${basename(workDir)}`;
}

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
    {
      type: 'input',
      name: 'workDir',
      message: 'Work directory (press enter for current directory):',
      default: '',
    },
  ]);

  const config = {
    feishu: {
      appId: answers.appId.trim(),
      appSecret: answers.appSecret.trim(),
    },
    claude: {
      bin: answers.claudeBin.trim(),
      workDir: answers.workDir.trim() || process.cwd(),
      timeoutMs: answers.timeoutMs,
    },
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(pc.green(`✔ Config saved to ${configPath}\n`));
  return configPath;
}

export async function start() {
  const configPath = await ensureConfig();
  const processName = getProcessName(configPath);

  ensurePm2();
  await connectPm2();

  try {
    const serverScript = new URL('./server.js', import.meta.url).pathname;
    await startOrReload(processName, serverScript, configPath);
    savePm2();
    console.log(pc.green(`✔ ${processName} started. Use "ccbot logs" to view output.`));
  } finally {
    disconnectPm2();
  }
}

export async function stop() {
  const configPath = resolve(process.cwd(), CONFIG_FILE);
  const processName = existsSync(configPath) ? getProcessName(configPath) : 'ccbot';
  const { execSync } = await import('child_process');
  try {
    execSync(`pm2 stop ${processName}`, { stdio: 'inherit' });
    execSync(`pm2 delete ${processName}`, { stdio: 'inherit' });
    console.log(pc.green(`✔ ${processName} stopped.`));
  } catch {
    console.error(pc.red(`Failed to stop ${processName}. Is it running?`));
  }
}

export async function restart() {
  const configPath = resolve(process.cwd(), CONFIG_FILE);
  const processName = existsSync(configPath) ? getProcessName(configPath) : 'ccbot';
  const { execSync } = await import('child_process');
  try {
    execSync(`pm2 restart ${processName}`, { stdio: 'inherit' });
    console.log(pc.green(`✔ ${processName} restarted.`));
  } catch {
    console.error(pc.red(`Failed to restart ${processName}. Is it running? Try "ccbot start" instead.`));
  }
}

export async function del() {
  const configPath = resolve(process.cwd(), CONFIG_FILE);
  const processName = existsSync(configPath) ? getProcessName(configPath) : 'ccbot';
  const { execSync } = await import('child_process');
  try {
    execSync(`pm2 delete ${processName}`, { stdio: 'inherit' });
    console.log(pc.green(`✔ ${processName} deleted.`));
  } catch {
    console.error(pc.red(`Failed to delete ${processName}. Is it running?`));
  }
}

export async function status() {
  const configPath = resolve(process.cwd(), CONFIG_FILE);
  const processName = existsSync(configPath) ? getProcessName(configPath) : 'ccbot';
  const { execSync } = await import('child_process');
  try {
    execSync(`pm2 describe ${processName}`, { stdio: 'inherit' });
  } catch {
    console.log(pc.yellow(`${processName} is not running.`));
  }
}
