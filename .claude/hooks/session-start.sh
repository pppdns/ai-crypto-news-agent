#!/bin/bash
# Claude Code SessionStart hook: installs pnpm dependencies in Claude Code cloud sessions,
# so tests, lint, typecheck and the Prettier PostToolUse hook work from the first prompt.
# Local sessions are skipped; developers manage their own node_modules there.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Run the install only if a listed file has changed since the install last succeeded
hashes=node_modules/.session-start.sha256
if ! sha256sum --check --status "$hashes" 2>/dev/null; then
  # Delete the old hashes first, so a failed install runs again next time
  rm -f "$hashes"

  # Cloud images ship npm but not always pnpm; Corepack (bundled with Node 22) provides the
  # version pinned in package.json's "packageManager" field
  if ! command -v pnpm >/dev/null 2>&1; then
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack enable pnpm
  fi

  # pnpm install reuses the cached node_modules from the container snapshot;
  # --frozen-lockfile fails instead of silently rewriting pnpm-lock.yaml
  pnpm install --frozen-lockfile

  sha256sum .claude/hooks/session-start.sh package.json pnpm-lock.yaml pnpm-workspace.yaml .nvmrc 2>/dev/null > "$hashes" || rm -f "$hashes"
fi
