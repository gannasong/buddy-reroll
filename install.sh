#!/bin/bash
# buddy-reroll installer for Claude Code
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="${HOME}/.claude"

# Check bun
if ! command -v bun &> /dev/null; then
  echo "Error: bun runtime is required. Install: https://bun.sh"
  exit 1
fi

# Copy files
mkdir -p "${CLAUDE_DIR}/commands" "${CLAUDE_DIR}/scripts"
cp "${SCRIPT_DIR}/buddy-reroll.js" "${CLAUDE_DIR}/scripts/buddy-reroll.js"
cp "${SCRIPT_DIR}/buddy-reroll.md" "${CLAUDE_DIR}/commands/buddy-reroll.md"

echo "Installed! Restart Claude Code and run /buddy-reroll"
