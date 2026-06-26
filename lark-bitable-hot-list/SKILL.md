---
name: lark-bitable-hot-list
description: Use when collecting hot-list or trending data from Bilibili, Douyin, or Xiaohongshu and writing the results into a user's own Feishu/Lark Base via a backend execute API, or when managing this skill's stored backend token and table bindings. This skill is specifically for the hot_list part of the collect_big_Data plugin, not for the whole plugin UI.
---

# Lark Bitable Hot List

This skill is now executable.

It keeps user preferences inside the skill itself and calls a backend execute API that performs the real hot-list collection and Base writing.

Use it when the user wants to:

- 采集 B 站、抖音、小红书热榜
- 把热榜结果写入飞书多维表
- 在 Skill 里保存后端 API token
- 在 Skill 里保存自己的 Base token / 个人授权码
- 把当前插件里的热榜能力抽成独立 Skill
- 新增或调整某个平台的热榜配置
- 排查热榜接口的参数、`dataPath`、分页或字段映射问题

Do not use it for:

- 整个插件 UI 改造
- 路由、页面、抽屉、弹窗交互
- 非热榜功能，如用户主页、商品详情、评论采集

## Runtime

The executable entrypoint is:

- preferred wrapper: `scripts/run.sh`
- underlying runtime: `scripts/hot_list_skill.js`
- preferred local setup UI: `scripts/run.sh open-local-config-page`

Persistent preferences are stored at:

- `~/.codex/skills/lark-bitable-hot-list/state/preferences.json`
- `~/.codex/skills/lark-bitable-hot-list/state/platform-preferences.json`

The script supports these operations:

- `open-local-config-page`
- `set-backend-token`
- `add-or-update-binding`
- `set-default-binding`
- `preflight-check`
- `show-current-preferences`
- `show-platform-options`
- `set-platform-preferences`
- `show-platform-preferences`
- `show-runtime-schema`
- `execute`

## Workflow

1. For first-time setup or preference editing, prefer `scripts/run.sh open-local-config-page`.
2. Always run `scripts/run.sh preflight-check --platform-id <platform>` before any setup-sensitive action or hot-list execution.
3. If preflight returns `setup_required=true`, stop and collect the missing configuration before continuing.
4. Required setup is backend token plus one default Lark Base binding with `base_token` and `api_key`.
5. For hot-list execution, confirm the target platform is one of:
   - `bilibili`
   - `douyin`
   - `xiaohongshu`
6. Read `schemas/hot_list/*.json` for executable platform schemas and `schemas/tables/*.json` for table schemas.
7. Run `scripts/run.sh execute ...`.
8. Send the platform `runtime_schema` and the referenced `table_schema` to the backend, then let the backend execute collection, table creation, deduplication, and Base writing.
9. Report the backend result clearly to the user.

## Core Model

The reusable unit is:

```text
read local preferences
  -> run preflight gate
  -> if setup_required, stop and collect required configuration
  -> resolve active binding
  -> load platform execution preferences
  -> load platform runtime_schema from schemas/hot_list
  -> load referenced table_schema from schemas/tables
  -> send execute payload with runtime_schema + table_schema
  -> backend executes runtime_schema and writes by table_schema
  -> backend writes rows into Feishu Base
  -> return execution result
```

Treat the skill as the owner of platform hot-list schemas, table schemas, and user preference orchestration, not as a local data pipeline.

## What To Reuse From This Repo

Keep these ideas:

- `src/config/fields/*/hot_list.js`: per-platform request schema reference
- `src/config/hotListRegistry.js`: supported hot-list platforms
- the backend contract documented in `references/execution-contract.md`
- executable runtime schemas in `schemas/hot_list/*.json`
- reusable table schemas in `schemas/tables/*.json`

Do not carry over these parts unless the user explicitly wants plugin refactoring:

- Vue components
- localStorage binding management
- route navigation
- drawer / confirm UI
- automation center page behavior

## Execution Rules

When using this skill:

1. Never store secrets in repo-tracked files.
2. Always use the local preferences file managed by `scripts/run.sh` / `scripts/hot_list_skill.js`.
3. Run `preflight-check` before execution and treat `setup_required=true` as a hard stop.
4. When setup is required, ask for all missing required values in one message and do not execute collection yet.
5. Use `show-current-preferences` before execution if binding selection is ambiguous.
6. Prefer the default binding unless the user explicitly asks for another binding.
7. Never ask the user to choose or type the output table name; `table_name` is owned by `schemas/tables/*.json`.
8. Keep collection/API shape in `schemas/hot_list/*.json`; keep one table structure per file in `schemas/tables/*.json`; keep Base writing implementation in the backend.
9. Use platform preferences for reusable execution parameters such as page count, request defaults, and deduplication.

## First-Run Gate

This skill must behave like a setup-gated executable skill.

Before collection, run:

```bash
bash scripts/run.sh preflight-check --platform-id douyin
```

If the result contains `setup_required=true`, stop the workflow and collect the missing values before continuing.

Required values:

- `backend_api_token`
- default table binding
- `base_token`
- `api_key`

The output table name is not user configuration. It comes from the platform table schema, for example:

- `schemas/tables/douyin_hot_list.json`
- `schemas/tables/bilibili_hot_list.json`
- `schemas/tables/xiaohongshu_hot_list.json`

Preferred setup prompt:

```text
首次使用前需要先完成必要配置。请一次性提供：
- 后端 API token
- Lark Base 链接或 base_token
- 个人授权码

收到后我会保存配置，然后再继续执行热榜采集。
```

Do not answer with only a generic introduction when the user's intent is to use or execute this skill and preflight is not ready.

## Local Config Page

The preferred setup path is a local HTML configuration page served by the Skill itself.

Use it when the user wants a button/select style interaction without binding everyone to one Feishu/Lark app:

```bash
bash scripts/run.sh open-local-config-page
```

For testing without opening a browser:

```bash
bash scripts/run.sh open-local-config-page --no-open --port 8798
```

The page runs only on `127.0.0.1` and writes local Skill state through these scripts:

- credentials: `scripts/apply_config.js`
- platform preferences: `scripts/apply_platform_params_config.js`

It edits:

- `~/.codex/skills/lark-bitable-hot-list/state/preferences.json`
- `~/.codex/skills/lark-bitable-hot-list/state/platform-preferences.json`

The page currently covers:

- required credentials: backend API token, binding name, Lark Base link/base token, personal authorization code
- platform tabs: Douyin, Bilibili, Xiaohongshu
- Douyin linked first-level and second-level content categories
- reusable execution preferences such as page size, page count, deduplication, and duplicate handling

Use this local page only as an optional local form. The primary Skill interaction should be the Agent conversation plus CLI commands.

## Platform Selection

This skill does not use Feishu/Lark message-based interactive UI.

For selectable platform parameters, use:

```bash
bash scripts/run.sh show-platform-options --platform-id douyin
bash scripts/run.sh show-platform-options --platform-id douyin --primary-tag 628
```

The command returns machine-readable options that the Agent can present conversationally:

- Douyin: hot-list type, one first-level content tag, one linked second-level content tag, page size `20` or `40`
- Bilibili: request fields from `schemas/hot_list/bilibili.json`
- Xiaohongshu: request fields from `schemas/hot_list/xiaohongshu.json`

Douyin rules:

- First-level and second-level content tags are single-select.
- Second-level options depend on the chosen first-level tag.
- Data window is not a user-facing option; it is fixed to `24` hours in saved preferences.

After the user chooses values, save them with `set-platform-preferences` or `scripts/apply_platform_params_config.js`.

## Platform Preferences

Platform execution preferences are stored separately from credentials:

```text
~/.codex/skills/lark-bitable-hot-list/state/platform-preferences.json
```

The merge order for execution is:

```text
schema execution_defaults
  -> saved platform preferences
  -> current command overrides
```

This means the user can save stable settings once, then only pass the important changing parameters at execution time.

## Command Examples

```bash
bash scripts/run.sh set-backend-token \
  --token "YOUR_BACKEND_TOKEN"

bash scripts/run.sh add-or-update-binding \
  --name "主业务表" \
  --base-token "appxxxx" \
  --api-key "personal_auth_code" \
  --make-default

bash scripts/run.sh preflight-check \
  --platform-id douyin

bash scripts/run.sh show-current-preferences

bash scripts/run.sh show-platform-options \
  --platform-id douyin

bash scripts/run.sh show-platform-options \
  --platform-id douyin \
  --primary-tag 628

bash scripts/run.sh set-platform-preferences \
  --platform-id douyin \
  --request-params '{"func":"high_play","page_size":40,"data_window":24}' \
  --collect-times 2 \
  --deduplication-enabled true \
  --deduplication-strategy keepOld

bash scripts/run.sh show-platform-preferences \
  --platform-id douyin

bash scripts/run.sh show-runtime-schema \
  --platform-id douyin

bash scripts/run.sh execute \
  --platform-id douyin \
  --request-params '{"page":1}'
```

## When To Read More

- For the plugin's hot-list call chain and extraction boundary, read `references/plugin-hot-list-logic.md`.
- For platform-specific hot-list schemas, read `references/platform-hot-list-config.md`.
- For the backend execute payload and response shape, read `references/execution-contract.md`.
- For the executable schema structure, read `references/runtime-schema-contract.md`.

## Output Expectation

For analysis work, provide:

- the platform config summary
- the fetch / transform / write chain
- the recommended extraction boundary

For implementation work, prefer producing:

- local preference management
- binding management
- execute request wiring
- clear user-facing result summaries

## Guardrails

- Do not rebuild the whole plugin when only hot-list capability is needed.
- Do not store secrets in repo files or plugin `localStorage`.
- Do not hardcode one platform's field list into the runtime client.
- Do not mix plugin UI state with skill execution state.
- If backend execution fails, surface the backend error instead of guessing local fallback logic.
