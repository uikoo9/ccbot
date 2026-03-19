#!/usr/bin/env node

import { Command } from 'commander';
import { execSync } from 'child_process';
import { init } from '../dist/init.js';
import { start, status } from '../dist/start.js';
import { stop } from '../dist/stop.js';

const program = new Command();

program.name('ccbot').description('Control Claude Code via Feishu bot').version('0.0.1');

program
  .command('init')
  .description('Initialize ccbot config interactively')
  .action(async () => {
    await init();
  });

program
  .command('start')
  .description('Start ccbot server via pm2')
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
  .command('logs')
  .description('Show ccbot logs')
  .action(() => {
    try {
      execSync('pm2 logs ccbot --lines 50', { stdio: 'inherit' });
    } catch {
      console.error('Failed to show logs. Is pm2 installed?');
    }
  });

program.parse();
