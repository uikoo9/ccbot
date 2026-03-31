# CCBot 中文文档

通过 IM 机器人（飞书 / 企业微信 / 钉钉 / Slack / Telegram / Discord / Teams / WhatsApp 等）控制本地 Claude Code。

[English](https://github.com/uikoo9/ccbot/blob/main/packages/ccbot/README.md)

## 快速开始

### 第一步：安装 CCBot

```bash
npm install -g @ccbot/cli
```

如果本地没有 pm2，首次启动时会自动全局安装。

### 第二步：创建飞书机器人

1. 登录 [飞书开放平台](https://open.feishu.cn)，创建一个自建应用
2. 进入应用，添加「机器人」能力
3. 进入「事件与回调」，订阅方式选择「长连接」
4. 添加事件：`im.message.receive_v1`（接收消息）
5. 进入「权限管理」，开通以下权限：

| 权限 Scope                         | 说明                         |
| ---------------------------------- | ---------------------------- |
| `im:message.p2p_msg:readonly`      | 接收用户发给机器人的私聊消息 |
| `im:message.group_at_msg:readonly` | 接收群聊中 @机器人 的消息    |
| `im:message:send_as_bot`           | 以机器人身份发送/回复消息    |

也可以通过 JSON 直接导入权限：

```json
{
  "scopes": {
    "tenant": ["im:message.group_at_msg:readonly", "im:message.p2p_msg:readonly", "im:message:send_as_bot"],
    "user": []
  }
}
```

6. 发布应用，记下 App ID 和 App Secret

### 第三步：配置 Claude Code

CCBot 支持两种认证方式：

**方式一：OAuth 登录（推荐）** — 运行 `claude login` 完成认证，无需额外配置。

**方式二：API Key** — 编辑 `~/.claude/settings.json`：

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-xxx",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com"
  }
}
```

### 第四步：启动 CCBot

进入你的项目目录，运行：

```bash
ccbot start
```

首次运行会提示输入配置信息：

```
? Claude Code path: claude
? Feishu App ID: cli_xxx
? Feishu App Secret: ***
? Timeout in ms: 3600000
```

各项说明：

| 配置项            | 说明                                      |
| ----------------- | ----------------------------------------- |
| Claude Code path  | Claude Code 可执行文件路径，默认 `claude` |
| Feishu App ID     | 飞书应用的 App ID                         |
| Feishu App Secret | 飞书应用的 App Secret                     |
| Timeout in ms     | 单次执行超时时间，默认 1 小时             |

配置保存到当前目录的 `ccbot.json`，后续启动自动使用，无需重复填写。

**注意**：使用 API Key 模式时，CCBot 会从 `~/.claude/settings.json` 读取凭证，多个 CCBot 项目共享同一套凭证。OAuth 用户无需此配置。

### 第五步：在飞书中使用

在飞书中找到你的机器人，直接发消息即可。机器人会将消息转发给 Claude Code，并将结果回复给你。

## 命令

### CLI 命令

```bash
ccbot start    # 启动服务（首次运行会提示配置）
ccbot stop     # 停止服务
ccbot restart  # 重启服务（更新版本后使用）
ccbot delete   # 从 pm2 中删除进程
ccbot status   # 查看进程状态
ccbot logs     # 查看日志
```

### 飞书对话命令

在飞书机器人对话中发送：

| 命令       | 说明                                                 |
| ---------- | ---------------------------------------------------- |
| `/new`     | 重置会话，开始新对话                                 |
| `/stop`    | 终止当前正在执行的请求，并清空排队消息               |
| `/status`  | 查看当前会话状态（Session ID、是否执行中、队列长度） |
| `/version` | 查看 CCBot 版本号                                    |

## 配置文件

`ccbot.json` 完整结构：

```json
{
  "feishu": {
    "appId": "cli_xxx",
    "appSecret": "xxx"
  },
  "claude": {
    "bin": "claude",
    "workDir": "/path/to/project",
    "timeoutMs": 3600000
  }
}
```

| 字段             | 必填 | 默认值    | 说明                       |
| ---------------- | ---- | --------- | -------------------------- |
| feishu.appId     | 是   | -         | 飞书应用 App ID            |
| feishu.appSecret | 是   | -         | 飞书应用 App Secret        |
| claude.bin       | 否   | `claude`  | Claude Code 可执行文件路径 |
| claude.workDir   | 自动 | 当前目录  | Claude Code 工作目录       |
| claude.timeoutMs | 否   | `3600000` | 单次执行超时时间(ms)       |

**Claude API 配置**：CCBot 支持 OAuth 登录（通过 `claude login`）或 API Key 模式（通过 `~/.claude/settings.json` 中的 `env.ANTHROPIC_AUTH_TOKEN` 和 `env.ANTHROPIC_BASE_URL`）。

注意：`ccbot.json` 包含敏感信息，请勿提交到版本控制。

## 其他

- 私聊和群聊各自独立一个会话，同一个群内所有人共享同一个 Claude Code 会话
- 同一会话连续发送多条消息时，会自动排队按顺序执行
- Claude Code 输出超过 4000 字符时，会自动分段发送
- 执行超时后会自动终止并提示用户

## 许可

MIT
