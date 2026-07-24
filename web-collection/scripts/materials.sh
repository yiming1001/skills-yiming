#!/usr/bin/env bash
set -euo pipefail

COMMAND="list"
if [[ $# -gt 0 && "${1:-}" != -* ]]; then
  COMMAND="$1"
  shift
fi

BASE_URL="${WEB_COLLECTION_BRIDGE_URL:-http://127.0.0.1:19820}"
QUERY=""
PLATFORM=""
TASK_ID=""
RECORD_ID=""
KIND=""
STATUS=""
LIMIT=""
OFFSET="0"
FORMAT="json"

usage() {
  cat <<'EOF'
Usage:
  materials.sh list [options]
  materials.sh search [options]
  materials.sh show --task-id <id> [options]

Options:
  --query <text>
  --platform <name>
  --task-id <id>
  --record-id <id>
  --kind <cover|video|image>
  --status <queued|downloading|completed|failed|skipped|partial>
  --limit <1-100>
  --offset <n>
  --format <json|summary>
  --base-url <url>
EOF
}

die() {
  printf '[web-collection-materials] error: %s\n' "$*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --query|-q) QUERY="${2:-}"; shift 2 ;;
    --platform) PLATFORM="${2:-}"; shift 2 ;;
    --task-id) TASK_ID="${2:-}"; shift 2 ;;
    --record-id) RECORD_ID="${2:-}"; shift 2 ;;
    --kind) KIND="${2:-}"; shift 2 ;;
    --status) STATUS="${2:-}"; shift 2 ;;
    --limit) LIMIT="${2:-}"; shift 2 ;;
    --offset) OFFSET="${2:-}"; shift 2 ;;
    --format) FORMAT="${2:-}"; shift 2 ;;
    --base-url|--bridge-url) BASE_URL="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
done

case "$COMMAND" in
  list|search|show) ;;
  *) die "unknown command: $COMMAND (expected list, search, or show)" ;;
esac

[[ "$FORMAT" == "json" || "$FORMAT" == "summary" ]] || die "invalid format: $FORMAT"
if [[ "$COMMAND" == "show" && -z "$TASK_ID" ]]; then
  die "show requires --task-id"
fi

if [[ -z "$LIMIT" ]]; then
  if [[ "$COMMAND" == "list" ]]; then LIMIT="10"; else LIMIT="20"; fi
fi

resolve_admin_token() {
  if [[ -n "${WEB_COLLECTION_ADMIN_TOKEN:-}" ]]; then
    printf '%s' "$WEB_COLLECTION_ADMIN_TOKEN"
    return 0
  fi
  if [[ -n "${WEB_COLLECTION_ADMIN_TOKEN_FILE:-}" && -f "$WEB_COLLECTION_ADMIN_TOKEN_FILE" ]]; then
    tr -d '\r\n' <"$WEB_COLLECTION_ADMIN_TOKEN_FILE"
    return 0
  fi

  local candidate
  for candidate in \
    "${HOME}/.meixi-connector/bridge-admin-token.txt" \
    "${HOME}/Library/Application Support/rpa-app-executor/connector/state/bridge-admin-token.txt"; do
    if [[ -f "$candidate" ]]; then
      tr -d '\r\n' <"$candidate"
      return 0
    fi
  done
}

ADMIN_TOKEN="$(resolve_admin_token || true)"
[[ -n "$ADMIN_TOKEN" ]] || die "connector admin token not found"

export QUERY PLATFORM TASK_ID RECORD_ID KIND STATUS LIMIT OFFSET
QUERY_STRING="$(node - <<'NODE'
const params = new URLSearchParams()
const values = {
  query: process.env.QUERY,
  platform: process.env.PLATFORM,
  taskId: process.env.TASK_ID,
  recordId: process.env.RECORD_ID,
  kind: process.env.KIND,
  status: process.env.STATUS,
  limit: process.env.LIMIT,
  offset: process.env.OFFSET,
}
for (const [key, value] of Object.entries(values)) {
  if (value) params.set(key, value)
}
process.stdout.write(params.toString())
NODE
)"

if [[ "$COMMAND" == "show" ]]; then
  ENCODED_TASK_ID="$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$TASK_ID")"
  ENDPOINT="/api/materials/${ENCODED_TASK_ID}"
else
  ENDPOINT="/api/materials"
fi
if [[ -n "$QUERY_STRING" ]]; then ENDPOINT="${ENDPOINT}?${QUERY_STRING}"; fi

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT
HTTP_STATUS="$(curl -sS --max-time 20 -o "$TMP_FILE" -w '%{http_code}' \
  -H "x-connector-admin-token: $ADMIN_TOKEN" \
  "${BASE_URL%/}${ENDPOINT}" || true)"
RESPONSE="$(cat "$TMP_FILE")"

if [[ ! "$HTTP_STATUS" =~ ^2 ]]; then
  MESSAGE="$(node -e 'try { const d=JSON.parse(process.argv[1]); process.stdout.write(d.error || "request failed") } catch { process.stdout.write(process.argv[1] || "request failed") }' "$RESPONSE")"
  if [[ "$HTTP_STATUS" == "404" && "$ENDPOINT" == /api/materials* ]]; then
    die "HTTP 404: 当前 Connector 版本未提供素材 API，请更新或重启 Connector 后重试；不要在 Connector 目录中查找媒体文件"
  fi
  if [[ "$HTTP_STATUS" == "503" ]]; then
    die "HTTP 503: 插件未连接，无法查询素材；请打开 Chrome 并确认媒讯助手插件正在运行后重试"
  fi
  if [[ "$MESSAGE" == *"Unsupported product"* ]]; then
    die "Connector 与插件的产品握手版本不兼容，请更新或重启 Connector，并重新加载 Chrome 插件后重试"
  fi
  die "HTTP ${HTTP_STATUS:-000}: $MESSAGE"
fi

if [[ "$FORMAT" == "json" ]]; then
  printf '%s\n' "$RESPONSE"
  exit 0
fi

node - "$RESPONSE" <<'NODE'
const data = JSON.parse(process.argv[2])
const tasks = Array.isArray(data.tasks) ? data.tasks : []
console.log(`素材任务 ${data.total ?? tasks.length} 个，本次返回 ${tasks.length} 个`)
for (const task of tasks) {
  const records = Array.isArray(task.records) ? task.records : []
  const assets = records.flatMap(record => Array.isArray(record.assets) ? record.assets : [])
  const existing = assets.filter(asset => asset.exists && asset.filePath)
  console.log(`- ${task.taskId} | ${task.platform}/${task.method} | ${records.length} 条记录 | ${existing.length}/${assets.length} 个本地文件`)
  for (const record of records) {
    const paths = (record.assets || []).filter(asset => asset.exists && asset.filePath).map(asset => `${asset.kind}:${asset.filePath}`)
    console.log(`  - ${record.recordId} | ${record.title || '未命名'}${record.author ? ` | ${record.author}` : ''}`)
    for (const path of paths) console.log(`    ${path}`)
  }
}
NODE
