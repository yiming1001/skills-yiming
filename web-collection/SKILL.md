---
name: web-collection
description: Browser plugin data collection via a local bridge, in strict synchronous closed-loop mode. Use for Douyin, TikTok, Xiaohongshu, Amazon, and Bilibili collection tasks.
metadata: { "openclaw": { "emoji": "🕸️", "requires": { "bins": ["curl", "node"] } } }
---

# Web Collection

Use this skill for browser-extension collection tasks on:

- Douyin
- TikTok
- Xiaohongshu
- Amazon
- Bilibili

## Core Rules

1. Use the user's normal Chrome environment, not the isolated `openclaw` browser profile.
2. Prefer the local bridge + plugin flow over generic browser tooling.
3. Default to synchronous closed-loop execution.
4. Do not reply before the collection script finishes.
5. Use the same base URL for collect, status, and stop.

## First-Time Setup

This skill uses one preferences file:

`$OPENCLAW_STATE_DIR/skill-state/web-collection/preferences.json`

Fallback:

`$HOME/.openclaw/skill-state/web-collection/preferences.json`

Helper script:

```bash
{baseDir}/scripts/export_preference.sh show
{baseDir}/scripts/export_preference.sh check
{baseDir}/scripts/export_preference.sh apply-recommended
{baseDir}/scripts/export_preference.sh set-key defaultExportMode csv
```

Required defaults:

- `defaultExportMode`
- `defaultMaxItems`
- `defaultFetchDetail`
- `defaultDetailSpeed`

`run.sh` enforces this. If these are incomplete, collection must not start.

### First-run flow

On first use:

1. Briefly explain the four required defaults:
   - 导出方式
   - 默认采集条数
   - 是否默认采集详情
   - 默认采集速度
2. Ask only one question first:
   - `推荐配置`
   - `自己配置`
3. If the user chooses `推荐配置`, run:

```bash
{baseDir}/scripts/export_preference.sh apply-recommended
```

4. If the user chooses `自己配置`, ask for all four values in one message, not one by one.
5. Only continue when `check` passes.

Preferred quick-reply prompt:

```text
第一次使用网页采集，需要先完成默认配置。
这些配置包括：
- 导出方式
- 默认采集条数
- 是否默认采集详情
- 默认采集速度
你可以直接用推荐配置，也可以自己配置。
[[quick_replies: 推荐配置, 自己配置]]
```

Preferred custom-config prompt:

```text
好，我们一次性把默认配置定好。请直接按下面格式回复：

导出方式：CSV / 多维表格
默认采集条数：10 / 20 / 50 / 100
是否默认采集详情：是 / 否
默认采集速度：fast / medium / slow

说明：
- 多维表格：适合查看、筛选、分享
- CSV：适合本地保存
- 采集详情：开启后结果更完整，但一般更慢
- 采集速度：推荐 fast
```

Recommended defaults:

- 导出方式：`多维表格`
- 采集条数：`20`
- 采集详情：`true`
- 采集速度：`fast`

## Export Behavior

- `bitable`
  - run with `--export-target bitable`
  - expect `export.tableUrl` on success
- `csv`
  - run with `--export-target csv`
  - do not require a table link in the final reply

## Entry Point

Preferred wrapper:

```bash
bash {baseDir}/scripts/run.sh ...
```

The wrapper:

- applies stored preferences
- enforces required setup
- prefers the connector repo's real bridge loop when available
- falls back to the bundled loop only if needed

## Common Commands

Douyin keyword search:

```bash
bash {baseDir}/scripts/run.sh \
  --platform douyin \
  --keyword "AI" \
  --ensure-bridge
```

Amazon keyword search:

```bash
bash {baseDir}/scripts/run.sh \
  --platform amazon \
  --keyword "Chinese porcelain" \
  --ensure-bridge
```

Bilibili keyword search:

```bash
bash {baseDir}/scripts/run.sh \
  --platform bilibili \
  --keyword "古董" \
  --ensure-bridge
```

## Platform Defaults

Wrapper defaults:

- `douyin` => `videoKeyword`
- `tiktok` => `keywordSearch`
- `xiaohongshu` => `keywordSearch`
- `amazon` => `keywordSearch`
- `bilibili` => `keywordSearch`

Supported methods:

- `douyin`: `videoKeyword`, `creatorKeyword`, `creatorLink`, `creatorVideo`, `videoComment`, `videoInfo`, `videoLink`
- `tiktok`: `keywordSearch`, `userVideo`, `tiktokComment`, `tiktokCreatorKeyword`, `tiktokCreatorLink`
- `xiaohongshu`: `keywordSearch`, `creatorNote`, `creatorLink`, `creatorKeyword`, `noteLink`, `noteComment`
- `amazon`: `keywordSearch`, `productLink`, `productReview`
- `bilibili`: `keywordSearch`, `videoInfo`, `creatorVideo`, `bilibiliComment`

## Closed Loop

The loop must:

1. verify `pluginConnected=true`
2. wait for idle state
3. start `/api/collect`
4. handle `TASK_RUNNING` via `stop -> wait idle -> retry`
5. poll `/api/tasks/<taskId>` until `completed` or `error`
6. if export is required, verify the expected export result

## Final Reply

When successful:

1. If export mode is `bitable` and `export.tableUrl` exists, include the table link first.
2. If export mode is `csv`, explicitly say export mode is CSV.
3. Then include:
   - status
   - export status
   - collected count
   - short analysis

When `bitable` export is expected but no table link exists, explicitly say export did not finish correctly.

## Troubleshooting

- `pluginConnected=false`
  - Chrome/plugin is not connected to the bridge
- bridge/status mismatch
  - ensure collect, status, and stop all use the same base URL
- `TASK_RUNNING`
  - use stop + retry, or `--force-stop-before-start`
- long record output hiding key fields
  - trust the connector loop's compact summary output rather than raw task JSON
