#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const BASE_TOKEN_PATTERNS = [
  /\/base\/([A-Za-z0-9]+)/i,
  /\/wiki\/([A-Za-z0-9]+)/i,
];

function skillRoot() {
  return path.resolve(__dirname, "..");
}

function stateDir() {
  return process.env.HOT_LIST_SKILL_STATE_DIR
    ? path.resolve(process.env.HOT_LIST_SKILL_STATE_DIR)
    : path.join(skillRoot(), "state");
}

function preferencesPath() {
  return path.join(stateDir(), "preferences.json");
}

function extractBaseToken(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return "";
  for (const pattern of BASE_TOKEN_PATTERNS) {
    const matched = value.match(pattern);
    if (matched?.[1]) return matched[1];
  }
  return value.replace(/[?#].*$/, "").replace(/\/+$/, "").trim();
}

function readPreferences() {
  try {
    return JSON.parse(fs.readFileSync(preferencesPath(), "utf8"));
  } catch {
    return { backend_api_token: "", active_binding_id: "", bindings: [] };
  }
}

function writePreferences(prefs) {
  fs.mkdirSync(stateDir(), { recursive: true });
  fs.writeFileSync(preferencesPath(), `${JSON.stringify(prefs, null, 2)}\n`, "utf8");
}

function compactString(value) {
  return String(value || "").trim();
}

const raw = fs.readFileSync(0, "utf8").trim();
const data = raw ? JSON.parse(raw) : {};
const prefs = readPreferences();
const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

const backendToken = compactString(data.backend_api_token);
if (backendToken) {
  prefs.backend_api_token = backendToken;
}

const bindingName = compactString(data.binding_name) || "主业务表";
const baseToken = extractBaseToken(data.base_token);
const apiKey = compactString(data.api_key);

let binding = (prefs.bindings || []).find((item) => item.id === prefs.active_binding_id);
if (!binding) {
  binding = (prefs.bindings || []).find((item) => item.name === bindingName);
}

if (!binding) {
  binding = {
    id: `binding_${crypto.randomBytes(6).toString("hex")}`,
    name: bindingName,
    base_token: "",
    api_key: "",
    is_default: false,
    created_at: now,
    updated_at: now,
  };
  prefs.bindings = [...(prefs.bindings || []), binding];
}

binding.name = bindingName;
if (baseToken) binding.base_token = baseToken;
if (apiKey) binding.api_key = apiKey;
binding.updated_at = now;
prefs.active_binding_id = binding.id;

for (const item of prefs.bindings || []) {
  item.is_default = item.id === prefs.active_binding_id;
  delete item.default_table_name;
}

const missing = [];
if (!prefs.backend_api_token) missing.push("backend_api_token");
if (!binding.base_token) missing.push("base_token");
if (!binding.api_key) missing.push("api_key");

if (missing.length > 0) {
  throw new Error(`仍缺少必要配置: ${missing.join(", ")}`);
}

writePreferences(prefs);
process.stdout.write(`${JSON.stringify({ ok: true, active_binding_id: prefs.active_binding_id }, null, 2)}\n`);
