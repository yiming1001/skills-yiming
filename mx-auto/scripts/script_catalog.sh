#!/usr/bin/env bash
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PREFERENCE_SCRIPT="$SKILL_DIR/scripts/export_preference.sh"
LOCAL_LOOP_SCRIPT="$SKILL_DIR/scripts/local_dispatch_loop.sh"
DEFAULT_RUNTIME_BASE_URLS=(
  "http://127.0.0.1:8877"
  "http://localhost:8877"
  "http://127.0.0.1:8878"
  "http://localhost:8878"
  "http://127.0.0.1:8879"
  "http://localhost:8879"
)

ACTION="${1:-list}"
if [[ $# -gt 0 ]]; then
  shift
fi

SCRIPT_NAME=""
INPUT_JSON=""
LOCAL_BASE_URL=""
APP_HOME=""
WAIT_VALUE=""
LEASE_TTL_MS=""
FORMAT="text"
BROWSER_PROFILE_ID=""
EXPORT_TARGET=""
AUTHORIZATION_ID=""
BITABLE_EXPORT_MODE=""
USE_LAST_INPUT="false"

usage() {
  cat <<'EOF'
Usage:
  script_catalog.sh list [options]
  script_catalog.sh show <script-name> [options]
  script_catalog.sh run <script-name> [options]

Options:
  --input-json <json>      JSON object passed as inputOverrides when running
  --local-base-url <url>   Runtime base URL
  --app-home <path>        Runtime app home
  --wait <true|false>      default: true
  --lease-ttl-ms <n>       default: 60000
  --format <text|json>     default: text
  --browser-profile-id <id>
                          Runtime browser sandbox/profile id
  --export-target <target> file_csv|file_snapshot|external_bitable|personal_bitable
  --authorization-id <id>  Authorization id for personal_bitable export
  --bitable-export-mode <mode>
                          existing_table|new_table
  --use-last-input         Allow lastUsedInput to satisfy required business params
  -h, --help
EOF
}

die() {
  echo "$*" >&2
  exit 1
}

pref_get() {
  local key="$1"
  if [[ -f "$PREFERENCE_SCRIPT" ]]; then
    bash "$PREFERENCE_SCRIPT" get "$key" 2>/dev/null || true
  fi
}

normalize_bool() {
  local raw="${1:-}"
  if [[ -z "$raw" ]]; then
    printf '%s\n' ""
    return 0
  fi
  local lower
  lower="$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]')"
  case "$lower" in
    true|1|yes|y|on) printf '%s\n' "true" ;;
    false|0|no|n|off) printf '%s\n' "false" ;;
    *) die "invalid boolean value: $raw" ;;
  esac
}

normalize_positive_integer() {
  local raw="${1:-}"
  if [[ -z "$raw" ]]; then
    printf '%s\n' ""
    return 0
  fi
  [[ "$raw" =~ ^[0-9]+$ && "$raw" != "0" ]] || die "invalid positive integer: $raw"
  printf '%s\n' "$raw"
}

resolve_default_app_home() {
  case "$(uname -s 2>/dev/null || printf unknown)" in
    Darwin)
      printf '%s\n' "${HOME}/Library/Application Support/rpa-app-executor"
      ;;
    Linux)
      printf '%s\n' "${XDG_DATA_HOME:-${HOME}/.local/share}/rpa-app-executor"
      ;;
    MINGW*|MSYS*|CYGWIN*)
      printf '%s\n' "${APPDATA:-${HOME}/AppData/Roaming}/rpa-app-executor"
      ;;
    *)
      printf '%s\n' "${HOME}/.local/share/rpa-app-executor"
      ;;
  esac
}

resolve_app_home() {
  local explicit="${1:-}"
  if [[ -n "$explicit" ]]; then
    printf '%s\n' "$explicit"
    return 0
  fi
  if [[ -n "${MX_AUTO_APP_HOME:-}" ]]; then
    printf '%s\n' "$MX_AUTO_APP_HOME"
    return 0
  fi
  if [[ -n "${RPA_APP_HOME:-}" ]]; then
    printf '%s\n' "$RPA_APP_HOME"
    return 0
  fi
  local stored
  stored="$(pref_get defaultAppHome)"
  if [[ -n "$stored" ]]; then
    printf '%s\n' "$stored"
    return 0
  fi
  resolve_default_app_home
}

discover_runtime_admin_token() {
  local app_home="${1:-}"
  local env_token="${MX_APP_RUNTIME_ADMIN_TOKEN:-${RPA_RUNTIME_ADMIN_TOKEN:-}}"
  if [[ -n "$env_token" ]]; then
    printf '%s\n' "$env_token"
    return 0
  fi

  node -e '
const fs = require("node:fs");
const path = require("node:path");
const file = path.join(process.argv[1], "runtime", "admin-token.json");
try {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const token = typeof raw?.token === "string" ? raw.token.trim() : "";
  if (token) process.stdout.write(token);
} catch {}
' "$app_home"
}

discover_local_base_url() {
  local preferred="${1:-}"
  local candidates=()
  [[ -n "$preferred" ]] && candidates+=("$preferred")
  [[ -n "${MX_APP_RUNTIME_BASE_URL:-}" ]] && candidates+=("$MX_APP_RUNTIME_BASE_URL")
  [[ -n "${RPA_RUNTIME_BASE_URL:-}" ]] && candidates+=("$RPA_RUNTIME_BASE_URL")
  [[ -n "$(pref_get defaultLocalBaseUrl)" ]] && candidates+=("$(pref_get defaultLocalBaseUrl)")
  candidates+=("${DEFAULT_RUNTIME_BASE_URLS[@]}")

  local candidate
  for candidate in "${candidates[@]}"; do
    [[ -n "$candidate" ]] || continue
    if curl -fsS --max-time 2 "$candidate/health" >/dev/null 2>&1; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  printf '%s\n' "${DEFAULT_RUNTIME_BASE_URLS[0]}"
}

join_url() {
  node -e '
const base = String(process.argv[1] || "").trim().replace(/\/+$/, "");
const path = String(process.argv[2] || "").trim();
process.stdout.write(`${base}${path.startsWith("/") ? path : `/${path}`}`);
' "$1" "$2"
}

validate_input_json() {
  local raw="${1:-}"
  if [[ -z "$raw" ]]; then
    printf '%s\n' ""
    return 0
  fi
  node -e '
const value = JSON.parse(process.argv[1]);
if (!value || typeof value !== "object" || Array.isArray(value)) {
  console.error("--input-json must be a JSON object");
  process.exit(1);
}
process.stdout.write(JSON.stringify(value));
' "$raw"
}

normalize_export_target() {
  local raw="${1:-}"
  if [[ -z "$raw" ]]; then
    printf '%s\n' ""
    return 0
  fi
  case "$raw" in
    file_csv|file_snapshot|external_bitable|personal_bitable) printf '%s\n' "$raw" ;;
    *) die "invalid export target: $raw" ;;
  esac
}

normalize_bitable_export_mode() {
  local raw="${1:-}"
  if [[ -z "$raw" ]]; then
    printf '%s\n' ""
    return 0
  fi
  case "$raw" in
    existing_table|new_table) printf '%s\n' "$raw" ;;
    *) die "invalid bitable export mode: $raw" ;;
  esac
}

fetch_catalog() {
  local base_url="$1"
  local token="$2"
  curl -fsS \
    -H "Authorization: Bearer $token" \
    "$(join_url "$base_url" "/examples/catalog")"
}

persist_script_snapshot() {
  local raw_json="$1"
  local snapshot_json
  snapshot_json="$(node -e '
const payload = JSON.parse(process.argv[1]);
const examples = Array.isArray(payload.examples) ? payload.examples : [];
const scripts = examples
  .map((script) => ({
    name: typeof script.name === "string" ? script.name : "",
    workflowId: typeof script.workflowId === "string" ? script.workflowId : "",
    platform: typeof script.platform === "string" ? script.platform : "",
    platformLabel: typeof script.platformLabel === "string" ? script.platformLabel : "",
    feature: typeof script.feature === "string" ? script.feature : "",
    featureLabel: typeof script.featureLabel === "string" ? script.featureLabel : "",
    method: typeof script.method === "string" ? script.method : "",
    displayName: typeof script.displayName === "string" ? script.displayName : "",
    description: typeof script.description === "string" ? script.description : "",
    runner: typeof script.runner === "string" ? script.runner : "",
    inputSchema: Array.isArray(script.inputSchema) ? script.inputSchema : [],
    inputDefaults: script.inputDefaults && typeof script.inputDefaults === "object" && !Array.isArray(script.inputDefaults) ? script.inputDefaults : {},
    lastUsedInput: script.lastUsedInput && typeof script.lastUsedInput === "object" && !Array.isArray(script.lastUsedInput) ? script.lastUsedInput : {},
    exportEnabled: script.exportEnabled === true,
    exportTables: Array.isArray(script.exportTables) ? script.exportTables : [],
    updatedAt: typeof script.updatedAt === "string" ? script.updatedAt : "",
  }))
  .filter((script) => script.name);
process.stdout.write(JSON.stringify({
  loadedAt: new Date().toISOString(),
  sourcePath: "/examples/catalog",
  scriptCount: scripts.length,
  scripts,
}));
' "$raw_json")"
  bash "$PREFERENCE_SCRIPT" set-script-snapshot "$snapshot_json" >/dev/null
}

emit_list() {
  local raw_json="$1"
  local format="$2"
  node -e '
const payload = JSON.parse(process.argv[1]);
const format = process.argv[2];
const scripts = Array.isArray(payload.examples) ? payload.examples : [];
const normalized = scripts.map((script) => ({
  name: String(script?.name || ""),
  workflowId: String(script?.workflowId || ""),
  platform: String(script?.platformLabel || script?.platform || ""),
  runner: String(script?.runner || ""),
  description: String(script?.description || ""),
  updatedAt: String(script?.updatedAt || ""),
})).filter((script) => script.name);
if (format === "json") {
  process.stdout.write(JSON.stringify({ ok: true, mode: "scripts_list", scriptCount: normalized.length, scripts: normalized }, null, 2) + "\n");
  process.exit(0);
}
const lines = [`当前可用脚本（${normalized.length}）`];
for (const [index, script] of normalized.entries()) {
  lines.push(`${index + 1}. ${script.name}`);
  lines.push(`平台：${script.platform || "-"}`);
  lines.push(`Runner：${script.runner || "-"}`);
}
process.stdout.write(lines.join("\n") + "\n");
' "$raw_json" "$format"
}

emit_show() {
  local raw_json="$1"
  local script_name="$2"
  local format="$3"
  local input_json="${4:-}"
  local use_last_input="${5:-false}"
  local browser_profile_id="${6:-}"
  local export_target="${7:-}"
  local authorization_id="${8:-}"
  local bitable_export_mode="${9:-}"
  node -e '
const payload = JSON.parse(process.argv[1]);
const scriptName = process.argv[2];
const format = process.argv[3];
const inputRaw = process.argv[4];
const useLastInput = process.argv[5] === "true";
const runtimeOptions = {
  browserProfileId: process.argv[6] || "",
  exportTarget: process.argv[7] || "",
  authorizationId: process.argv[8] || "",
  bitableExportMode: process.argv[9] || "",
};
const scripts = Array.isArray(payload.examples) ? payload.examples : [];
const script = scripts.find((item) => item?.name === scriptName);
if (!script) {
  const names = scripts.map((item) => item?.name).filter(Boolean);
  console.error(`script not found: ${scriptName}${names.length ? `; available scripts: ${names.join(", ")}` : ""}`);
  process.exit(2);
}
const inputOverrides = inputRaw ? JSON.parse(inputRaw) : {};
const buildParamPlan = (script, inputOverrides, useLastInput, runtimeOptions) => {
  const schema = Array.isArray(script.inputSchema) ? script.inputSchema : [];
  const defaults = script.inputDefaults && typeof script.inputDefaults === "object" && !Array.isArray(script.inputDefaults) ? script.inputDefaults : {};
  const lastUsed = script.lastUsedInput && typeof script.lastUsedInput === "object" && !Array.isArray(script.lastUsedInput) ? script.lastUsedInput : {};
  const requiredBusinessKeys = new Set(["keyword", "link", "url"]);
  const dateKeys = ["dateMode", "relativeDays", "numericDayOffsets", "targetDates"];
  const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const hasValue = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  };
  const fieldMap = new Map();
  for (const field of schema) {
    const key = typeof field?.key === "string" ? field.key : typeof field?.name === "string" ? field.name : "";
    if (key) fieldMap.set(key, field);
  }
  for (const key of Object.keys(defaults)) {
    if (!fieldMap.has(key)) fieldMap.set(key, { key, required: false });
  }
  for (const key of Object.keys(inputOverrides)) {
    if (!fieldMap.has(key)) fieldMap.set(key, { key, required: false });
  }
  const looksDateScoped = dateKeys.some((key) => fieldMap.has(key))
    || /statistic|dashboard|overview|live\.detail|history/i.test(String(script.name || script.workflowId || ""));
  const dateValueKeys = ["relativeDays", "numericDayOffsets", "targetDates"];
  const hasDateValue = dateValueKeys.some((key) => {
    if (hasValue(inputOverrides[key])) return true;
    if (useLastInput && hasValue(lastUsed[key])) return true;
    return false;
  });
  const requiredParams = [];
  const defaultParams = [];
  const valueSource = (key) => {
    if (hasValue(inputOverrides[key])) return { source: "inputOverrides", value: inputOverrides[key] };
    if (useLastInput && hasValue(lastUsed[key])) return { source: "lastUsedInput", value: lastUsed[key] };
    if (hasOwn(defaults, key)) return { source: "inputDefaults", value: defaults[key] };
    return { source: "", value: undefined };
  };
  for (const [key, field] of fieldMap.entries()) {
    const resolved = valueSource(key);
    const isBusinessRequired = requiredBusinessKeys.has(key);
    const isDateKey = dateKeys.includes(key);
    if (isBusinessRequired) {
      requiredParams.push({
        key,
        label: field.label || field.title || "",
        kind: field.kind || field.type || "",
        source: resolved.source,
        value: resolved.source ? resolved.value : undefined,
        satisfied: ["inputOverrides", "lastUsedInput"].includes(resolved.source),
        reason: "business_target",
      });
    } else {
      defaultParams.push({
        key,
        label: field.label || field.title || "",
        kind: field.kind || field.type || "",
        source: resolved.source,
        value: resolved.source ? resolved.value : undefined,
        requiredByManifest: field.required === true,
      });
    }
  }
  if (looksDateScoped) {
    requiredParams.push({
      key: "dateScope",
      label: "日期范围",
      kind: "date_scope",
      source: hasDateValue ? "inputOverrides_or_lastUsedInput" : "",
      satisfied: hasDateValue,
      reason: "date_scope",
    });
  }
  defaultParams.push(
    {
      key: "browserProfileId",
      source: runtimeOptions.browserProfileId ? "cli" : "runtime_or_preferences",
      value: runtimeOptions.browserProfileId || undefined,
      reason: "sandbox_default",
      runtime: true,
    },
    {
      key: "exportTarget",
      source: runtimeOptions.exportTarget ? "cli" : "script_or_runtime_default",
      value: runtimeOptions.exportTarget || undefined,
      reason: "export_default",
      runtime: true,
    },
    {
      key: "authorizationId",
      source: runtimeOptions.authorizationId ? "cli" : "script_or_runtime_default",
      value: runtimeOptions.authorizationId || undefined,
      reason: "export_authorization_default",
      runtime: true,
    },
    {
      key: "bitableExportMode",
      source: runtimeOptions.bitableExportMode ? "cli" : "script_or_runtime_default",
      value: runtimeOptions.bitableExportMode || undefined,
      reason: "export_default",
      runtime: true,
    }
  );
  if (runtimeOptions.exportTarget === "personal_bitable" && !runtimeOptions.authorizationId) {
    requiredParams.push({
      key: "authorizationId",
      label: "Authorization ID",
      kind: "runtime",
      source: "",
      satisfied: false,
      reason: "personal_bitable_export",
      runtime: true,
    });
  }
  const missingRequiredParams = [...new Set(requiredParams
    .filter((param) => param.satisfied !== true)
    .map((param) => param.key))];
  return { requiredParams, defaultParams, missingRequiredParams };
};
const paramPlan = buildParamPlan(script, inputOverrides, useLastInput, runtimeOptions);
if (format === "json") {
  process.stdout.write(JSON.stringify({ ok: true, mode: "scripts_show", script, paramPlan }, null, 2) + "\n");
  process.exit(0);
}
const schema = Array.isArray(script.inputSchema) ? script.inputSchema : [];
const lines = [];
lines.push(`脚本：${script.name}`);
lines.push(`Workflow：${script.workflowId || "-"}`);
lines.push(`平台：${script.platformLabel || script.platform || "-"}`);
lines.push(`Runner：${script.runner || "-"}`);
lines.push(`描述：${script.description || "-"}`);
lines.push("输入：");
if (schema.length) {
  for (const field of schema) lines.push(`- ${field.key || field.name || ""}${field.required ? " *" : ""}`);
} else {
  lines.push("-");
}
lines.push("必填参数：");
if (paramPlan.requiredParams.length) {
  for (const param of paramPlan.requiredParams) {
    lines.push(`- ${param.key}${param.satisfied ? " (已提供)" : " (缺失)"}`);
  }
} else {
  lines.push("-");
}
lines.push("默认参数：");
if (paramPlan.defaultParams.length) {
  for (const param of paramPlan.defaultParams) lines.push(`- ${param.key}`);
} else {
  lines.push("-");
}
if (paramPlan.missingRequiredParams.length) {
  lines.push(`缺失必填参数：${paramPlan.missingRequiredParams.join(", ")}`);
}
process.stdout.write(lines.join("\n") + "\n");
' "$raw_json" "$script_name" "$format" "$input_json" "$use_last_input" "$browser_profile_id" "$export_target" "$authorization_id" "$bitable_export_mode"
}

build_run_payload() {
  local script_name="$1"
  local input_json="$2"
  local browser_profile_id="$3"
  local export_target="$4"
  local authorization_id="$5"
  local bitable_export_mode="$6"
  node -e '
const name = process.argv[1];
const inputRaw = process.argv[2];
const browserProfileId = process.argv[3];
const exportTarget = process.argv[4];
const authorizationId = process.argv[5];
const bitableExportMode = process.argv[6];
const payload = { name };
if (inputRaw) payload.inputOverrides = JSON.parse(inputRaw);
if (browserProfileId) payload.browserProfileId = browserProfileId;
if (exportTarget) payload.exportTarget = exportTarget;
if (authorizationId) payload.authorizationId = authorizationId;
if (bitableExportMode) payload.bitableExportMode = bitableExportMode;
process.stdout.write(JSON.stringify(payload));
' "$script_name" "$input_json" "$browser_profile_id" "$export_target" "$authorization_id" "$bitable_export_mode"
}

missing_required_params() {
  local raw_json="$1"
  local script_name="$2"
  local input_json="$3"
  local use_last_input="$4"
  local browser_profile_id="$5"
  local export_target="$6"
  local authorization_id="$7"
  local bitable_export_mode="$8"
  local show_json
  show_json="$(emit_show "$raw_json" "$script_name" "json" "$input_json" "$use_last_input" "$browser_profile_id" "$export_target" "$authorization_id" "$bitable_export_mode")"
  node -e '
const show = JSON.parse(process.argv[1]);
const missing = Array.isArray(show?.paramPlan?.missingRequiredParams) ? show.paramPlan.missingRequiredParams : [];
process.stdout.write(missing.join(","));
' "$show_json"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input-json)
      INPUT_JSON="${2:-}"
      shift 2
      ;;
    --local-base-url|--base-url)
      LOCAL_BASE_URL="${2:-}"
      shift 2
      ;;
    --app-home)
      APP_HOME="${2:-}"
      shift 2
      ;;
    --wait)
      WAIT_VALUE="${2:-}"
      shift 2
      ;;
    --lease-ttl-ms)
      LEASE_TTL_MS="${2:-}"
      shift 2
      ;;
    --format)
      FORMAT="${2:-text}"
      shift 2
      ;;
    --browser-profile-id|--browser-profile)
      BROWSER_PROFILE_ID="${2:-}"
      shift 2
      ;;
    --export-target)
      EXPORT_TARGET="${2:-}"
      shift 2
      ;;
    --authorization-id)
      AUTHORIZATION_ID="${2:-}"
      shift 2
      ;;
    --bitable-export-mode)
      BITABLE_EXPORT_MODE="${2:-}"
      shift 2
      ;;
    --use-last-input)
      USE_LAST_INPUT="true"
      shift 1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -z "$SCRIPT_NAME" ]]; then
        SCRIPT_NAME="$1"
        shift 1
      else
        die "unknown arg: $1"
      fi
      ;;
  esac
done

case "$ACTION" in
  list|show|run) ;;
  ""|-h|--help)
    usage
    exit 0
    ;;
  *) die "unknown scripts action: $ACTION" ;;
esac

case "$FORMAT" in
  text|json) ;;
  *) die "invalid format: $FORMAT" ;;
esac

INPUT_JSON="$(validate_input_json "$INPUT_JSON")"
EXPORT_TARGET="$(normalize_export_target "$EXPORT_TARGET")"
BITABLE_EXPORT_MODE="$(normalize_bitable_export_mode "$BITABLE_EXPORT_MODE")"

APP_HOME="$(resolve_app_home "$APP_HOME")"
LOCAL_BASE_URL="$(discover_local_base_url "$LOCAL_BASE_URL")"
TOKEN="$(discover_runtime_admin_token "$APP_HOME")"
[[ -n "$TOKEN" ]] || die "runtime admin token is missing; set MX_APP_RUNTIME_ADMIN_TOKEN or point --app-home to a Runtime state dir"

CATALOG_JSON="$(fetch_catalog "$LOCAL_BASE_URL" "$TOKEN")"
node -e 'JSON.parse(process.argv[1]);' "$CATALOG_JSON" >/dev/null 2>&1 || die "script catalog returned invalid JSON"
persist_script_snapshot "$CATALOG_JSON"

if [[ "$ACTION" == "list" ]]; then
  emit_list "$CATALOG_JSON" "$FORMAT"
  exit 0
fi

[[ -n "$SCRIPT_NAME" ]] || die "$ACTION requires <script-name>"

if [[ "$ACTION" == "show" ]]; then
  emit_show "$CATALOG_JSON" "$SCRIPT_NAME" "$FORMAT" "$INPUT_JSON" "$USE_LAST_INPUT" "$BROWSER_PROFILE_ID" "$EXPORT_TARGET" "$AUTHORIZATION_ID" "$BITABLE_EXPORT_MODE"
  exit 0
fi

emit_show "$CATALOG_JSON" "$SCRIPT_NAME" "json" "$INPUT_JSON" "$USE_LAST_INPUT" "$BROWSER_PROFILE_ID" "$EXPORT_TARGET" "$AUTHORIZATION_ID" "$BITABLE_EXPORT_MODE" >/dev/null
MISSING_REQUIRED="$(missing_required_params "$CATALOG_JSON" "$SCRIPT_NAME" "$INPUT_JSON" "$USE_LAST_INPUT" "$BROWSER_PROFILE_ID" "$EXPORT_TARGET" "$AUTHORIZATION_ID" "$BITABLE_EXPORT_MODE")"
if [[ -n "$MISSING_REQUIRED" ]]; then
  die "missing required script params: $MISSING_REQUIRED"
fi
WAIT_VALUE="$(normalize_bool "${WAIT_VALUE:-$(pref_get defaultWait)}")"
LEASE_TTL_MS="$(normalize_positive_integer "${LEASE_TTL_MS:-$(pref_get defaultLeaseTtlMs)}")"
[[ -n "$WAIT_VALUE" ]] || WAIT_VALUE="true"
[[ -n "$LEASE_TTL_MS" ]] || LEASE_TTL_MS="60000"
PAYLOAD_JSON="$(build_run_payload "$SCRIPT_NAME" "$INPUT_JSON" "$BROWSER_PROFILE_ID" "$EXPORT_TARGET" "$AUTHORIZATION_ID" "$BITABLE_EXPORT_MODE")"

exec bash "$LOCAL_LOOP_SCRIPT" \
  --target script.run \
  --payload-json "$PAYLOAD_JSON" \
  --base-url "$LOCAL_BASE_URL" \
  --app-home "$APP_HOME" \
  --wait "$WAIT_VALUE" \
  --lease-ttl-ms "$LEASE_TTL_MS"
