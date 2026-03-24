# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CCBot is a CLI tool that bridges Feishu (Lark) messaging with a local Claude Code instance. Users send messages to a Feishu bot, which forwards them to Claude Code's `--print` mode via WebSocket long connection (no public IP required), and returns responses through Feishu.

## Monorepo Structure

Lerna + Nx + npm workspaces monorepo with two packages:

- **`packages/ccbot`** (`@ccbot/cli`) — The main CLI tool. ESM, TypeScript compiled with `tsc` to `dist/`. Published to npm.
- **`packages/ccbot-index`** (`@ccbot/index`) — Marketing website. Next.js 16, React 19, next-intl for i18n. Private, not published.

## Build & Development Commands

```bash
# Build all packages
npm run build

# Run tests (vitest)
npm test

# Lint & format
npm run prettier:fix
npm run eslint:fix
npm run lint          # build + test + prettier:fix + eslint:fix

# Dev the website
npm run index:dev

# Publish
npm run pb            # lerna publish

# Conventional commits
npm run cz
```

Nx caches build/test tasks. Build tasks depend on upstream builds (`^build`).

## Git Conventions

- **Conventional commits** enforced by commitlint (`@commitlint/config-conventional`).
- **Pre-commit hook** (Husky + lint-staged): runs prettier, eslint, and `vitest related --run` on changed files.
- Use `npm run cz` (Commitizen) for guided commit messages.
- Lerna publishes from `main` branch only.

## Publishing a New Version

When the user says "发布新版本" (publish a new version):

1. Run `git describe --tags --abbrev=0` to find the latest tag (e.g. `v0.2.2`)
2. Increment the patch version by 1 (e.g. `0.2.2` → `0.2.3`)
3. Show the command to the user for confirmation: `npx lerna publish 0.2.3 --yes`
4. Only execute the command after the user explicitly confirms

## Updating Documentation

When the user says "更新说明文档" (update documentation):

Update the following files to reflect the latest changes:

- `README.md`
- `packages/ccbot/README.md`
- `packages/ccbot/README.zh-CN.md`
- `packages/ccbot-index/messages/en.json`
- `packages/ccbot-index/messages/zh.json`

After updating, run `npm run lint` to ensure there are no errors.

## Architecture

### Message Flow

```
Feishu User → Feishu Cloud → WebSocket → CCBot Server (pm2) → claude --print → Feishu API → User
```

### Key Source Files (`packages/ccbot/src/`)

| File         | Role                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `server.ts`  | Main pm2 server entry. Loads config, wires Feishu events to Claude, handles slash commands                      |
| `claude.ts`  | Spawns `claude --print` as child process with session/timeout/abort support                                     |
| `feishu.ts`  | Feishu SDK wrapper: WebSocket client, event dispatch, message reply with Markdown detection, 4000-char chunking |
| `session.ts` | `SessionManager` + `UserSession`: per-chat-ID sessions with FIFO message queue, busy flag, AbortController      |
| `pm2.ts`     | pm2 lifecycle helpers (connect, start, reload, save)                                                            |
| `start.ts`   | CLI command implementations (start/stop/restart/delete/status), interactive config via inquirer                 |

### Key Patterns

- **Per-user sessions**: Each Feishu chat ID maps to a `UserSession` with a UUID-based Claude session ID. Supports `--resume` for continuing conversations and `--session-id` for new ones.
- **Message queue**: FIFO per user. If Claude is busy, messages queue with position feedback. Processed sequentially to avoid concurrent Claude invocations on the same session.
- **Process management**: pm2 runs the server as daemon, process named `ccbot-<project-dir>`.
- **Claude invocation**: `claude --print --output-format text --dangerously-skip-permissions` with configurable timeout (default 1 hour). Reads `ANTHROPIC_AUTH_TOKEN` and `ANTHROPIC_BASE_URL` from `~/.claude/settings.json`.
- **Feishu output**: Auto-detects Markdown via regex, sends as interactive cards vs plain text. Strips image markdown to link syntax. Auto-chunks at 4000 chars.
