# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mandatory Rules

- Proposals
  - When making proposals or technical decisions,
  - must rely on trustworthy data sources, such as official documentation
  - if no reliable data source or documentation is available, ask the user
  - it is acceptable to say "I don't know" in such cases
- Modifications
  - When modifying code,
  - must first list out the changes to be made,
  - only proceed after the user confirms
- Commits
  - When committing code,
  - must first pull the latest code,
  - then run `npm run lint` and only continue if there are no errors
  - write commit messages based on the diff summary
  - only then commit
- Push
  - When pushing code,
  - must confirm with the user before pushing
  - only proceed after confirmation

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
