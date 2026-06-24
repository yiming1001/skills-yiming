# web-collection

`web-collection` is a browser-extension data collection skill for Douyin, TikTok, Xiaohongshu, Amazon, and Bilibili.

It prioritizes the cloud connector flow, with local connector execution as a fallback. The skill covers first-time onboarding, connector and bitable setup, cloud credential collection, closed-loop execution, export handling, and troubleshooting.

## Core Files

- `SKILL.md`
- `scripts/run.sh`
- `scripts/preflight_check.sh`
- `scripts/cloud_dispatch_loop.sh`
- `scripts/collect_and_export_loop.sh`
- `scripts/export_preference.sh`
- `scripts/reexport_task.sh`
- `references/learning-guide.md`
- `assets/`

## Install

Install only this skill directory:

```bash
python3 <skill-installer-path>/install-skill-from-github.py \
  --url https://github.com/yiming1001/skills-yiming/tree/main/web-collection
```

The installed directory should preserve this structure:

```text
web-collection/
  SKILL.md
  scripts/
  references/
  assets/
```

Restart your coding agent or client after installation so the skill is loaded.

## Execution Entry

Use the wrapper script:

```bash
bash scripts/run.sh --platform douyin --keyword "AI"
```

The wrapper reads stored preferences, runs preflight checks, chooses exactly one execution mode, and dispatches through either the cloud connector loop or the local connector loop.
