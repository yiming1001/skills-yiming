#!/usr/bin/env node
const fs = require("node:fs");

function usage() {
  console.error(`Usage:
  node build_config_card.js --spec spec.json`);
  process.exit(2);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function option(label, value) {
  return {
    text: { tag: "plain_text", content: String(label) },
    value: String(value),
  };
}

function controlToRow(control) {
  const labelColumn = {
    tag: "column",
    width: "weighted",
    weight: 32,
    elements: [{ tag: "markdown", content: `**${control.label}**` }],
  };

  let element;
  if (control.type === "select") {
    element = {
      tag: "select_static",
      name: control.name,
      initial_option: String(control.initial ?? ""),
      placeholder: { tag: "plain_text", content: control.placeholder || "请选择" },
      options: (control.options || []).map((item) => option(item.label, item.value)),
    };
  } else if (control.type === "multi_select") {
    element = {
      tag: "multi_select_static",
      name: control.name,
      selected_values: (control.initial || []).map(String),
      placeholder: { tag: "plain_text", content: control.placeholder || "可多选" },
      options: (control.options || []).map((item) => option(item.label, item.value)),
    };
  } else {
    throw new Error(`Unsupported control type: ${control.type}`);
  }

  return {
    tag: "column_set",
    flex_mode: "stretch",
    columns: [
      labelColumn,
      {
        tag: "column",
        width: "weighted",
        weight: 68,
        elements: [element],
      },
    ],
  };
}

const specPath = argValue("--spec");
if (!specPath) usage();

const spec = readJson(specPath);
const formElements = (spec.controls || []).map(controlToRow);
formElements.push({
  tag: "column_set",
  flex_mode: "none",
  columns: [
    {
      tag: "column",
      width: "weighted",
      weight: 100,
      elements: [
        {
          tag: "button",
          name: "save_form_config",
          text: { tag: "plain_text", content: spec.submitLabel || "保存当前选择" },
          type: "primary",
          action_type: "form_submit",
          value: spec.submitValue || { action: "save_form_config" },
        },
      ],
    },
  ],
});

const card = {
  schema: "2.0",
  config: { update_multi: true },
  header: {
    template: spec.headerTemplate || "blue",
    title: { tag: "plain_text", content: spec.title || "配置确认" },
  },
  body: {
    elements: [
      {
        tag: "markdown",
        content: spec.intro || "请直接调整下面的选项，确认后会写入默认配置。",
      },
      {
        tag: "form",
        name: spec.formName || "config_form",
        elements: formElements,
      },
    ],
  },
};

process.stdout.write(JSON.stringify(card, null, 2));
