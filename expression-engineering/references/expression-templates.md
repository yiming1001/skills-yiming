# Expression Template Directory

Use this file as the template directory. Load only the specific template file needed for the current task.

## Template Source Priority

Before choosing a built-in template, check whether the user has provided a template in a document, Markdown file, prompt, Feishu/Lark doc, or case material.

Priority:
1. **User-provided template.** If the source document contains a usable template, follow it first. Preserve its section order, required fields, naming conventions, examples, and acceptance rules unless they conflict with the user's current goal.
2. **User-provided template plus adaptation.** If the template exists but does not fully match the current audience, keep its backbone and adapt examples, depth, tone, and visual/PPT requirements.
3. **Template directory.** If no user template is provided, choose one file from `references/templates/` based on audience, object, and task.
4. **General expression template.** If audience and object are still unclear, load `references/templates/general-expression.md`.

When using a user-provided template, state briefly which template was used and what was adapted. Do not silently replace the user's template with a generic one.

## Template Directory

- **实操型 / Hands-On Practice:** `references/templates/hands-on-practice.md`
  - Use for classroom practice documents, hands-on tutorials, workflow operation guides, plugin/API setup guides, and task sheets.
  - This template is adapted from `lark-practice-doc` and includes the strict four-column task table, screenshot handling, validation examples, parameter tables, and troubleshooting checklist.
- **决策型 / Decision Guide:** `references/templates/decision-guide.md`
  - Use when leaders, product owners, project managers, clients, or reviewers need to choose a direction.
- **认知解释型 / Concept Guide:** `references/templates/concept-guide.md`
  - Use when beginners or cross-functional readers need to understand a concept, method, model, product, or technical idea.
- **推进共识型 / Alignment Guide:** `references/templates/alignment-guide.md`
  - Use when the goal is team alignment, buy-in, role clarity, or reducing resistance.
- **复盘案例型 / Case Review Guide:** `references/templates/case-review.md`
  - Use when summarizing a project, experiment, incident, campaign, or implementation case.
- **管理规范型 / Policy Or SOP Guide:** `references/templates/policy-sop.md`
  - Use when the audience needs repeatable standards, governance, quality rules, review criteria, or team process.
- **通用表达模板 / General Expression:** `references/templates/general-expression.md`
  - Use only when no user-provided template or audience/object template fits.

## Selection Questions

Ask only when the answer materially changes the structure:
- Do you already have a preferred template or example document?
- Who is the primary reader: beginner, operator, manager, client, cross-functional partner, or reviewer?
- Is the goal to teach, execute, decide, align, explain, standardize, or review?
- Should the output be a Feishu document, PPT outline, or both?
- Does the document need screenshots, diagrams, generated images, parameter tables, or validation examples?

If the user says they have a template, fetch/read that template first and treat it as source material.
