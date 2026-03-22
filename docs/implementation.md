# CCBot 实现文档

## 概述

CCBot 是一个 CLI 工具，让用户通过飞书机器人与本地 Claude Code 交互。利用飞书 WebSocket 长连接模式接收消息（无需公网IP），通过 Claude Code `--print` 模式执行命令并保持会话上下文，使用 pm2 管理后台进程。

## 架构

```
飞书用户发消息
    ↓
飞书服务器 ──WebSocket长连接──→ 本地 CCBot Server (pm2管理)
                                    ↓
                              Claude Code --print
                              (--session-id 保持上下文)
                                    ↓
                              飞书 API 发送回复
                                    ↑
飞书用户收到回复 ←─────────────────┘
```

### 核心流程

1. 用户通过飞书给机器人发消息
2. CCBot Server 通过飞书 SDK 的 WebSocket 长连接收到消息事件
3. Server 调用 `claude --print --session-id <uuid> --output-format stream-json -p "用户消息"` 执行
4. 收集 Claude Code 输出，通过飞书 API 发送回复给用户
5. 同一个飞书用户的消息使用同一个 session-id，保持对话上下文

## 技术选型

| 组件 | 方案 | 说明 |
|------|------|------|
| CLI框架 | commander | 与参考项目一致 |
| 交互式问答 | inquirer | 收集用户配置 |
| 进程管理 | pm2 | 后台运行，开机自启 |
| 飞书SDK | @larksuiteoapi/node-sdk | 官方SDK，支持WebSocket长连接 |
| Claude Code | claude --print | 非交互模式，支持session-id保持上下文 |
| 日志 | picocolors | 终端彩色输出 |

## 项目结构

```
ccbot/
├── package.json
├── bin/
│   └── ccbot.js              # CLI 入口 (commander)
├── src/
│   ├── init.js               # 交互式问答，生成配置文件
│   ├── start.js              # pm2 启动/重启 server
│   ├── stop.js               # pm2 停止
│   ├── server.js             # 主服务 (pm2运行的入口)
│   ├── feishu.js             # 飞书 WebSocket 长连接 + 消息收发
│   ├── claude.js             # Claude Code --print 调用封装
│   ├── session.js            # 会话管理 (用户ID → session-id 映射)
│   └── pm2.js                # pm2 操作封装
└── docs/
```

## CLI 命令设计

### `ccbot init`

交互式问答收集配置，生成 `ccbot.config.json`：

```
? 飞书 App ID: cli_xxxxx
? 飞书 App Secret: xxxxxx
? 项目工作目录: /Users/xxx/my-project
? Claude Code 路径 (回车使用默认): claude
```

生成的配置文件 `ccbot.config.json`：

```json
{
  "feishu": {
    "appId": "cli_xxxxx",
    "appSecret": "xxxxxx"
  },
  "claude": {
    "bin": "claude",
    "workDir": "/Users/xxx/my-project"
  }
}
```

### `ccbot start`

1. 检查当前目录下是否有 `ccbot.config.json`
2. 确保 pm2 已安装（未安装则自动全局安装）
3. 通过 pm2 启动 `server.js`，传入配置文件路径

### `ccbot stop`

停止 pm2 中的 ccbot 进程。

### `ccbot status`

查看 ccbot 进程状态（pm2 list）。

### `ccbot logs`

查看 ccbot 日志（pm2 logs）。

## 核心模块设计

### feishu.js — 飞书通信

```js
// 使用飞书 SDK WebSocket 长连接模式
import * as lark from '@larksuiteoapi/node-sdk';

// 创建 client
const client = new lark.Client({ appId, appSecret });

// 创建事件处理器，监听 im.message.receive_v1
// 收到消息后提取文本内容，调用 onMessage 回调

// 创建 WebSocket client (长连接，无需公网IP)
const wsClient = new lark.WSClient({ appId, appSecret, eventDispatcher });
wsClient.start();

// 发送回复：调用飞书 API
// POST /im/v1/messages/:message_id/reply
// 纯文本格式
```

### claude.js — Claude Code 调用

```js
import { spawn } from 'child_process';

function runClaude(prompt, sessionId, workDir) {
  // 使用 --print 模式，stream-json 输出
  const args = [
    '--print',
    '--output-format', 'stream-json',
    '--session-id', sessionId,
    '--dangerously-skip-permissions',
    '-p', prompt
  ];

  const child = spawn('claude', args, { cwd: workDir });

  // 收集 stream-json 输出，解析 assistant 消息
  // 返回最终文本结果
}
```

注意：`--dangerously-skip-permissions` 用于跳过权限确认，因为飞书场景无法交互式确认。用户需自行评估安全风险。

### session.js — 会话管理

```js
// 内存中维护 Map<feishuUserId, sessionId>
// 每个飞书用户对应一个固定的 Claude Code session
// 首次对话时生成 UUID 作为 session-id
// 支持 /new 命令重置会话（生成新的 session-id）
```

### server.js — 主服务入口

```js
// 1. 读取配置文件 (路径从 process.argv 获取)
// 2. 初始化会话管理器
// 3. 初始化飞书 WebSocket 长连接
// 4. 收到飞书消息时：
//    a. 获取或创建该用户的 session-id
//    b. 调用 claude --print 执行
//    c. 将结果通过飞书 API 回复
```

### pm2.js — 进程管理

参考 shun-cli 的实现：
- `ensurePm2()` — 检查并自动安装 pm2
- `connect()` / `disconnect()`
- `startOrReload(name, script, args)` — 已存在则 reload，否则 start
- `stop(name)` — 停止进程
- `save()` — 持久化进程列表

## 飞书机器人配置要求

用户需要在 [飞书开放平台](https://open.feishu.cn) 创建自建应用：

1. 创建应用，获取 App ID 和 App Secret
2. 添加「机器人」能力
3. 事件订阅 → 订阅方式选择「长连接」
4. 添加事件：`im.message.receive_v1`（接收消息）
5. 权限：`im:message`（发送消息）、`im:message.receive_v1`（接收消息）
6. 发布应用

## 特殊命令

在飞书对话中支持以下特殊命令：

| 命令 | 说明 |
|------|------|
| `/new` | 重置会话，开始新的 Claude Code 对话 |
| `/status` | 查看当前会话状态 |

## 消息处理流程

```
飞书消息到达
  ↓
提取消息文本 (过滤非文本消息)
  ↓
检查是否特殊命令 (/new, /status)
  ├─ 是 → 执行对应操作，回复结果
  └─ 否 → 继续
  ↓
获取/创建 session-id (基于飞书用户ID)
  ↓
检查该用户是否有任务在执行
  ├─ 是 → 加入队列，回复"已排队，前面还有 N 条消息"
  └─ 否 → 继续
  ↓
回复"正在处理..."
  ↓
调用 claude --print --session-id <id> -p "消息内容"
  ↓
启动超时计时器 (默认10分钟，可配置)
  ├─ 超时 → kill 子进程，回复"执行超时，请重试或简化问题"
  └─ 正常完成 → 继续
  ↓
收集输出文本
  ↓
检查输出长度
  ├─ ≤ 4000字符 → 单条回复
  └─ > 4000字符 → 按4000字符分段，逐条发送
  ↓
通过飞书 API 回复 (纯文本)
  ↓
检查队列，处理下一条消息
```

## 消息队列设计

每个用户维护一个 FIFO 队列，确保同一用户的消息按顺序执行，避免同 session 并发调用 Claude Code。

```js
// session.js 中扩展
class UserSession {
  sessionId;     // Claude Code session UUID
  queue = [];    // 待处理消息队列
  busy = false;  // 是否正在执行

  async enqueue(message, reply) {
    if (this.busy) {
      const pos = this.queue.length + 1;
      reply(`已排队，前面还有 ${pos} 条消息`);
      this.queue.push({ message, reply });
      return;
    }
    this.busy = true;
    await this.process(message, reply);
    // 处理完后依次消费队列
    while (this.queue.length > 0) {
      const next = this.queue.shift();
      await this.process(next.message, next.reply);
    }
    this.busy = false;
  }
}
```

## 超时处理

```js
// claude.js 中
function runClaude(prompt, sessionId, workDir, timeoutMs = 600000) {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', args, { cwd: workDir });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('执行超时'));
    }, timeoutMs);

    // ... 收集输出 ...

    child.on('close', () => {
      clearTimeout(timer);
      resolve(output);
    });
  });
}
```

## 消息分段发送

飞书单条消息限制约 4000 字符。超长输出按段发送：

```js
// feishu.js 中
const MAX_MSG_LEN = 4000;

async function sendReply(client, messageId, text) {
  if (text.length <= MAX_MSG_LEN) {
    await replyMessage(client, messageId, text);
    return;
  }
  // 分段发送
  const chunks = [];
  for (let i = 0; i < text.length; i += MAX_MSG_LEN) {
    chunks.push(text.slice(i, i + MAX_MSG_LEN));
  }
  for (let i = 0; i < chunks.length; i++) {
    const prefix = `[${i + 1}/${chunks.length}]\n`;
    await replyMessage(client, messageId, prefix + chunks[i]);
  }
}
```

## 依赖

```json
{
  "dependencies": {
    "@larksuiteoapi/node-sdk": "latest",
    "commander": "^13.0.0",
    "inquirer": "^9.0.0",
    "picocolors": "^1.1.0",
    "pm2": "^6.0.0",
    "uuid": "^9.0.0"
  }
}
```

## 配置项汇总

`ccbot.config.json` 完整配置：

```json
{
  "feishu": {
    "appId": "cli_xxxxx",
    "appSecret": "xxxxxx"
  },
  "claude": {
    "bin": "claude",
    "workDir": "/Users/xxx/my-project",
    "timeoutMs": 600000
  }
}
```

| 字段 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| feishu.appId | 是 | - | 飞书应用 App ID |
| feishu.appSecret | 是 | - | 飞书应用 App Secret |
| claude.bin | 否 | `claude` | Claude Code 可执行文件路径 |
| claude.workDir | 是 | - | Claude Code 工作目录 |
| claude.timeoutMs | 否 | `600000` | 单次执行超时时间(ms)，默认10分钟 |

**Claude API 配置**：CCBot 从 `~/.claude/settings.json` 的 `env.ANTHROPIC_AUTH_TOKEN` 和 `env.ANTHROPIC_BASE_URL` 读取 API 凭证，多个 CCBot 项目共享同一套凭证。
