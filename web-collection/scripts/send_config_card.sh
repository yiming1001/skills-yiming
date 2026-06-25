#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="/Users/zhym/.codex/skills/web-collection"

usage() {
  cat <<'EOF'
Usage:
  send_config_card.sh --chat-id oc_xxx [--as user|bot]
  send_config_card.sh --user-id ou_xxx [--as user|bot]
EOF
}

as_identity="user"
chat_id=""
user_id=""
profile=""
dry_run=0

while (($# > 0)); do
  case "$1" in
    --chat-id)
      chat_id="${2:-}"
      shift 2
      ;;
    --user-id)
      user_id="${2:-}"
      shift 2
      ;;
    --as)
      as_identity="${2:-}"
      shift 2
      ;;
    --profile)
      profile="${2:-}"
      shift 2
      ;;
    --dry-run)
      dry_run=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

[[ -n "$chat_id" || -n "$user_id" ]] || { echo "one of --chat-id or --user-id is required" >&2; exit 1; }
[[ -z "$chat_id" || -z "$user_id" ]] || { echo "--chat-id and --user-id are mutually exclusive" >&2; exit 1; }

spec_file="$(mktemp)"
card_file="$(mktemp)"
trap 'rm -f "$spec_file" "$card_file"' EXIT

node "$BASE_DIR/scripts/config_card_spec.js" > "$spec_file"
node "$BASE_DIR/scripts/build_config_card.js" --spec "$spec_file" > "$card_file"

content="$(jq -c '.' "$card_file")"
cmd=(lark-cli im +messages-send --as "$as_identity" --msg-type interactive --content "$content" --json)

if [[ -n "$profile" ]]; then
  cmd+=(--profile "$profile")
fi

if [[ -n "$chat_id" ]]; then
  cmd+=(--chat-id "$chat_id")
else
  cmd+=(--user-id "$user_id")
fi

if ((dry_run)); then
  cmd+=(--dry-run)
fi

"${cmd[@]}"
