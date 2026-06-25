#!/usr/bin/env node
const fs = require("node:fs");

function normalizeScalar(value, fallback = "") {
  if (Array.isArray(value)) {
    return value.length > 0 ? normalizeScalar(value[0], fallback) : fallback;
  }
  if (typeof value === "object" && value !== null) {
    return normalizeScalar(value.value ?? value.option_value ?? value.key, fallback);
  }
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeScalar(item)).filter(Boolean);
  }
  if (typeof value === "object" && value !== null) {
    if (Array.isArray(value.value) || Array.isArray(value.values) || Array.isArray(value.selected_values)) {
      return normalizeValue(value.value ?? value.values ?? value.selected_values);
    }
    return normalizeScalar(value);
  }
  return normalizeScalar(value);
}

function normalizeFormValue(formValue) {
  const result = {};
  for (const [key, value] of Object.entries(formValue || {})) {
    result[key] = normalizeValue(value);
  }
  return result;
}

function usage() {
  console.error(`Usage:
  node normalize_form_value.js --payload callback.json
  node normalize_form_value.js --form-value form_value.json`);
  process.exit(2);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

if (require.main === module) {
  const payloadPath = argValue("--payload");
  const formValuePath = argValue("--form-value");
  if (!payloadPath && !formValuePath) usage();

  const data = payloadPath ? readJson(payloadPath) : readJson(formValuePath);
  const formValue = payloadPath
    ? (data?.event?.action?.form_value || data?.action?.form_value || data?.form_value || {})
    : data;

  process.stdout.write(JSON.stringify(normalizeFormValue(formValue), null, 2));
}

module.exports = {
  normalizeScalar,
  normalizeValue,
  normalizeFormValue,
};
