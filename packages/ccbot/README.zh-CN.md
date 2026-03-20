# CCBot 中文文档

通过飞书机器人控制本地 Claude Code。

## 特性

- 飞书 WebSocket 长连接，无需公网 IP
- Claude Code `--print` 模式，支持会话上下文
- pm2 后台进程管理
- 按用户消息队列排队执行
- 超长输出自动分段发送
- 可配置超时时间

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

| 权限 Scope | 说明 |
|------------|------|
| `im:message.p2p_msg:readonly` | 接收用户发给机器人的私聊消息 |
| `im:message.group_at_msg:readonly` | 接收群聊中 @机器人 的消息 |
| `im:message:send_as_bot` | 以机器人身份发送/回复消息 |

6. 发布应用，记下 App ID 和 App Secret

### 第三步：启动

进入你的项目目录，运行：

```bash
ccbot start
```

首次运行会提示输入配置信息：

```
? Claude Code path: claude
? Anthropic Base URL: https://api.anthropic.com
? Anthropic Auth Token: sk-xxx
? Feishu App ID: cli_xxx
? Feishu App Secret: ***
? Timeout in ms: 300000
```

各项说明：

| 配置项 | 说明 |
|--------|------|
| Claude Code path | Claude Code 可执行文件路径，默认 `claude` |
| Anthropic Base URL | Anthropic API 地址 |
| Anthropic Auth Token | Anthropic API 认证 Token |
| Feishu App ID | 飞书应用的 App ID |
| Feishu App Secret | 飞书应用的 App Secret |
| Timeout in ms | 单次执行超时时间，默认 5 分钟 |

配置保存到当前目���的 `ccbot.json`，后续启动自动使用，无需重复填写。

### 第四步：在飞书中使用

在飞书中找到你的机器人，直接发消息即可。机器人会将消息转发给 Claude Code，并将结果回复给你。

## 命令

### CLI 命令

```bash
ccbot start    # 启动服务（首次运行会提示配置）
ccbot stop     # 停止服务
ccbot restart  # 重启服务（更新版本后使用）
ccbot status   # 查看进程状态
ccbot logs     # 查看日志
```

### 飞书对话命令

在飞书机器人对话中发送：

| 命令 | 说明 |
|------|------|
| `/new` | 重置会话，开始新对话 |
| `/status` | 查看当前会话状态（Session ID、是否执行中、队列长度） |

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
    "timeoutMs": 300000,
    "authToken": "sk-xxx",
    "baseUrl": "https://api.anthropic.com"
  }
}
```

| 字段 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| feishu.appId | 是 | - | 飞书应用 App ID |
| feishu.appSecret | 是 | - | 飞书应用 App Secret |
| claude.bin | 否 | `claude` | Claude Code 可执行文件路径 |
| claude.workDir | 自动 | 当前目录 | Claude Code 工作目录 |
| claude.timeoutMs | 否 | `300000` | 单次执行超时时间(ms) |
| claude.authToken | 是 | - | Anthropic API Token |
| claude.baseUrl | 是 | - | Anthropic API 地址 |

注意：`ccbot.json` 包含敏感信息，请勿提交到版本控制。

## 其他

- 私聊和群聊各自独立一个会话，同一个群内所有人共享同一个 Claude Code 会话
- 同一会话连续发送多条消息时，会自动排队按顺序执行
- Claude Code 输出超过 4000 字��时，会��动分段发送
- 执行超时后会自动终止并提示用户

## 许可

MIT
