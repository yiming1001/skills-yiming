---
name: lark-practice-doc
description: Use when creating, rewriting, summarizing, or standardizing Feishu/Lark classroom practice documents such as 实战练习, 课堂练习, 实战营, Coze plugin/workflow/agent tutorials, or hands-on operation guides. Produces strict four-column task-table documents with real Lark screenshot blocks, validation examples, parameter tables, and troubleshooting checklists.
---

# Lark Practice Doc

## Purpose

Use this skill to create or rewrite Feishu/Lark practice documents as classroom task sheets. The default output is a strict, table-first document that helps learners follow steps, instructors teach consistently, and assistants troubleshoot quickly.

## Default Document Structure

Unless the user explicitly asks for a free-form or chapter-style version, use this exact structure:

1. **核心逻辑概述**: one callout summarizing the runnable practice product and the execution loop.
2. **实战目标与最终产物**: a compact two-column table.
3. **操作步骤总表**: the main four-column table.
4. **关键参数速查**: parameters, values, and purpose.
5. **测试输入与预期输出**: concrete input, expected output, and agent/user validation example.
6. **课堂排查清单**: common failures and first checks.
7. **参考截图区**: real screenshot blocks copied or reinserted from source docs.

Read `references/table-practice-template.md` before drafting the document body.

## Workflow

1. **Resolve source docs first**
   - For `/wiki/<token>` links, resolve the real `obj_token` with `lark-cli wiki spaces get_node --as user`.
   - Fetch source content with `lark-cli docs +fetch --as user --api-version v2`.
   - Identify title, scenario, final product, parameters, validation examples, and media blocks.

2. **Rewrite around a runnable product**
   - The subject is not "what each platform setting means".
   - The subject is "what the learner will build and verify".
   - Prefer "本实战里这样填写..." over generic configuration explanation.

3. **Use the strict table pattern**
   - The main table columns must be exactly: `具体步骤`, `步骤描述`, `参考截图`, `备注`.
   - Each row must represent one learner action or action group.
   - The `参考截图` cell should contain a short pointer such as `见截图：创建插件入口`.
   - Put actual images in `参考截图区` if table-cell image insertion may be unstable.

4. **Preserve real screenshots**
   - Never leave only image tokens as text.
   - Reinsert images with real Lark image blocks, for example `<img src="TOKEN"/>`.
   - If rewriting overwrites the document, refetch the outline and reinsert screenshots after the rewrite.
   - If screenshots cannot safely live inside the table, use a bottom `参考截图区` grouped by step.

5. **Validate the practice loop**
   - Include exact request URLs, paths, methods, parameter locations, input examples, expected output examples, and final learner-facing validation prompt.
   - Add a troubleshooting checklist focused on the most likely classroom failures.

## Writing Rules

- Audience: learners following a live class or self-paced task.
- Tone: direct, executable, and concrete.
- Use code formatting for URLs, parameter names, tool names, field names, paths, and fixed values.
- Avoid long abstract explanations. Convert them into row-level notes or troubleshooting items.
- Do not expose secrets. Replace tokens, API keys, or private credentials with placeholders unless the source intentionally uses public demo values and the user approves.
- Prefer stable public APIs for examples. If an API requires credentials, clearly separate "authorization configuration" from "request parameters".

## References

- `references/table-practice-template.md`: required table structure and reusable section templates.
- `references/examples.md`: concise patterns for API plugin, cloud function IDE, and cross-platform API-call practice documents.
