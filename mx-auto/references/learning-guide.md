# mx-auto Learning Guide

Use this guide only for complex requests that combine trigger and sandbox operations.

## Routing

- Trigger list/run requests: read `references/triggers.md`.
- Existing browser sandbox tab/snapshot requests: read `references/sandbox.md`.

## Shared Rules

- Prefer auto-discovery before asking for Runtime URL, app home, or token.
- Store app home and other non-secret defaults only.
- Never store, print, or copy the Runtime admin token value.
- Pass trigger business parameters through `--input-json` exactly as provided. Do not remap them to script fields or `inputOverrides`.
- Normalize date input before execution:
  - `relative_day` uses `relativeDays` and optional `numericDayOffsets`
  - `specific_date` uses `targetDates`
- If a trigger needs `sandboxId`, the user may provide the exact sandbox name directly; let Runtime decide whether it is valid.
- Use exact names for execution targets; do not fuzzy-match a trigger when running it.
- Ask only after Runtime discovery or target resolution fails.

## Trigger Input Issues

When a trigger run fails because of missing or invalid input, check in order:

1. The trigger command used `--input-json` and the value is a JSON object.
2. If the trigger uses dates, `dateMode` matches the intended structure.
3. In `relative_day` mode, only `relativeDays` and optional `numericDayOffsets` are used.
4. In `specific_date` mode, only `targetDates` is used.
5. Required business fields such as `keyword`, `url`, request IDs, or `sandboxId` were passed under their trigger input names.
6. If Runtime expects `sandboxId`, the user-provided exact sandbox name or ID was passed through unchanged.
7. Only if Runtime still reports `sandboxId` invalid, refresh once with `sandbox profiles --refresh --format json` and retry.

## Failure Framing

Clearly distinguish:

- Runtime unavailable
- Runtime unauthorized or token file missing
- target resolution/cache miss
- trigger input missing required params
- trigger input has invalid `sandboxId`
- command execution failure
- sandbox tab no-match or multiple-match disambiguation
