import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import pc from 'picocolors';
import { ensurePm2, connectPm2, startOrReload, disconnectPm2, savePm2 } from './pm2.js';

const CONFIG_FILE = 'ccbot.config.json';
const PROCESS_NAME = 'ccbot';

function loadConfig() {
  const configPath = resolve(process.cwd(), CONFIG_FILE);
  if (!existsSync(configPath)) {
    console.error(pc.red(`${CONFIG_FILE} not found. Run "ccbot init" first.`));
    process.exit(1);
  }
  return { configPath };
}

export async function start() {
  const { configPath } = loadConfig();

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

export async function status() {
  const { execSync } = await import('child_process');
  try {
    execSync(`pm2 describe ${PROCESS_NAME}`, { stdio: 'inherit' });
  } catch {
    console.log(pc.yellow('ccbot is not running.'));
  }
}
