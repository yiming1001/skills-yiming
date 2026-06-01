---
name: mx-auto
description: Local Runtime automation entrypoint for App triggers, read-only browser sandbox inspection, and local script execution. Use when the user wants to list or run Runtime triggers, inspect existing browser sandbox tabs/snapshots, or list/show/run local App scripts.
metadata:
  short-description: Local Runtime automation router
---

# mx-auto

Use this skill as a lightweight router for local Runtime automation. Keep the first read small: load only the reference file that matches the user's intent.

## Intent Routing

- **Triggers**: list, refresh, inspect, or run callable App triggers. Read [references/triggers.md](references/triggers.md).
- **Sandbox**: list existing browser sandbox tabs or snapshot an existing tab. Read [references/sandbox.md](references/sandbox.md).
- **Scripts**: list, inspect, or run local App scripts/examples. Read [references/scripts.md](references/scripts.md).
- **Mixed requests**: when a task combines multiple capabilities or needs troubleshooting across them, read [references/learning-guide.md](references/learning-guide.md).

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

Frequent scripts registry:

`{resolved app home}/runtime/frequent-scripts.json`

Helper:

```bash
bash {baseDir}/scripts/frequent_scripts.sh show
bash {baseDir}/scripts/frequent_scripts.sh get
bash {baseDir}/scripts/frequent_scripts.sh set '<json-array-or-registry>'
```

## Entry Points

Prefer the wrapper:

```bash
bash {baseDir}/scripts/run.sh ...
```

Capability commands:

```bash
bash {baseDir}/scripts/run.sh triggers list --format json
bash {baseDir}/scripts/run.sh triggers run --trigger-name "小红书测试"
bash {baseDir}/scripts/run.sh sandbox profiles --refresh --format json
bash {baseDir}/scripts/run.sh sandbox tabs --account "脱不花" --format json
bash {baseDir}/scripts/run.sh sandbox snapshot --account "脱不花" --url-contains dashboardV4 --url-not-contains /review
bash {baseDir}/scripts/run.sh scripts list --format json --compact --cache-first
bash {baseDir}/scripts/run.sh scripts list --format json --compact --cache-first --catalog
bash {baseDir}/scripts/run.sh scripts show xiaohongshu/note.search.v1 --format json --compact --cache-first
bash {baseDir}/scripts/run.sh scripts show douyin/video.search.v1 --format json --compact --cache-first --catalog
bash {baseDir}/scripts/run.sh scripts show "小红书搜笔记" --format json --cache-first
bash {baseDir}/scripts/run.sh scripts run "小红书搜笔记" --wait true --format json
```

Legacy trigger commands remain supported:

```bash
bash {baseDir}/scripts/run.sh --list-triggers
bash {baseDir}/scripts/run.sh --trigger-name "小红书测试"
```

## Safety Rules

- Prefer local Runtime auto-discovery before asking the user for paths, ports, or tokens.
- Store only non-secret defaults such as `defaultAppHome` or `defaultLocalBaseUrl`.
- For script routing, default to the frequent-script registry. Low-frequency scripts must be added to the registry before AI can run them.
- Use `--catalog` only for discovery or add-to-frequent flows; do not use it as a direct execution path.
- Script execution must explicitly choose an account sandbox with `--account` or `--browser-profile-id`; do not rely on Runtime's default browser profile for business scripts.
- Use exact trigger/script names for execution. Do not fuzzy-match names when running.
- Sandbox operations are read-only; never navigate, click, type, or create tabs from this skill.
