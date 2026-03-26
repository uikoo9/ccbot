#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { Command } = require('commander');
const { execSync } = require('child_process');
const { existsSync, readFileSync } = require('fs');
const { resolve } = require('path');
const { start, status, getProcessName } = require('../dist/start');
const { stop } = require('../dist/stop');

const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'));

function resolveProcessName() {
  const configPath = resolve(process.cwd(), 'ccbot.json');
  return existsSync(configPath) ? getProcessName(configPath) : 'ccbot';
}

const program = new Command();

program.name('ccbot').description('Control Claude Code via Feishu bot').version(pkg.version);

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
    const { restart } = require('../dist/start');
    await restart();
  });

program
  .command('delete')
  .description('Delete ccbot process from pm2')
  .action(async () => {
    const { del } = require('../dist/start');
    await del();
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
