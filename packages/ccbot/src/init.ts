import inquirer from 'inquirer';
import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import pc from 'picocolors';

const CONFIG_FILE = 'ccbot.config.json';

export async function init() {
  const configPath = resolve(process.cwd(), CONFIG_FILE);

  if (existsSync(configPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `${CONFIG_FILE} already exists. Overwrite?`,
        default: false,
      },
    ]);
    if (!overwrite) {
      console.log(pc.yellow('Cancelled.'));
      return;
    }
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'appId',
      message: '飞书 App ID:',
      validate: (v: string) => (v.trim() ? true : 'App ID is required'),
    },
    {
      type: 'password',
      name: 'appSecret',
      message: '飞书 App Secret:',
      validate: (v: string) => (v.trim() ? true : 'App Secret is required'),
    },
    {
      type: 'input',
      name: 'workDir',
      message: '项目工作目录:',
      validate: (v: string) => (v.trim() ? true : 'Work directory is required'),
    },
    {
      type: 'input',
      name: 'claudeBin',
      message: 'Claude Code 路径 (回车使用默认):',
      default: 'claude',
    },
    {
      type: 'number',
      name: 'timeoutMs',
      message: '执行超时时间(ms, 回车使用默认):',
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
      workDir: resolve(answers.workDir.trim()),
      timeoutMs: answers.timeoutMs,
    },
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(pc.green(`✔ Config saved to ${configPath}`));
}
