# Trigger Workflow

Use this reference when listing, refreshing, or running parameterized App triggers.

## Commands

```bash
bash {baseDir}/scripts/run.sh triggers list
bash {baseDir}/scripts/run.sh triggers list --format json
bash {baseDir}/scripts/run.sh triggers run --trigger-name "小红书测试"
bash {baseDir}/scripts/run.sh triggers run --trigger-id trigger_xxx --input-json '{"keyword":"AI employee"}'
bash {baseDir}/scripts/run.sh triggers run --trigger-id trigger_xxx --input-json '{"keyword":"AI employee","sandboxId":"脱不花"}'
bash {baseDir}/scripts/run.sh triggers run --trigger-id trigger_xxx --input-json '{"dateMode":"relative_day","relativeDays":["今天"],"numericDayOffsets":"7","sandboxId":"脱不花"}'
bash {baseDir}/scripts/run.sh triggers run --trigger-id trigger_xxx --input-json '{"dateMode":"specific_date","targetDates":["2026-06-04"],"sandboxId":"脱不花"}'
```

Legacy forms remain valid:

```bash
bash {baseDir}/scripts/run.sh --list-triggers
bash {baseDir}/scripts/run.sh --trigger-name "小红书测试"
```

## Runtime API

- Refresh catalog from `GET /trigger-services`.
- Execute through `POST /local/commands/send`.
- `--input-json` is passed through to the trigger `input` field as-is.
- Command body:

```json
{
  "target": "trigger.execute",
  "payload": { "triggerId": "trigger_xxx", "input": {} },
  "wait": true,
  "leaseTtlMs": 60000
}
```

## Resolution

- Prefer exact `triggerName` for human requests.
- Resolve exact cached trigger name first, then explicit `triggerId`.
- Do not fuzzy-match names for execution.
- If name resolution fails, include cached candidate names when available.

## Input

- `--input-json` must be a JSON object.
- Treat trigger input as the public execution contract. Do not rename keys, infer script parameters, or rewrite values into `inputOverrides`.
- Resolve the exact trigger first with `triggers list --format json`, then run it with `triggers run`.
- Pass only the fields the trigger actually needs. Defaults, validation, and any binding to internal script steps are owned by Runtime.
- Normalize date input into one of two shapes before running:
  - when the user says `今天`、`昨天`、`近几天`、`偏移天数` and similar relative ranges, use `dateMode: "relative_day"`
  - in `relative_day` mode, use `relativeDays` and optional `numericDayOffsets`
  - when the user gives concrete calendar dates, use `dateMode: "specific_date"`
  - in `specific_date` mode, use `targetDates`
- Do not mix the two date shapes in one payload. By default, do not send `relativeDays` or `numericDayOffsets` together with `targetDates`.
- `numericDayOffsets` is a text-style supplement for `relative_day` mode only; it does not belong to `specific_date` mode.
- `sandboxId` is just another trigger input field:
  - pass it only when the target trigger configuration expects it
  - it may be a Runtime sandbox ID or the user's exact sandbox name such as `脱不花`
  - prefer accepting the user's exact sandbox name directly; do not require looking up the ID first
  - if Runtime reports missing or invalid `sandboxId`, surface that error directly instead of choosing a fallback profile

## Snapshot

Cache only callable and available triggers:

- `id`
- `name`
- `summary`
- `status`
- `callable`
- `available`
- `lastRunAt`
- `updatedAt`

## Output

- Human list: count, names, status, useful summary.
- JSON list: `mode`, `sourceMode`, `loadedAt`, `registryPath`, `triggerCount`, `triggers[]`.
- Run result: `target`, `commandId`, `resultType`, final status, key result.

## Fast AI Path

1. Use `triggers list --format json` to resolve the exact trigger name or ID.
2. Normalize natural-language dates into either `relative_day` or `specific_date`; ask only when the user's date intent is genuinely ambiguous.
3. Run with `triggers run --trigger-name/--trigger-id --input-json '{...}'`.
4. If Runtime rejects the input, relay the missing-field or invalid-`sandboxId` error directly.
