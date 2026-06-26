#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_SCRIPT="${SCRIPT_DIR}/hot_list_skill.js"

usage() {
  cat <<'EOF'
Usage:
  run.sh <command> [options]

Commands:
  show-current-preferences
  set-backend-token
  add-or-update-binding
  set-default-binding
  preflight-check
  open-local-config-page
  show-platform-options
  show-platform-preferences
  set-platform-preferences
  show-runtime-schema
  execute

Examples:
  bash run.sh set-backend-token --token "YOUR_BACKEND_TOKEN"
  bash run.sh add-or-update-binding --name "主业务表" --base-token "appxxxx" --api-key "personal_auth_code" --make-default
  bash run.sh preflight-check --platform-id douyin
  bash run.sh open-local-config-page
  bash run.sh show-platform-options --platform-id douyin
  bash run.sh show-platform-options --platform-id douyin --primary-tag 628
  bash run.sh show-current-preferences
  bash run.sh set-platform-preferences --platform-id douyin --request-params '{"func":"high_play","page_size":40,"data_window":24}' --collect-times 2 --deduplication-enabled true
  bash run.sh show-platform-preferences --platform-id douyin
  bash run.sh show-runtime-schema --platform-id douyin
  bash run.sh execute --platform-id douyin --request-params '{"page":1}'
EOF
}

if [[ ! -f "$NODE_SCRIPT" ]]; then
  echo "missing script: $NODE_SCRIPT" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required but not found in PATH" >&2
  exit 1
fi

if [[ $# -eq 0 ]]; then
  usage
  exit 0
fi

case "${1:-}" in
  -h|--help|help)
    usage
    exit 0
    ;;
  open-local-config-page)
    shift 1
    exec node "${SCRIPT_DIR}/local_config_server.js" "$@"
    ;;
esac

exec node "$NODE_SCRIPT" "$@"
