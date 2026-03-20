#!/usr/bin/env node

import { Command } from 'commander';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { start, status, getProcessName } from '../dist/start.js';
import { stop } from '../dist/stop.js';

function resolveProcessName() {
  const configPath = resolve(process.cwd(), 'ccbot.json');
  return existsSync(configPath) ? getProcessName(configPath) : 'ccbot';
}

const program = new Command();

program.name('ccbot').description('Control Claude Code via Feishu bot').version('0.0.1');

program
  .command('start')
  .description('Start ccbot server (will prompt for config on first run)')
  .action(async () => {
    await start();
  });

program
  .command('stop')
  .description('Stop ccbot server')
  .action(async () => {
    await stop();
  });

program
  .command('status')
  .description('Show ccbot process status')
  .action(async () => {
    await status();
  });

program
  .command('restart')
  .description('Restart ccbot server (use after updating)')
  .action(async () => {
    const { restart } = await import('../dist/start.js');
    await restart();
  });

program
  .command('logs')
  .description('Show ccbot logs')
  .action(() => {
    const name = resolveProcessName();
    try {
      execSync(`pm2 logs ${name} --lines 50`, { stdio: 'inherit' });
    } catch {
      console.error('Failed to show logs. Is pm2 installed?');
    }
  });

program.parse();
