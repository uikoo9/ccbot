# CCBot

Control your local Claude Code via Feishu (Lark) bot.

[中文文档](https://github.com/uikoo9/ccbot/blob/main/packages/ccbot/README.zh-CN.md)

## Features

- Feishu WebSocket long connection — no public IP required
- Claude Code `--print` mode with session context
- pm2 background process management
- Per-user message queue
- Auto-split long messages
- Configurable timeout

## Install

```bash
npm install -g @ccbot/cli
```

## Setup Feishu Bot

1. Create a self-built app on [Feishu Open Platform](https://open.feishu.cn)
2. Add "Bot" capability
3. Event subscription → set to "Long Connection"
4. Add event: `im.message.receive_v1`
5. Enable the following permissions:

| Scope                              | Description                                 |
| ---------------------------------- | ------------------------------------------- |
| `im:message.p2p_msg:readonly`      | Receive direct messages sent to the bot     |
| `im:message.group_at_msg:readonly` | Receive @bot messages in group chats        |
| `im:message:send_as_bot`           | Send/reply messages as the bot              |
| `im:message:update`                | Update message content for streaming output |

You can also import permissions via JSON:

```json
{
  "scopes": {
    "tenant": [
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:send_as_bot",
      "im:message:update"
    ],
    "user": []
  }
}
```

6. Publish the app, note down App ID and App Secret

## Usage

Navigate to your project directory and run:

```bash
ccbot start
```

On first run, you'll be prompted for configuration:

```
? Claude Code path: claude
? Anthropic Base URL: https://api.anthropic.com
? Anthropic Auth Token: sk-xxx
? Feishu App ID: cli_xxx
? Feishu App Secret: ***
? Timeout in ms: 300000
```

Config is saved to `ccbot.json` in the current directory. Subsequent runs skip the prompts.

### Commands

```bash
ccbot start    # Start server (prompts config on first run)
ccbot stop     # Stop server
ccbot restart  # Restart server (use after updating)
ccbot status   # Show process status
ccbot logs     # Show server logs
```

### Chat Commands

Send these in the Feishu bot conversation:

| Command   | Description                             |
| --------- | --------------------------------------- |
| `/new`    | Reset session, start a new conversation |
| `/status` | Show current session status             |

## Config

`ccbot.json`:

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

## License

MIT
