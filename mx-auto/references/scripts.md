# Scripts Workflow

Use this reference when listing, showing, or running local App scripts/examples.

## Commands

```bash
bash {baseDir}/scripts/run.sh scripts list
bash {baseDir}/scripts/run.sh scripts list --format json
bash {baseDir}/scripts/run.sh scripts list --format json --compact --cache-first
bash {baseDir}/scripts/run.sh scripts list --format json --compact --cache-first --catalog
bash {baseDir}/scripts/run.sh scripts show xiaohongshu/note.search.v1 --format json --compact --cache-first
bash {baseDir}/scripts/run.sh scripts show douyin/video.search.v1 --format json --compact --cache-first --catalog
bash {baseDir}/scripts/run.sh scripts show "小红书搜笔记" --format json --cache-first
bash {baseDir}/scripts/run.sh scripts run "小红书搜笔记" --wait true --format json
```

## Runtime API

- List/show candidate scripts from `GET /examples/catalog`.
- Read and write the frequent execution whitelist from `{appHome}/runtime/frequent-scripts.json`.
- For AI routing, default to the frequent registry and only use catalog mode when adding or editing frequent scripts.
- Run scripts through `POST /local/commands/send` with `target: "script.run"`.

Run body:

```json
{
  "target": "script.run",
  "payload": {
    "name": "xiaohongshu.note.search.v1.json",
    "source": "openclaw",
    "inputOverrides": {},
    "browserProfileId": "browser-1",
    "exportTarget": "file_snapshot",
    "authorizationId": "",
    "bitableExportMode": "new_table"
  },
  "wait": true,
  "leaseTtlMs": 60000
}
```

## Resolution

- `scripts list` and `scripts show` default to the high-frequency registry view.
- `scripts run` only allows targets that resolve from the high-frequency registry.
- Matching order is fixed: exact `scriptName`, exact alias, normalized contains alias.
- `--catalog` switches `list/show` into low-frequency discovery mode for add-to-frequent workflows.
- Compact list/show dedupes by `workflowId` and prefers bundle-style names such as `xiaohongshu/note.search.v1`.
- Exact legacy names remain usable when explicitly present in the frequent registry or when using `--catalog` for discovery.

## Input

- `--input-json` must be a JSON object.
- Pass it as `inputOverrides`.
- `scripts show --format json` returns compact `scriptSummary` plus `paramPlan` by default.
- `resolvedTarget` shows whether the request matched an exact script name or a high-frequency alias.
- Use `--full` only when debugging or when the complete manifest is explicitly needed.
- `paramPlan` contains:
  - `requiredParams`
  - `defaultParams`
  - `missingRequiredParams`
- Required params are the business target/scope fields that must come from the user or an explicit last-used opt-in:
  - `keyword`
  - `link`
  - `url`
  - date scope for statistics/dashboard scripts: at least one of `relativeDays`, `numericDayOffsets`, or `targetDates`
  - account sandbox: `--account <name>` or `--browser-profile-id <id>`
- Default params may be filled from manifest defaults, last-used input, preferences, script config, or Runtime defaults:
  - `maxItems`, `limit`, `productLimit`, `sortBy`, `publishTime`, `duration`, `fetchDetail`, `detailDelay`, `noteType`, `searchScope`, `location`, `userType`
  - export params such as `exportTarget`, `authorizationId`, `bitableExportMode`
- High-frequency config may also fill:
  - `preferredAccount`
  - `defaultInput`
- Do not silently use manifest sample defaults for `keyword`, `link`, `url`, or date scope.
- Do not silently use Runtime's default browser profile for scripts; account sandbox is a business context and must be explicit.
- `--account <name>` resolves exact `id`, `name`, or `aliases` from cached `browserProfileSnapshot`.
- If the account cache is stale or missing, refresh it once with `bash {baseDir}/scripts/run.sh sandbox profiles --refresh --format json`.
- `--use-last-input` allows `lastUsedInput` to satisfy required business params.
- If `--export-target personal_bitable` is used and no authorization is available, require `--authorization-id`.
- If Runtime or script reports missing input, surface the error clearly.

Runtime options:

```bash
--account <name>
--browser-profile-id <id>
--export-target file_csv|file_snapshot|external_bitable|personal_bitable
--authorization-id <id>
--bitable-export-mode existing_table|new_table
--use-last-input
--compact
--cache-first
--full
--catalog
--frequent-only
```

## Output

- List: script count, name, platform label, runner. With `--compact`, output is deduped and includes required/defaultable params.
- Show: compact `scriptSummary` and `paramPlan` by default; `--full` adds the complete manifest.
- Run: preserve `target`, `commandId`, `resultType`, `status`, and message.

## Frequent Scripts

Frequent scripts are stored in `{appHome}/runtime/frequent-scripts.json` as:

```json
{
  "version": 1,
  "updatedAt": "2026-05-29T00:00:00.000Z",
  "updatedBy": "manual",
  "scripts": [
    {
      "scriptName": "xiaohongshu/note.search.v1",
      "aliases": ["小红书搜笔记", "搜小红书笔记"],
      "preferredAccount": "browser-9",
      "defaultInput": { "maxItems": 8 },
      "enabled": true
    }
  ]
}
```

Manage them with:

```bash
bash {baseDir}/scripts/frequent_scripts.sh show
bash {baseDir}/scripts/frequent_scripts.sh get
bash {baseDir}/scripts/frequent_scripts.sh add '<json-entry>'
bash {baseDir}/scripts/frequent_scripts.sh remove '小红书搜笔记'
bash {baseDir}/scripts/export_preference.sh set-frequent-scripts '<json-array>'
bash {baseDir}/scripts/export_preference.sh get-frequent-scripts
bash {baseDir}/scripts/export_preference.sh clear-frequent-scripts
```

Rules:

- Match order: exact script name, exact alias, normalized contains alias.
- Multiple alias matches are an error; do not auto-pick.
- `preferredAccount` is lower priority than explicit `--account` / `--browser-profile-id`.
- `defaultInput` is lower priority than explicit `--input-json`.

## Fast AI Path

1. Use `scripts list --format json --compact --cache-first` to inspect only the high-frequency execution whitelist.
2. Use `scripts show <name> --format json --compact --cache-first` with any known `--input-json` and account option to inspect only `missingRequiredParams`.
3. Ask the user only for missing business params: `keyword`, `link`, `url`, date scope, or account sandbox.
4. Run with explicit `--account` or `--browser-profile-id`; let defaults cover defaultable params.

## Low-frequency Add Flow

1. Use `scripts list --format json --compact --cache-first --catalog` to inspect the low-frequency catalog.
2. Use `scripts show <name> --format json --compact --cache-first --catalog` to confirm parameters before promoting.
3. Add the chosen script into the frequent registry with aliases, preferred account, and default input.
4. Return to the default high-frequency path and run from there.
