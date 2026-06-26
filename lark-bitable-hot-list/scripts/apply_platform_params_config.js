#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const SUPPORTED_PLATFORMS = ["douyin", "bilibili", "xiaohongshu"];

function skillRoot() {
  return path.resolve(__dirname, "..");
}

function stateDir() {
  return process.env.HOT_LIST_SKILL_STATE_DIR
    ? path.resolve(process.env.HOT_LIST_SKILL_STATE_DIR)
    : path.join(skillRoot(), "state");
}

function platformPreferencesPath() {
  return path.join(stateDir(), "platform-preferences.json");
}

function douyinTagsTreePath() {
  return path.join(skillRoot(), "assets", "douyin_content_tags_tree.json");
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function compactString(value) {
  return String(value || "").trim();
}

function readPreferences() {
  try {
    return JSON.parse(fs.readFileSync(platformPreferencesPath(), "utf8"));
  } catch {
    return { schema_version: "platform-preferences.v1", platforms: {} };
  }
}

function writePreferences(prefs) {
  fs.mkdirSync(stateDir(), { recursive: true });
  fs.writeFileSync(platformPreferencesPath(), `${JSON.stringify(prefs, null, 2)}\n`, "utf8");
}

function parseInteger(value, label, allowedValues) {
  const parsed = Number.parseInt(compactString(value), 10);
  if (!Number.isFinite(parsed)) throw new Error(`${label} 必须是数字。`);
  if (allowedValues && !allowedValues.includes(parsed)) {
    throw new Error(`${label} 只能是: ${allowedValues.join(", ")}。`);
  }
  return parsed;
}

function parseBoolean(value) {
  const text = compactString(value);
  if (text === "true") return true;
  if (text === "false") return false;
  throw new Error("是否去重只能是 true 或 false。");
}

function parseDeduplicationStrategy(value) {
  const strategy = compactString(value || "keepOld");
  if (!["keepOld", "keepNew"].includes(strategy)) {
    throw new Error("重复处理只能是 keepOld 或 keepNew。");
  }
  return strategy;
}

function childBelongsToPrimary(primaryTag, secondaryTag) {
  if (!primaryTag || !secondaryTag) return false;
  const tree = readJson(douyinTagsTreePath(), { groups: [] });
  const group = (tree.groups || []).find((item) => String(item.value) === String(primaryTag));
  return Boolean(group && (group.children || []).some((item) => String(item.value) === String(secondaryTag)));
}

function platformIdFromPayload(data) {
  const platformId = compactString(data.platform_id || process.env.HOT_LIST_PLATFORM || "douyin");
  if (!SUPPORTED_PLATFORMS.includes(platformId)) {
    throw new Error(`不支持的平台: ${platformId}`);
  }
  return platformId;
}

function douyinPreference(data) {
  const func = compactString(data.func || "high_play");
  const allowedFuncs = ["high_play", "low_fan", "total", "high_like", "high_fan"];
  if (!allowedFuncs.includes(func)) throw new Error(`热榜类型不支持: ${func}`);

  const primaryTag = compactString(data.primary_tag);
  const secondaryTag = compactString(data.secondary_tag);
  const tags = secondaryTag && childBelongsToPrimary(primaryTag, secondaryTag)
    ? [primaryTag, secondaryTag]
    : [primaryTag].filter(Boolean);
  const requestParams = {
    func,
    page: 1,
    page_size: parseInteger(data.page_size || 40, "每页数量", [20, 40]),
    data_window: 24,
  };

  if (tags.length > 0) requestParams.tags = tags;

  return {
    request_params: requestParams,
    collect_mode: "times",
    collect_times: parseInteger(data.collect_times || 1, "采集页数", [1, 2, 3, 5, 10]),
    deduplication_enabled: parseBoolean(data.deduplication_enabled ?? "true"),
    deduplication_field: "item_id",
    deduplication_strategy: parseDeduplicationStrategy(data.deduplication_strategy),
  };
}

function bilibiliPreference(data) {
  return {
    request_params: {
      pn: parseInteger(data.pn || 1, "起始页码", [1, 2, 3, 5, 10]),
    },
    collect_mode: "times",
    collect_times: parseInteger(data.collect_times || 1, "采集页数", [1, 2, 3, 5]),
    deduplication_enabled: parseBoolean(data.deduplication_enabled ?? "true"),
    deduplication_field: "bvid",
    deduplication_strategy: parseDeduplicationStrategy(data.deduplication_strategy),
  };
}

function xiaohongshuPreference(data) {
  return {
    request_params: {},
    collect_mode: "times",
    collect_times: parseInteger(data.collect_times || 1, "采集次数", [1, 2, 3]),
    deduplication_enabled: parseBoolean(data.deduplication_enabled ?? "true"),
    deduplication_field: "id",
    deduplication_strategy: parseDeduplicationStrategy(data.deduplication_strategy),
  };
}

function preferenceForPlatform(platformId, data) {
  if (platformId === "douyin") return douyinPreference(data);
  if (platformId === "bilibili") return bilibiliPreference(data);
  return xiaohongshuPreference(data);
}

const raw = fs.readFileSync(0, "utf8").trim();
const data = raw ? JSON.parse(raw) : {};
const platformId = platformIdFromPayload(data);
const prefs = readPreferences();
prefs.schema_version = prefs.schema_version || "platform-preferences.v1";
prefs.platforms = prefs.platforms && typeof prefs.platforms === "object" && !Array.isArray(prefs.platforms)
  ? prefs.platforms
  : {};

prefs.platforms[platformId] = {
  ...(prefs.platforms[platformId] || {}),
  ...preferenceForPlatform(platformId, data),
  updated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
};

writePreferences(prefs);
process.stdout.write(`${JSON.stringify({
  ok: true,
  platform_id: platformId,
  saved_preferences: prefs.platforms[platformId],
}, null, 2)}\n`);
