#!/usr/bin/env node
const http = require("node:http");
const { spawnSync } = require("node:child_process");
const { normalizeFormValue } = require("./normalize_form_value.js");

const port = Number(process.env.PORT || 8787);
const expectedToken = process.env.FEISHU_VERIFICATION_TOKEN || "";
const configWriteCmd = process.env.CONFIG_WRITE_CMD || `node /Users/zhym/.codex/skills/web-collection/scripts/apply_config.js`;

function sendJson(res, code, data) {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
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

function extractAction(payload) {
  return payload?.event?.action || payload?.action || {};
}

function extractFormValue(payload) {
  const action = extractAction(payload);
  return action?.form_value || payload?.event?.form_value || payload?.form_value || {};
}

function extractToken(payload) {
  return payload?.header?.token || payload?.token || "";
}

function extractOperatorName(payload) {
  return payload?.event?.operator?.operator_name || payload?.operator?.operator_name || "当前用户";
}

function writeConfig(normalized) {
  const result = spawnSync(configWriteCmd, {
    input: JSON.stringify(normalized),
    shell: true,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "config write failed").trim());
  }
}

function successCard(operatorName) {
  return {
    schema: "2.0",
    config: { update_multi: true },
    header: {
      template: "green",
      title: { tag: "plain_text", content: "配置已保存" },
    },
    body: {
      elements: [
        {
          tag: "markdown",
          content: `配置已保存。确认人：${operatorName}`,
        },
      ],
    },
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  try {
    const raw = await readBody(req);
    const payload = raw ? JSON.parse(raw) : {};
    if (payload.challenge) {
      sendJson(res, 200, { challenge: payload.challenge });
      return;
    }

    const token = extractToken(payload);
    if (expectedToken && token !== expectedToken) {
      sendJson(res, 403, { ok: false, error: "invalid_token" });
      return;
    }

    const normalized = normalizeFormValue(extractFormValue(payload));
    writeConfig(normalized);

    sendJson(res, 200, {
      toast: { type: "success", content: "已保存当前选择" },
      card: successCard(extractOperatorName(payload)),
    });
  } catch (error) {
    sendJson(res, 500, {
      toast: { type: "error", content: `回调处理失败: ${error.message}` },
    });
  }
});

server.listen(port, () => {
  process.stdout.write(`web-collection card callback server listening on :${port}\n`);
});
