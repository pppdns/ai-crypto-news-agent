#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook: formats a file with Prettier right after Claude edits it.
 *
 * Mirrors what lint-staged does at commit time, so diffs stay clean while Claude works.
 * Reads the hook payload (JSON) from stdin, takes `tool_input.file_path`, and runs the
 * project's Prettier on it. Unsupported or ignored files are skipped (`--ignore-unknown`,
 * `.prettierignore`). Never blocks Claude: any failure exits 0 with a note on stderr.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(input.trim() || '{}');
    const filePath = payload?.tool_input?.file_path;
    const projectDir = process.env.CLAUDE_PROJECT_DIR || payload?.cwd || process.cwd();
    const prettierBin = path.join(projectDir, 'node_modules', '.bin', 'prettier');

    // Only format files inside this project, and only when dependencies are installed
    if (!filePath || !existsSync(filePath) || !existsSync(prettierBin)) process.exit(0);
    const relative = path.relative(projectDir, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) process.exit(0);

    const result = spawnSync(prettierBin, ['--write', '--ignore-unknown', '--log-level', 'warn', filePath], {
      cwd: projectDir,
      encoding: 'utf8',
    });
    if (result.status !== 0) process.stderr.write(`prettier skipped ${relative}: ${result.stderr || result.error}\n`);
  } catch (error) {
    process.stderr.write(`format hook error: ${error}\n`);
  }
  process.exit(0);
});
