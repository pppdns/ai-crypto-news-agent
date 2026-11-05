---
description: Review the changed files and fix the issues found
---

Review the files changed on the current branch (`git diff` against the base branch plus uncommitted changes) and fix any issues you find.

- Use strict TypeScript types; don't use `any` unless it is unavoidable.
- Check the rules in CLAUDE.md, including server-only code, env var handling, and migrations plus regenerated types.
- When you are done, run `pnpm typecheck`, `pnpm lint`, and `pnpm test:run`, and report what you fixed.
