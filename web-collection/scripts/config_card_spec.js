#!/usr/bin/env node
const { execFileSync } = require("node:child_process");

const prefScript = "/Users/zhym/.codex/skills/web-collection/scripts/export_preference.sh";

function readPrefs() {
  try {
    return JSON.parse(execFileSync("bash", [prefScript, "show"], { encoding: "utf8" }));
  } catch {
    return {};
  }
}

const prefs = readPrefs();
const defaults = {
  defaultConnectionMode: "cloud",
  defaultExportMode: "bitable",
  defaultMaxItems: 20,
  defaultFetchDetail: true,
  defaultDetailSpeed: "fast",
  defaultDeduplicationEnabled: true,
  defaultDeduplicationStrategy: "keepOld",
};

const effective = {
  defaultConnectionMode: prefs.defaultConnectionMode || defaults.defaultConnectionMode,
  defaultExportMode: prefs.defaultExportMode || defaults.defaultExportMode,
  defaultMaxItems: String(prefs.defaultMaxItems ?? defaults.defaultMaxItems),
  defaultFetchDetail: prefs.defaultFetchDetail ?? defaults.defaultFetchDetail,
  defaultDetailSpeed: prefs.defaultDetailSpeed || defaults.defaultDetailSpeed,
  defaultDeduplicationEnabled: prefs.defaultDeduplicationEnabled ?? defaults.defaultDeduplicationEnabled,
  defaultDeduplicationStrategy: prefs.defaultDeduplicationStrategy || defaults.defaultDeduplicationStrategy,
};

const featureFlags = [];
if (effective.defaultFetchDetail) featureFlags.push("fetch_detail");
if (effective.defaultDeduplicationEnabled) featureFlags.push("deduplication");

const spec = {
  title: "Web Collection 默认配置确认",
  intro: "请直接调整下面的选项，确认后会写入 Web Collection 默认配置。",
  submitLabel: "保存当前选择",
  submitValue: {
    action: "save_form_config",
    source: "web-collection",
  },
  controls: [
    {
      type: "select",
      name: "connection_mode",
      label: "运行位置",
      initial: effective.defaultConnectionMode,
      placeholder: "请选择运行位置",
      options: [
        { label: "cloud", value: "cloud" },
        { label: "local", value: "local" },
      ],
    },
    {
      type: "select",
      name: "export_mode",
      label: "导出方式",
      initial: effective.defaultExportMode,
      placeholder: "请选择导出方式",
      options: [
        { label: "多维表格", value: "bitable" },
        { label: "CSV", value: "csv" },
      ],
    },
    {
      type: "select",
      name: "max_items",
      label: "默认采集条数",
      initial: effective.defaultMaxItems,
      placeholder: "请选择采集条数",
      options: [
        { label: "10", value: "10" },
        { label: "20", value: "20" },
        { label: "50", value: "50" },
        { label: "100", value: "100" },
      ],
    },
    {
      type: "select",
      name: "detail_speed",
      label: "默认采集速度",
      initial: effective.defaultDetailSpeed,
      placeholder: "请选择采集速度",
      options: [
        { label: "fast", value: "fast" },
        { label: "medium", value: "medium" },
        { label: "slow", value: "slow" },
      ],
    },
    {
      type: "multi_select",
      name: "feature_flags",
      label: "功能开关",
      initial: featureFlags,
      placeholder: "可多选",
      options: [
        { label: "默认采集详情", value: "fetch_detail" },
        { label: "导出去重", value: "deduplication" },
      ],
    },
    {
      type: "select",
      name: "deduplication_strategy",
      label: "去重保留策略",
      initial: effective.defaultDeduplicationStrategy,
      placeholder: "请选择策略",
      options: [
        { label: "保留原始数据", value: "keepOld" },
        { label: "保留新数据", value: "keepNew" },
      ],
    },
  ],
};

process.stdout.write(JSON.stringify(spec, null, 2));
