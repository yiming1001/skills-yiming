# Scripts Workflow

Use this reference when listing, showing, or running local App scripts/examples.

## Commands

```bash
bash {baseDir}/scripts/run.sh scripts list
bash {baseDir}/scripts/run.sh scripts list --format json
bash {baseDir}/scripts/run.sh scripts show xiaohongshu.note.search.v1.json --format json
bash {baseDir}/scripts/run.sh scripts run xiaohongshu.note.search.v1.json --input-json '{"keyword":"美食探店"}' --wait true --format json
bash {baseDir}/scripts/run.sh scripts run xiaohongshu.note.search.v1.json --input-json '{"keyword":"美食探店"}' --browser-profile-id browser-1 --export-target file_snapshot --wait true --format json
```

## Runtime API

- List/show scripts from `GET /examples/catalog`.
- Run scripts through `POST /local/commands/send` with `target: "script.run"`.

Run body:

```json
{
  "target": "script.run",
  "payload": {
    "name": "xiaohongshu.note.search.v1.json",
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

- Run only exact script `name` matches.
- Do not fuzzy-match script names for execution.
- If no exact match exists, list candidate names from the current catalog.

## Input

- `--input-json` must be a JSON object.
- Pass it as `inputOverrides`.
- `scripts show --format json` returns `paramPlan` with only:
  - `requiredParams`
  - `defaultParams`
  - `missingRequiredParams`
- Required params are the business target/scope fields that must come from the user or an explicit last-used opt-in:
  - `keyword`
  - `link`
  - `url`
  - date scope for statistics/dashboard scripts: at least one of `relativeDays`, `numericDayOffsets`, or `targetDates`
- Default params may be filled from manifest defaults, last-used input, preferences, script config, or Runtime defaults:
  - `maxItems`, `limit`, `productLimit`, `sortBy`, `publishTime`, `duration`, `fetchDetail`, `detailDelay`, `noteType`, `searchScope`, `location`, `userType`
  - sandbox/runtime params such as `browserProfileId`
  - export params such as `exportTarget`, `authorizationId`, `bitableExportMode`
- Do not silently use manifest sample defaults for `keyword`, `link`, `url`, or date scope.
- `--use-last-input` allows `lastUsedInput` to satisfy required business params.
- If `--export-target personal_bitable` is used and no authorization is available, require `--authorization-id`.
- If Runtime or script reports missing input, surface the error clearly.

Runtime options:

```bash
--browser-profile-id <id>
--export-target file_csv|file_snapshot|external_bitable|personal_bitable
--authorization-id <id>
--bitable-export-mode existing_table|new_table
--use-last-input
```

## Output

- List: script count, name, platform label, runner.
- Show: manifest metadata, input schema, and `paramPlan`.
- Run: preserve `target`, `commandId`, `resultType`, `status`, and message.
