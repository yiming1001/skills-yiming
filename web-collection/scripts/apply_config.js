#!/usr/bin/env node
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

const prefScript = "/Users/zhym/.codex/skills/web-collection/scripts/export_preference.sh";

function readStdin() {
  return fs.readFileSync(0, "utf8");
}

function setKey(key, value) {
  execFileSync("bash", [prefScript, "set-key", key, String(value)], { stdio: "pipe" });
}

const raw = readStdin().trim();
const data = raw ? JSON.parse(raw) : {};

const featureFlags = Array.isArray(data.feature_flags) ? data.feature_flags.map(String) : [];

setKey("defaultConnectionMode", data.connection_mode || "cloud");
setKey("defaultExportMode", data.export_mode || "bitable");
setKey("defaultMaxItems", data.max_items || "20");
setKey("defaultDetailSpeed", data.detail_speed || "fast");
setKey("defaultFetchDetail", featureFlags.includes("fetch_detail") ? "true" : "false");
setKey("defaultDeduplicationEnabled", featureFlags.includes("deduplication") ? "true" : "false");
setKey("defaultDeduplicationStrategy", data.deduplication_strategy || "keepOld");

process.stdout.write(JSON.stringify({
  ok: true,
  updated: [
    "defaultConnectionMode",
    "defaultExportMode",
    "defaultMaxItems",
    "defaultDetailSpeed",
    "defaultFetchDetail",
    "defaultDeduplicationEnabled",
    "defaultDeduplicationStrategy",
  ],
}, null, 2));
