# mx-auto Learning Guide

Use this guide only for complex requests that combine trigger, sandbox, or script operations.

## Routing

- Trigger list/run requests: read `references/triggers.md`.
- Existing browser sandbox tab/snapshot requests: read `references/sandbox.md`.
- Local script list/show/run requests: read `references/scripts.md`.

## Shared Rules

- Prefer auto-discovery before asking for Runtime URL, app home, or token.
- Store app home and other non-secret defaults only.
- Treat account sandbox as required business context for script execution.
- Never store, print, or copy the Runtime admin token value.
- Use exact names for execution targets; do not fuzzy-match a trigger or script when running it.
- Ask only after Runtime discovery or target resolution fails.

## Account Sandbox Issues

When a run uses the wrong account, check in order:

1. `browserProfileSnapshot` in preferences contains the intended account name or alias.
2. The script command used `--account <name>` or `--browser-profile-id <id>`.
3. The final `script.run` payload includes `browserProfileId`.
4. If the snapshot is stale, refresh with `sandbox profiles --refresh --format json`.

## Failure Framing

Clearly distinguish:

- Runtime unavailable
- Runtime unauthorized or token file missing
- target resolution/cache miss
- command execution failure
- account sandbox cache miss or multiple-match disambiguation
- sandbox tab no-match or multiple-match disambiguation
