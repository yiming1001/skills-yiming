# Scripts Workflow

`mx-auto` no longer uses scripts as a public execution path.

If you reached this file from old notes or cached instructions:

- switch to `references/triggers.md` for all business execution flows
- use `references/sandbox.md` only for read-only browser sandbox inspection
- treat any `run.sh scripts ...` example as deprecated

The wrapper now rejects `scripts` subcommands and asks callers to use `triggers` or `sandbox`.
