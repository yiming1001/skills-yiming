#!/usr/bin/env node
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const PLATFORMS = {
  douyin: "抖音",
  bilibili: "B站",
  xiaohongshu: "小红书",
};

function skillRoot() {
  return path.resolve(__dirname, "..");
}

function stateDir() {
  return process.env.HOT_LIST_SKILL_STATE_DIR
    ? path.resolve(process.env.HOT_LIST_SKILL_STATE_DIR)
    : path.join(skillRoot(), "state");
}

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function maskSecret(value, keepStart = 4, keepEnd = 4) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length <= keepStart + keepEnd) return `${text.slice(0, 2)}***`;
  return `${text.slice(0, keepStart)}***${text.slice(-keepEnd)}`;
}

function paths() {
  const root = skillRoot();
  const state = stateDir();
  return {
    root,
    state,
    preferences: path.join(state, "preferences.json"),
    platformPreferences: path.join(state, "platform-preferences.json"),
    tagTree: path.join(root, "assets", "douyin_content_tags_tree.json"),
    schemas: {
      douyin: path.join(root, "schemas", "hot_list", "douyin.json"),
      bilibili: path.join(root, "schemas", "hot_list", "bilibili.json"),
      xiaohongshu: path.join(root, "schemas", "hot_list", "xiaohongshu.json"),
    },
  };
}

function maskedCredentials() {
  const prefs = readJson(paths().preferences, {
    backend_api_token: "",
    active_binding_id: "",
    bindings: [],
  });
  const active = (prefs.bindings || []).find((item) => item.id === prefs.active_binding_id)
    || (prefs.bindings || [])[0]
    || {};
  return {
    backend_api_token: maskSecret(prefs.backend_api_token),
    has_backend_api_token: Boolean(prefs.backend_api_token),
    binding_name: active.name || "主业务表",
    base_token: maskSecret(active.base_token),
    has_base_token: Boolean(active.base_token),
    api_key: maskSecret(active.api_key),
    has_api_key: Boolean(active.api_key),
    active_binding_id: prefs.active_binding_id || "",
  };
}

function schemaInputFields(schema) {
  return (schema.input_schema?.fields || []).map((field) => ({
    key: field.key,
    label: field.label,
    options: field.options || [],
  }));
}

function bootstrapPayload() {
  const p = paths();
  const schemas = Object.fromEntries(
    Object.entries(p.schemas).map(([platformId, filePath]) => {
      const schema = readJson(filePath, {});
      return [platformId, {
        platform: platformId,
        platform_name: PLATFORMS[platformId],
        execution_defaults: schema.execution_defaults || {},
        input_fields: schemaInputFields(schema),
      }];
    })
  );

  return {
    ok: true,
    state_dir: p.state,
    credentials: maskedCredentials(),
    platform_preferences: readJson(p.platformPreferences, {
      schema_version: "platform-preferences.v1",
      platforms: {},
    }),
    schemas,
    douyin_tag_tree: readJson(p.tagTree, { groups: [] }),
  };
}

function sendJson(res, status, data) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(new Error("request too large"));
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function runWriter(scriptName, payload) {
  const result = spawnSync("node", [path.join(__dirname, scriptName)], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `${scriptName} failed`).trim());
  }
  return result.stdout ? JSON.parse(result.stdout) : { ok: true };
}

function html() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>热榜 Skill 本地配置</title>
  <style>
    :root {
      --ink: #17202a;
      --muted: #667085;
      --line: #d9e2ec;
      --panel: #ffffff;
      --canvas: #eef5f2;
      --brand: #0f766e;
      --brand-strong: #115e59;
      --brand-soft: #dff5ef;
      --gold: #b7791f;
      --danger: #b42318;
      --shadow: 0 20px 70px rgba(15, 51, 45, .13);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: ui-serif, "Songti SC", "Noto Serif CJK SC", Georgia, serif;
      color: var(--ink);
      background:
        radial-gradient(circle at 18% 12%, rgba(18, 124, 113, .18), transparent 28rem),
        radial-gradient(circle at 84% 0%, rgba(183, 121, 31, .14), transparent 22rem),
        linear-gradient(135deg, #f7fbf7 0%, var(--canvas) 100%);
    }
    .shell { max-width: 1180px; margin: 0 auto; padding: 34px 22px 56px; }
    .hero {
      display: grid;
      grid-template-columns: 1.1fr .9fr;
      gap: 18px;
      align-items: stretch;
      margin-bottom: 20px;
    }
    .hero-panel, .panel {
      background: rgba(255,255,255,.88);
      border: 1px solid rgba(15, 118, 110, .15);
      border-radius: 28px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
    }
    .hero-panel { padding: 30px; overflow: hidden; position: relative; }
    .hero-panel:after {
      content: "";
      position: absolute;
      right: -70px;
      top: -70px;
      width: 190px;
      height: 190px;
      border-radius: 999px;
      background: linear-gradient(135deg, rgba(15,118,110,.2), rgba(183,121,31,.18));
    }
    h1 { margin: 0 0 12px; font-size: 34px; letter-spacing: -.04em; }
    .subtitle { margin: 0; color: var(--muted); font-size: 16px; line-height: 1.8; }
    .status {
      padding: 24px;
      display: grid;
      gap: 12px;
    }
    .status-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .pill {
      border-radius: 999px;
      padding: 5px 10px;
      font-size: 12px;
      color: var(--brand-strong);
      background: var(--brand-soft);
      border: 1px solid rgba(15,118,110,.18);
      white-space: nowrap;
    }
    .grid { display: grid; grid-template-columns: .9fr 1.1fr; gap: 18px; }
    .panel { padding: 24px; }
    .panel h2 { margin: 0 0 6px; font-size: 22px; letter-spacing: -.03em; }
    .hint { color: var(--muted); font-size: 13px; line-height: 1.7; margin: 0 0 18px; }
    label { display: block; font-size: 13px; color: #475467; margin-bottom: 7px; }
    input, select {
      width: 100%;
      height: 44px;
      border-radius: 14px;
      border: 1px solid var(--line);
      background: #fbfdfc;
      color: var(--ink);
      padding: 0 13px;
      font: inherit;
      outline: none;
    }
    input:focus, select:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(15,118,110,.12); }
    .field { margin-bottom: 14px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .tabs { display: flex; gap: 10px; padding: 6px; border-radius: 18px; background: #edf4f1; margin-bottom: 18px; }
    .tab {
      flex: 1;
      border: 0;
      border-radius: 14px;
      height: 42px;
      background: transparent;
      color: #475467;
      font: inherit;
      cursor: pointer;
      transition: .18s ease;
    }
    .tab.active { background: var(--panel); color: var(--brand-strong); box-shadow: 0 8px 26px rgba(15,51,45,.10); }
    .actions { display: flex; gap: 10px; align-items: center; margin-top: 18px; }
    button.primary, button.secondary {
      height: 44px;
      border-radius: 14px;
      border: 0;
      padding: 0 18px;
      font: inherit;
      cursor: pointer;
    }
    button.primary { background: var(--brand); color: white; box-shadow: 0 12px 30px rgba(15,118,110,.24); }
    button.secondary { background: #eef4f1; color: var(--brand-strong); }
    .toast {
      position: fixed;
      right: 22px;
      bottom: 22px;
      max-width: 420px;
      border-radius: 18px;
      padding: 14px 16px;
      color: #10342f;
      background: #ecfdf3;
      border: 1px solid rgba(15,118,110,.2);
      box-shadow: var(--shadow);
      opacity: 0;
      transform: translateY(12px);
      pointer-events: none;
      transition: .2s ease;
      white-space: pre-wrap;
    }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast.error { background: #fff1f0; color: var(--danger); border-color: rgba(180,35,24,.22); }
    code { background: #edf4f1; border-radius: 8px; padding: 2px 6px; }
    @media (max-width: 860px) {
      .hero, .grid, .row { grid-template-columns: 1fr; }
      h1 { font-size: 28px; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div class="hero-panel">
        <h1>热榜 Skill 本地配置</h1>
        <p class="subtitle">这里不依赖飞书互动卡片或长连接。所有选择都在本地完成，直接写入 Skill 的本机偏好文件。</p>
      </div>
      <div class="hero-panel status">
        <div class="status-line"><span>后端 Token</span><span id="backendStatus" class="pill">读取中</span></div>
        <div class="status-line"><span>Lark Base</span><span id="baseStatus" class="pill">读取中</span></div>
        <div class="status-line"><span>个人授权码</span><span id="apiKeyStatus" class="pill">读取中</span></div>
      </div>
    </section>
    <section class="grid">
      <div class="panel">
        <h2>必要配置</h2>
        <p class="hint">留空的敏感字段会保留原值；首次使用时请把三项都填齐。</p>
        <div class="field">
          <label>后端 API Token</label>
          <input id="backendToken" type="password" placeholder="当前值不会明文展示" />
        </div>
        <div class="field">
          <label>绑定名称</label>
          <input id="bindingName" placeholder="主业务表" />
        </div>
        <div class="field">
          <label>Lark Base 链接或 base_token</label>
          <input id="baseToken" placeholder="https://.../base/appxxx 或 appxxx" />
        </div>
        <div class="field">
          <label>个人授权码</label>
          <input id="apiKey" type="password" placeholder="当前值不会明文展示" />
        </div>
        <div class="actions">
          <button class="primary" id="saveCredentials">保存必要配置</button>
          <button class="secondary" id="reload">重新读取</button>
        </div>
      </div>
      <div class="panel">
        <h2>平台参数</h2>
        <p class="hint">保存后，执行采集时会自动合并这些偏好。表名和表结构仍由 Skill schema 决定。</p>
        <div class="tabs">
          <button class="tab active" data-platform="douyin">抖音</button>
          <button class="tab" data-platform="bilibili">B站</button>
          <button class="tab" data-platform="xiaohongshu">小红书</button>
        </div>
        <form id="platformForm"></form>
      </div>
    </section>
  </main>
  <div id="toast" class="toast"></div>
  <script>
    let state = null;
    let activePlatform = "douyin";

    const $ = (id) => document.getElementById(id);
    const option = (value, label, selected) => '<option value="' + escapeHtml(value) + '"' + (String(value) === String(selected) ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
    const field = (id, label, control) => '<div class="field"><label for="' + id + '">' + label + '</label>' + control + '</div>';
    const select = (id, options, selected) => '<select id="' + id + '">' + options.map((item) => option(item.value, item.label, selected)).join("") + '</select>';

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
    }

    function toast(message, type = "ok") {
      const node = $("toast");
      node.textContent = message;
      node.className = "toast show" + (type === "error" ? " error" : "");
      setTimeout(() => node.className = "toast" + (type === "error" ? " error" : ""), 3200);
    }

    async function api(path, options = {}) {
      const response = await fetch(path, {
        ...options,
        headers: { "content-type": "application/json", ...(options.headers || {}) },
      });
      const json = await response.json();
      if (!response.ok || json.ok === false) throw new Error(json.error || json.message || "请求失败");
      return json;
    }

    function currentPreference(platform) {
      const schema = state.schemas[platform] || {};
      const defaults = schema.execution_defaults || {};
      const saved = state.platform_preferences.platforms?.[platform] || {};
      return {
        request_params: { ...(defaults.form_data || {}), ...(saved.request_params || {}) },
        collect_times: saved.collect_times || defaults.collect_times || 1,
        deduplication_enabled: saved.deduplication_enabled ?? defaults.deduplication_enabled ?? true,
        deduplication_strategy: saved.deduplication_strategy || defaults.deduplication_strategy || "keepOld",
      };
    }

    function selectedDouyinTags(pref) {
      const tags = Array.isArray(pref.request_params.tags) ? pref.request_params.tags.map(String) : [];
      return {
        primary: tags.find((item) => item.length <= 3) || String(state.douyin_tag_tree.groups?.[0]?.value || ""),
        secondary: tags.find((item) => item.length > 3) || "",
      };
    }

    function renderStatus() {
      const c = state.credentials;
      $("backendStatus").textContent = c.has_backend_api_token ? "已保存 " + c.backend_api_token : "未配置";
      $("baseStatus").textContent = c.has_base_token ? "已保存 " + c.base_token : "未配置";
      $("apiKeyStatus").textContent = c.has_api_key ? "已保存 " + c.api_key : "未配置";
      $("bindingName").value = c.binding_name || "主业务表";
    }

    function renderPlatform() {
      document.querySelectorAll(".tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.platform === activePlatform);
      });
      const pref = currentPreference(activePlatform);
      if (activePlatform === "douyin") renderDouyin(pref);
      if (activePlatform === "bilibili") renderBilibili(pref);
      if (activePlatform === "xiaohongshu") renderXiaohongshu(pref);
    }

    function renderDouyin(pref) {
      const funcOptions = (state.schemas.douyin.input_fields.find((item) => item.key === "func")?.options || [])
        .map((item) => ({ label: item.label, value: item.value }));
      const tags = selectedDouyinTags(pref);
      const primaryOptions = (state.douyin_tag_tree.groups || []).map((group) => ({ label: group.label, value: group.value }));
      const group = (state.douyin_tag_tree.groups || []).find((item) => String(item.value) === String(tags.primary)) || state.douyin_tag_tree.groups?.[0] || {};
      const secondaryOptions = (group.children || []).map((child) => ({ label: child.label, value: child.value }));
      const secondary = secondaryOptions.some((item) => String(item.value) === String(tags.secondary))
        ? tags.secondary
        : String(secondaryOptions[0]?.value || "");
      $("platformForm").innerHTML = [
        field("func", "榜单类型", select("func", funcOptions, pref.request_params.func || "high_play")),
        '<div class="row">',
        field("primaryTag", "一级垂类", select("primaryTag", primaryOptions, tags.primary)),
        field("secondaryTag", "二级垂类", select("secondaryTag", secondaryOptions, secondary)),
        '</div>',
        '<div class="row">',
        field("pageSize", "每页数量", select("pageSize", [{label:"20",value:"20"},{label:"40",value:"40"}], pref.request_params.page_size || 40)),
        field("collectTimes", "采集页数", select("collectTimes", [1,2,3,5,10].map(n => ({label:String(n), value:String(n)})), pref.collect_times || 1)),
        '</div>',
        dedupFields(pref),
        actionBar("保存抖音参数"),
      ].join("");
      $("primaryTag").addEventListener("change", () => {
        const next = currentPreference("douyin");
        next.request_params.tags = [$("primaryTag").value];
        state.platform_preferences.platforms = state.platform_preferences.platforms || {};
        state.platform_preferences.platforms.douyin = { ...(state.platform_preferences.platforms.douyin || {}), request_params: next.request_params };
        renderDouyin(next);
      });
      bindSaveButton(saveDouyin);
    }

    function renderBilibili(pref) {
      $("platformForm").innerHTML = [
        '<div class="row">',
        field("pn", "起始页码", select("pn", [1,2,3,5,10].map(n => ({label:String(n), value:String(n)})), pref.request_params.pn || 1)),
        field("collectTimes", "采集页数", select("collectTimes", [1,2,3,5].map(n => ({label:String(n), value:String(n)})), pref.collect_times || 1)),
        '</div>',
        dedupFields(pref),
        actionBar("保存 B站参数"),
      ].join("");
      bindSaveButton(saveBilibili);
    }

    function renderXiaohongshu(pref) {
      $("platformForm").innerHTML = [
        field("collectTimes", "采集次数", select("collectTimes", [1,2,3].map(n => ({label:String(n), value:String(n)})), pref.collect_times || 1)),
        dedupFields(pref),
        actionBar("保存小红书参数"),
      ].join("");
      bindSaveButton(saveXiaohongshu);
    }

    function dedupFields(pref) {
      return [
        '<div class="row">',
        field("deduplicationEnabled", "是否去重", select("deduplicationEnabled", [{label:"开启",value:"true"},{label:"关闭",value:"false"}], String(Boolean(pref.deduplication_enabled)))),
        field("deduplicationStrategy", "重复处理", select("deduplicationStrategy", [{label:"保留旧数据",value:"keepOld"},{label:"用新数据替换",value:"keepNew"}], pref.deduplication_strategy || "keepOld")),
        '</div>',
      ].join("");
    }

    function actionBar(label) {
      return '<div class="actions"><button type="button" class="primary" id="savePlatform">' + label + '</button><button type="button" class="secondary" id="resetPlatform">恢复已保存</button></div>';
    }

    function bindSaveButton(handler) {
      $("savePlatform").addEventListener("click", handler);
      $("resetPlatform").addEventListener("click", load);
    }

    async function savePlatform(payload) {
      const result = await api("/api/platform-preferences", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast(result.message || "平台参数已保存");
      await load(false);
    }

    function saveDouyin() {
      return savePlatform({
        platform_id: "douyin",
        func: $("func").value,
        primary_tag: $("primaryTag").value,
        secondary_tag: $("secondaryTag").value,
        page_size: $("pageSize").value,
        collect_times: $("collectTimes").value,
        deduplication_enabled: $("deduplicationEnabled").value,
        deduplication_strategy: $("deduplicationStrategy").value,
      }).catch((error) => toast(error.message, "error"));
    }

    function saveBilibili() {
      return savePlatform({
        platform_id: "bilibili",
        pn: $("pn").value,
        collect_times: $("collectTimes").value,
        deduplication_enabled: $("deduplicationEnabled").value,
        deduplication_strategy: $("deduplicationStrategy").value,
      }).catch((error) => toast(error.message, "error"));
    }

    function saveXiaohongshu() {
      return savePlatform({
        platform_id: "xiaohongshu",
        collect_times: $("collectTimes").value,
        deduplication_enabled: $("deduplicationEnabled").value,
        deduplication_strategy: $("deduplicationStrategy").value,
      }).catch((error) => toast(error.message, "error"));
    }

    async function saveCredentials() {
      try {
        const payload = {
          backend_api_token: $("backendToken").value,
          binding_name: $("bindingName").value,
          base_token: $("baseToken").value,
          api_key: $("apiKey").value,
        };
        const result = await api("/api/credentials", { method: "POST", body: JSON.stringify(payload) });
        $("backendToken").value = "";
        $("baseToken").value = "";
        $("apiKey").value = "";
        toast(result.message || "必要配置已保存");
        await load(false);
      } catch (error) {
        toast(error.message, "error");
      }
    }

    async function load(showMessage = false) {
      state = await api("/api/bootstrap");
      renderStatus();
      renderPlatform();
      if (showMessage) toast("已重新读取本地配置");
    }

    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        activePlatform = tab.dataset.platform;
        renderPlatform();
      });
    });
    $("saveCredentials").addEventListener("click", saveCredentials);
    $("reload").addEventListener("click", () => load(true));
    load().catch((error) => toast(error.message, "error"));
  </script>
</body>
</html>`;
}

function openBrowser(url) {
  if (hasFlag("--no-open")) return;
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(opener, args, { detached: true, stdio: "ignore" });
  child.unref();
}

const port = Number(argValue("--port", process.env.HOT_LIST_LOCAL_CONFIG_PORT || "8798"));
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html());
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/bootstrap") {
      sendJson(res, 200, bootstrapPayload());
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/credentials") {
      const payload = JSON.parse(await readBody(req) || "{}");
      const result = runWriter("apply_config.js", payload);
      sendJson(res, 200, { ok: true, message: "必要配置已保存", result });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/platform-preferences") {
      const payload = JSON.parse(await readBody(req) || "{}");
      const result = runWriter("apply_platform_params_config.js", payload);
      sendJson(res, 200, { ok: true, message: "平台参数已保存", result });
      return;
    }
    sendJson(res, 404, { ok: false, error: "not_found" });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/`;
  process.stdout.write(`lark-bitable-hot-list local config page: ${url}\n`);
  openBrowser(url);
});
