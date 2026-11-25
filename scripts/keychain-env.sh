#!/usr/bin/env bash
# Keeps SESSION_SECRET in the macOS Keychain instead of a plain-text file.
#   scripts/keychain-env.sh init           generate a random secret and store it (no-op when present)
#   scripts/keychain-env.sh run <command>  run <command> with SESSION_SECRET taken from the Keychain
set -euo pipefail

SERVICE="${AITL_KEYCHAIN_SERVICE:-aitl-session-secret}"
ACCOUNT="${USER:-aitl}"

case "${1:-}" in
  init)
    if security find-generic-password -s "$SERVICE" >/dev/null 2>&1; then
      echo "Secret '$SERVICE' is already in the Keychain."
      exit 0
    fi
    security add-generic-password -a "$ACCOUNT" -s "$SERVICE" -w "$(openssl rand -base64 48)"
    echo "Stored a new random secret '$SERVICE' in the Keychain."
    ;;
  run)
    shift
    if [ "$#" -eq 0 ]; then
      echo "Usage: $0 run <command> [args...]" >&2
      exit 64
    fi
    if ! SESSION_SECRET="$(security find-generic-password -s "$SERVICE" -w 2>/dev/null)"; then
      echo "Secret '$SERVICE' not found in the Keychain. Run: npm run keychain:init" >&2
      exit 1
    fi
    export SESSION_SECRET
    exec "$@"
    ;;
  *)
    echo "Usage: $0 init | run <command> [args...]" >&2
    exit 64
    ;;
esac
