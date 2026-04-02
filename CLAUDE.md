# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mandatory Rules

- **Language**: English only — all code, comments, and UI text must be in English.
- **Proposals**: Base technical decisions on official documentation. If unsure, ask; saying "I don't know" is better than hallucinating.
- **Modifications**: List planned changes and get explicit user confirmation BEFORE editing files.
- **Commits**:
  1. Always `git pull` first to ensure synchronization.
  2. Run `npm run lint` — abort if it fails.
  3. Generate commit message from diff summary.
  4. Perform commit.
- **Push**: Never `git push` automatically. Always wait for explicit user approval.
- **Reliability**: Always provide a clear and complete reply. Never output an empty response.

## Common Commands

```bash
npm run build         # Build all packages
npm test              # Run tests (vitest)
npm run lint          # build + test + prettier:fix + eslint:fix
npm run cz            # Conventional commits
```

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
