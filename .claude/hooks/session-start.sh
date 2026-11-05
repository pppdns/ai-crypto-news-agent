#!/bin/bash
# Claude Code SessionStart hook: installs npm dependencies in Claude Code cloud sessions,
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

  # npm install (not ci) reuses the cached node_modules from the container snapshot
  npm install --no-audit --no-fund

  sha256sum .claude/hooks/session-start.sh package.json package-lock.json .nvmrc 2>/dev/null > "$hashes" || rm -f "$hashes"
fi
