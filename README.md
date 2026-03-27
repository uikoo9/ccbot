# CCBot

Control your local Claude Code via IM bot (Feishu / WeCom / DingTalk / Slack / Telegram / Discord / Teams / WhatsApp, etc.)

[中文文档](https://github.com/uikoo9/ccbot/blob/main/packages/ccbot/README.zh-CN.md)

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

| Scope                              | Description                             |
| ---------------------------------- | --------------------------------------- |
| `im:message.p2p_msg:readonly`      | Receive direct messages sent to the bot |
| `im:message.group_at_msg:readonly` | Receive @bot messages in group chats    |
| `im:message:send_as_bot`           | Send/reply messages as the bot          |

You can also import permissions via JSON:

```json
{
  "scopes": {
    "tenant": ["im:message.group_at_msg:readonly", "im:message.p2p_msg:readonly", "im:message:send_as_bot"],
    "user": []
  }
}
```

6. Publish the app, note down App ID and App Secret

## Configure Claude Code

Ensure Claude Code is installed and configured with your API credentials.

Edit `~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-xxx",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com"
  }
}
```

## Usage

Navigate to your project directory and run:

```bash
ccbot start
```

On first run, you'll be prompted for configuration:

```
? Claude Code path: claude
? Feishu App ID: cli_xxx
? Feishu App Secret: ***
? Timeout in ms: 3600000
```

Config is saved to `ccbot.json` in the current directory. Subsequent runs skip the prompts.

**Note**: CCBot reads Claude API credentials from `~/.claude/settings.json`, allowing multiple CCBot projects to share the same credentials.

### Commands

```bash
ccbot start    # Start server (prompts config on first run)
ccbot stop     # Stop server
ccbot restart  # Restart server (use after updating)
ccbot delete   # Delete ccbot process from pm2
ccbot status   # Show process status
ccbot logs     # Show server logs
```

### Chat Commands

Send these in the Feishu bot conversation:

| Command    | Description                              |
| ---------- | ---------------------------------------- |
| `/new`     | Reset session, start a new conversation  |
| `/stop`    | Stop the current request and clear queue |
| `/status`  | Show current session status              |
| `/version` | Show CCBot version                       |

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
    "timeoutMs": 3600000
  }
}
```

**Claude API Config**: CCBot reads API credentials from `env.ANTHROPIC_AUTH_TOKEN` and `env.ANTHROPIC_BASE_URL` in `~/.claude/settings.json`.

## License

MIT
