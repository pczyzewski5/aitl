#!/usr/bin/env bash
# PreToolUse hook for the Bash tool. Exit 2 blocks the call and feeds stderr back to the model;
# any other non-zero exit code does NOT block. See README.md next to this file.

if ! command -v jq >/dev/null 2>&1; then
  echo "BLOCKED: jq is not installed, so the Bash command cannot be inspected." >&2
  exit 2
fi

command=$(jq -r '.tool_input.command // empty')

if [ -z "$command" ]; then
  exit 0
fi

block() {
  echo "BLOCKED by .claude/hooks/pre-tool-use.sh: $1" >&2
  exit 2
}

if printf '%s' "$command" | grep -Eq '(curl|wget)[^|]*\|[[:space:]]*(sudo[[:space:]]+)?(ba|z)?sh([[:space:]]|$)'; then
  block "piping curl/wget into a shell"
fi

if printf '%s' "$command" | grep -Eq '(^|[;&|([:space:]])rm[[:space:]]+(-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)([[:space:]]|$)'; then
  block "recursive rm"
fi

if printf '%s' "$command" | grep -Eq '(~|\$HOME|\$\{HOME\}|/Users/[^[:space:]/]+|/home/[^[:space:]/]+|/root)/\.(ssh|aws)([/[:space:]]|$)'; then
  block "access to ~/.ssh or ~/.aws"
fi

without_templates=$(printf '%s' "$command" | sed -e 's/\.env\.example//g' -e 's/\.env\.template//g')

if printf '%s' "$without_templates" | grep -Eq '(^|[^[:alnum:]_])\.env([^[:alnum:]_]|$)'; then
  block "access to .env files (.env.example and .env.template are allowed)"
fi

exit 0
