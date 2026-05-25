# Sandbox Workflow

Use this reference when refreshing account sandbox profiles, inspecting existing browser sandbox tabs, or snapshotting an existing tab.

## Rules

- Strictly read-only.
- Only list tabs or snapshot an existing target.
- Do not navigate.
- Do not create pages or tabs.
- Do not click, type, or mutate browser state.

## Commands

```bash
bash {baseDir}/scripts/run.sh sandbox profiles
bash {baseDir}/scripts/run.sh sandbox profiles --refresh --format json
bash {baseDir}/scripts/run.sh sandbox tabs --account "脱不花"
bash {baseDir}/scripts/run.sh sandbox tabs --profile browser-1 --format json
bash {baseDir}/scripts/run.sh sandbox snapshot --account "脱不花" --target-id <targetId>
bash {baseDir}/scripts/run.sh sandbox snapshot --url-contains dashboardV4 --url-not-contains /review
```

## Runtime API

Call Runtime browser bridge with Runtime admin auth.

Profiles:

- cached list: read `browserProfileSnapshot` from mx-auto preferences.
- refresh: call `GET /browser-bridge`, normalize `profiles[]`, and save `browserProfileSnapshot`.
- saved fields: `id`, `name`, `aliases`, `profileMode`, `loadedAt`.

Tabs:

```json
{ "action": "tabs", "profile": "browser-1" }
```

Snapshot:

```json
{
  "action": "snapshot",
  "profile": "browser-1",
  "targetId": "<targetId>",
  "maxChars": 6000
}
```

## Target Resolution

- Account names for scripts and sandbox inspection are resolved from cached profile `id`, `name`, or `aliases` using exact matching.
- Use `--account <name>` for human account names such as `脱不花`; use `--profile <id>` for explicit Runtime profile ids.
- Refresh profiles only when the user asks to update/list account sandboxes; do not refresh on every script run.
- `--target-id` wins when present.
- Otherwise filter existing tabs by all `--url-contains` values and no `--url-not-contains` values.
- Zero matches is a clear no-match error.
- Multiple matches requires user disambiguation.

## Output

- Profiles: account sandbox count, `id`, `name`, `aliases`, cache time.
- Tabs: profile, tab count, targetId, title, URL.
- Snapshot: profile, targetId, matched URL, text snapshot or extracted content.
