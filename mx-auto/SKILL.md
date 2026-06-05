---
name: mx-auto
description: Local Runtime automation entrypoint for App triggers and read-only browser sandbox inspection. Use when the user wants to list or run Runtime triggers, or inspect existing browser sandbox tabs/snapshots.
metadata:
  short-description: Local Runtime automation router
---

# mx-auto

Use this skill as a lightweight router for local Runtime automation. Keep the first read small: load only the reference file that matches the user's intent.

## Intent Routing

- **Triggers**: list, refresh, inspect, or run callable App triggers. Read [references/triggers.md](references/triggers.md).
- **Sandbox**: list existing browser sandbox tabs or snapshot an existing tab. Read [references/sandbox.md](references/sandbox.md).
- **Mixed requests**: when a task combines trigger execution and sandbox inspection, or needs troubleshooting across them, read [references/learning-guide.md](references/learning-guide.md).

Do not bulk-load all references. Choose the smallest matching workflow, then run the bundled scripts instead of retyping request logic.

## Shared Runtime Defaults

Preferences file:

`$OPENCLAW_STATE_DIR/skill-state/mx-auto/preferences.json`

Fallback:

`$HOME/.openclaw/skill-state/mx-auto/preferences.json`

Helper:

```bash
bash {baseDir}/scripts/export_preference.sh show
bash {baseDir}/scripts/export_preference.sh apply-recommended
bash {baseDir}/scripts/export_preference.sh set-key defaultAppHome "/Users/zhym/Library/Application Support/rpa-app-executor"
```

Runtime base URL discovery:

1. `MX_APP_RUNTIME_BASE_URL`
2. `RPA_RUNTIME_BASE_URL`
3. stored `defaultLocalBaseUrl`
4. standard Runtime ports: `8877`, `8878`, `8879`

Runtime app home discovery:

1. `--app-home`
2. `MX_AUTO_APP_HOME`
3. `RPA_APP_HOME`
4. stored `defaultAppHome`
5. platform default app home

Runtime admin token discovery:

1. `MX_APP_RUNTIME_ADMIN_TOKEN`
2. `RPA_RUNTIME_ADMIN_TOKEN`
3. `{resolved app home}/runtime/admin-token.json`

Never store or print the Runtime admin token value. App updates may rotate or recreate it; re-read the token file at runtime.

## Entry Points

Prefer the wrapper:

```bash
bash {baseDir}/scripts/run.sh ...
```

Capability commands:

```bash
bash {baseDir}/scripts/run.sh triggers list --format json
bash {baseDir}/scripts/run.sh triggers run --trigger-name "小红书测试"
bash {baseDir}/scripts/run.sh triggers run --trigger-id trigger_xxx --input-json '{"keyword":"美食探店","sandboxId":"脱不花"}'
bash {baseDir}/scripts/run.sh triggers run --trigger-id trigger_xxx --input-json '{"dateMode":"relative_day","relativeDays":["今天"],"numericDayOffsets":"7","sandboxId":"脱不花"}'
bash {baseDir}/scripts/run.sh triggers run --trigger-id trigger_xxx --input-json '{"dateMode":"specific_date","targetDates":["2026-06-04"],"sandboxId":"脱不花"}'
bash {baseDir}/scripts/run.sh sandbox profiles --refresh --format json
bash {baseDir}/scripts/run.sh sandbox tabs --account "脱不花" --format json
bash {baseDir}/scripts/run.sh sandbox snapshot --account "脱不花" --url-contains dashboardV4 --url-not-contains /review
```

Legacy trigger commands remain supported:

```bash
bash {baseDir}/scripts/run.sh --list-triggers
bash {baseDir}/scripts/run.sh --trigger-name "小红书测试"
```

## Safety Rules

- Prefer local Runtime auto-discovery before asking the user for paths, ports, or tokens.
- Store only non-secret defaults such as `defaultAppHome` or `defaultLocalBaseUrl`.
- Treat trigger input as the source of truth for business parameters. Pass `--input-json` through to `trigger.execute` without renaming keys or inventing defaults.
- Date inputs must use one of two mutually exclusive shapes:
  - relative dates: `dateMode:"relative_day"` with `relativeDays` and optional `numericDayOffsets`
  - specific dates: `dateMode:"specific_date"` with `targetDates`
- Do not mix `relativeDays` or `numericDayOffsets` with `targetDates` in the same recommended payload.
- When a trigger expects `sandboxId`, the user may provide the exact sandbox name directly, or pass a Runtime sandbox ID. Let Runtime validate or resolve it.
- Use exact trigger names for execution. Do not fuzzy-match names when running.
- Sandbox operations are read-only; never navigate, click, type, or create tabs from this skill.
