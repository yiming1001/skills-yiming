#!/usr/bin/env bash
set -euo pipefail

resolve_state_dir() {
  if [[ -n "${OPENCLAW_STATE_DIR:-}" ]]; then
    printf '%s\n' "$OPENCLAW_STATE_DIR"
    return 0
  fi
  printf '%s\n' "${HOME}/.openclaw"
}

resolve_preferences_path() {
  local state_dir
  state_dir="$(resolve_state_dir)"
  printf '%s\n' "${state_dir}/skill-state/mx-auto/preferences.json"
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

read_pref_value() {
  local key="$1"
  local pref_path="$2"
  node -e '
const fs = require("node:fs");
const prefPath = process.argv[1];
const key = process.argv[2];
try {
  const raw = JSON.parse(fs.readFileSync(prefPath, "utf8"));
  const value = raw[key];
  if (value === undefined || value === null) process.exit(0);
  if (typeof value === "object") process.stdout.write(JSON.stringify(value));
  else process.stdout.write(String(value));
} catch {}
' "$pref_path" "$key"
}

resolve_app_home() {
  local explicit="${1:-}"
  local pref_path
  pref_path="$(resolve_preferences_path)"
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
  stored="$(read_pref_value "defaultAppHome" "$pref_path")"
  if [[ -n "$stored" ]]; then
    printf '%s\n' "$stored"
    return 0
  fi
  resolve_default_app_home
}

resolve_registry_path() {
  local app_home="$1"
  printf '%s\n' "${app_home}/runtime/frequent-scripts.json"
}

normalize_registry_json() {
  local raw_json="$1"
  local updated_by="${2:-manual}"
  node -e '
const input = JSON.parse(process.argv[1]);
const updatedByFallback = String(process.argv[2] || "manual");
const normalize = (value) => String(value || "").trim().toLowerCase();
const source = Array.isArray(input) ? { scripts: input } : input;
if (!source || typeof source !== "object" || Array.isArray(source)) {
  throw new Error("frequent scripts registry must be an object or array");
}
const scriptsSource = Array.isArray(source.scripts) ? source.scripts : Array.isArray(input) ? input : null;
if (!scriptsSource) {
  throw new Error("frequent scripts registry requires scripts array");
}
const seenAliases = new Map();
const scripts = scriptsSource.map((entry) => {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error("frequent script entry must be an object");
  }
  const scriptName = String(entry.scriptName || "").trim();
  const aliases = Array.isArray(entry.aliases)
    ? entry.aliases.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  if (!scriptName) {
    throw new Error("frequent script entry requires non-empty scriptName");
  }
  if (aliases.length === 0) {
    throw new Error(`frequent script "${scriptName}" requires at least one alias`);
  }
  if (entry.defaultInput !== undefined && (!entry.defaultInput || typeof entry.defaultInput !== "object" || Array.isArray(entry.defaultInput))) {
    throw new Error(`frequent script "${scriptName}" defaultInput must be an object`);
  }
  for (const alias of aliases) {
    const normalizedAlias = normalize(alias);
    if (!normalizedAlias) {
      throw new Error(`frequent script "${scriptName}" contains empty alias`);
    }
    const previousScript = seenAliases.get(normalizedAlias);
    if (previousScript && previousScript !== scriptName) {
      throw new Error(`duplicate frequent alias "${alias}" used by "${previousScript}" and "${scriptName}"`);
    }
    seenAliases.set(normalizedAlias, scriptName);
  }
  return {
    scriptName,
    aliases,
    preferredAccount: typeof entry.preferredAccount === "string" && entry.preferredAccount.trim()
      ? entry.preferredAccount.trim()
      : undefined,
    defaultInput: entry.defaultInput && typeof entry.defaultInput === "object" && !Array.isArray(entry.defaultInput)
      ? entry.defaultInput
      : undefined,
    enabled: entry.enabled !== false,
  };
});
process.stdout.write(JSON.stringify({
  version: 1,
  updatedAt: typeof source.updatedAt === "string" && source.updatedAt.trim()
    ? source.updatedAt.trim()
    : new Date().toISOString(),
  updatedBy: typeof source.updatedBy === "string" && source.updatedBy.trim()
    ? source.updatedBy.trim()
    : updatedByFallback,
  scripts,
}));
' "$raw_json" "$updated_by"
}

legacy_frequent_scripts_json() {
  local pref_path="$1"
  node -e '
const fs = require("node:fs");
const prefPath = process.argv[1];
try {
  const raw = JSON.parse(fs.readFileSync(prefPath, "utf8"));
  const entries = Array.isArray(raw.frequentScripts) ? raw.frequentScripts : [];
  if (entries.length > 0) process.stdout.write(JSON.stringify(entries));
} catch {}
' "$pref_path"
}

write_registry_json() {
  local registry_path="$1"
  local registry_json="$2"
  mkdir -p "$(dirname "$registry_path")"
  node -e '
const fs = require("node:fs");
const path = process.argv[1];
const payload = JSON.parse(process.argv[2]);
const tempPath = `${path}.tmp-${process.pid}-${Date.now()}`;
fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
fs.renameSync(tempPath, path);
try { fs.chmodSync(path, 0o600); } catch {}
' "$registry_path" "$registry_json"
}

read_or_migrate_registry_json() {
  local registry_path="$1"
  local pref_path="$2"
  if [[ -f "$registry_path" ]]; then
    local raw
    raw="$(cat "$registry_path")"
    normalize_registry_json "$raw" "system"
    return 0
  fi

  local legacy_json
  legacy_json="$(legacy_frequent_scripts_json "$pref_path")"
  if [[ -n "$legacy_json" ]]; then
    local registry_json
    registry_json="$(normalize_registry_json "$legacy_json" "migrated_from_preferences")"
    write_registry_json "$registry_path" "$registry_json"
    printf '%s\n' "$registry_json"
    return 0
  fi

  printf '%s\n' '{"version":1,"updatedAt":"","updatedBy":"","scripts":[]}'
}

usage() {
  cat <<'EOF'
Usage:
  frequent_scripts.sh [--app-home <path>] path
  frequent_scripts.sh [--app-home <path>] show
  frequent_scripts.sh [--app-home <path>] get
  frequent_scripts.sh [--app-home <path>] set <json>
  frequent_scripts.sh [--app-home <path>] add <json>
  frequent_scripts.sh [--app-home <path>] remove <script-or-alias>
  frequent_scripts.sh [--app-home <path>] clear
EOF
}

APP_HOME=""
if [[ "${1:-}" == "--app-home" ]]; then
  APP_HOME="${2:-}"
  shift 2
fi

COMMAND="${1:-show}"
ARG="${2:-}"
PREF_PATH="$(resolve_preferences_path)"
APP_HOME="$(resolve_app_home "$APP_HOME")"
REGISTRY_PATH="$(resolve_registry_path "$APP_HOME")"

case "$COMMAND" in
  path)
    printf '%s\n' "$REGISTRY_PATH"
    ;;
  show)
    read_or_migrate_registry_json "$REGISTRY_PATH" "$PREF_PATH"
    ;;
  get)
    node -e '
const registry = JSON.parse(process.argv[1]);
process.stdout.write(JSON.stringify(Array.isArray(registry.scripts) ? registry.scripts : []));
' "$(read_or_migrate_registry_json "$REGISTRY_PATH" "$PREF_PATH")"
    ;;
  set)
    [[ -n "$ARG" ]] || {
      echo "set requires <json>" >&2
      exit 1
    }
    REGISTRY_JSON="$(normalize_registry_json "$ARG" "manual")"
    write_registry_json "$REGISTRY_PATH" "$REGISTRY_JSON"
    printf '%s\n' "$REGISTRY_JSON"
    ;;
  add)
    [[ -n "$ARG" ]] || {
      echo "add requires <json>" >&2
      exit 1
    }
    REGISTRY_JSON="$(read_or_migrate_registry_json "$REGISTRY_PATH" "$PREF_PATH")"
    NEXT_JSON="$(node -e '
const registry = JSON.parse(process.argv[1]);
const entry = JSON.parse(process.argv[2]);
const normalize = (value) => String(value || "").trim().toLowerCase();
const nextScripts = (Array.isArray(registry.scripts) ? registry.scripts : []).filter((item) => normalize(item.scriptName) !== normalize(entry.scriptName));
nextScripts.push(entry);
process.stdout.write(JSON.stringify({ version: 1, updatedAt: "", updatedBy: "manual", scripts: nextScripts }));
' "$REGISTRY_JSON" "$ARG")"
    NORMALIZED_JSON="$(normalize_registry_json "$NEXT_JSON" "manual")"
    write_registry_json "$REGISTRY_PATH" "$NORMALIZED_JSON"
    printf '%s\n' "$NORMALIZED_JSON"
    ;;
  remove)
    [[ -n "$ARG" ]] || {
      echo "remove requires <script-or-alias>" >&2
      exit 1
    }
    REGISTRY_JSON="$(read_or_migrate_registry_json "$REGISTRY_PATH" "$PREF_PATH")"
    NEXT_JSON="$(node -e '
const registry = JSON.parse(process.argv[1]);
const target = String(process.argv[2] || "").trim().toLowerCase();
const scripts = Array.isArray(registry.scripts) ? registry.scripts : [];
const nextScripts = scripts.filter((entry) => {
  if (String(entry.scriptName || "").trim().toLowerCase() === target) return false;
  const aliases = Array.isArray(entry.aliases) ? entry.aliases : [];
  return !aliases.some((alias) => String(alias || "").trim().toLowerCase() === target);
});
process.stdout.write(JSON.stringify({ version: 1, updatedAt: "", updatedBy: "manual", scripts: nextScripts }));
' "$REGISTRY_JSON" "$ARG")"
    NORMALIZED_JSON="$(normalize_registry_json "$NEXT_JSON" "manual")"
    write_registry_json "$REGISTRY_PATH" "$NORMALIZED_JSON"
    printf '%s\n' "$NORMALIZED_JSON"
    ;;
  clear)
    NORMALIZED_JSON='{"version":1,"updatedAt":"","updatedBy":"manual","scripts":[]}'
    write_registry_json "$REGISTRY_PATH" "$(normalize_registry_json "$NORMALIZED_JSON" "manual")"
    printf '%s\n' '{"version":1,"updatedAt":"","updatedBy":"manual","scripts":[]}'
    ;;
  -h|--help|help|"")
    usage
    ;;
  *)
    echo "unknown subcommand: $COMMAND" >&2
    usage
    exit 1
    ;;
esac
