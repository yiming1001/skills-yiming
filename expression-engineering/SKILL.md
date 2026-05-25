---
name: expression-engineering
description: >-
  Use for expression engineering: turn a rough idea, spoken notes, Markdown
  draft, rule/case document, source materials, or a Feishu/Lark doc/wiki into
  audience-aware communication. Helps clarify the object being expressed, deeply
  question the user, model the audience, choose an expression strategy, create a
  polished Lark document, produce a PPT-ready page outline with speaker scripts
  and visual/image plans, humanize AI-sounding Markdown with human writing
  rules, and analyze/generate diagram images.
---

# Expression Engineering

## Core Behavior

Use this skill when the user wants to turn an idea, concept, proposal, rough draft, Markdown article, or source document into something other people can understand and act on.

The core job is not only polishing language. First clarify the object, then define the audience, then choose the expression strategy and presentation form. When the task is "humanize this Markdown" or "按人类规则改这个 md", preserve the user's structure and judgment while removing AI-shaped writing habits.

Use companion skills when available:
- Use `lark-doc` to fetch, create, update, and verify Feishu/Lark docs and wiki pages.
- Use `imagegen` only after diagram opportunities and image style are confirmed.
- Use presentation/PPT skills only if the user explicitly asks for a full deck. By default, produce a PPT-ready page outline, not a PPT file.

## Workflow

1. **Object Clarification.** Define the thing itself: topic, core claim, definition, mechanism, boundaries, evidence, examples, doubts, and likely misunderstandings.
2. **Audience Modeling.** Define who needs to understand it, whether the user has a preferred template, what they already know, what they care about, what blocks them, and what action they should take.
3. **Expression Strategy.** Choose template source first. Read `references/expression-templates.md` as the template directory, then load the specific file under `references/templates/` only when needed.
4. **Presentation Form.** Decide whether the output should be a Lark document, a PPT-ready page outline, or both. Read `references/presentation-forms.md`.
5. **Artifact Generation.** Produce an outline, draft, humanized final text, diagram/image recommendations, PPT page scripts with speaker notes, optional image style choices, and final Feishu/Lark document when requested.

Default mode: deep questioning first, then creation. If the user says "直接生成" or "别问了", proceed with explicit assumptions.

## Questioning And Opening Rules

- Ask 3-6 useful questions per major stage only when the answer materially changes the output.
- Prefer concrete questions over generic ones.
- Do not ask questions that can be answered by reading the provided document or source material.
- If the user gives a lot of material, summarize your current understanding before asking.
- If the user is unsure, provide 2-4 options and recommend one.
- If the user says "直接生成" or "别问了", proceed with explicit assumptions.
- Always check whether the user has a preferred document template, example article, or case format before applying a built-in template.

Object clarification questions:
- What is the core idea in one sentence?
- What exactly is being defined: a concept, method, product, workflow, policy, judgment, or proposal?
- What problem does it solve, and for whom?
- How does it work? What are the main components or stages?
- What is inside the boundary, and what should not be included?
- What are the common misunderstandings?
- What examples, evidence, or source material make it concrete?
- What should the reader believe, remember, or do after reading?

Audience modeling questions:
- Who is the primary audience?
- Do you already have a preferred document template, example article, or case format that should be followed first?
- What do they already know, and what do they not know but need to know?
- What do they care about most: efficiency, risk, cost, learning, compliance, decision-making, or execution?
- What language or examples are familiar to them?
- What will they resist, misunderstand, or skip?
- Do they need to be taught, persuaded, aligned, reassured, or instructed?

## Markdown Humanization Mode

Use this mode when the input is already a `.md` draft, rule document, case write-up, tutorial, lesson note, or AI-generated article that needs to feel more human.

1. Read `references/humanizer-rules.md`.
2. Identify the document type: rule, case, tutorial, internal proposal, research note, product explanation, or meeting summary.
3. Preserve Markdown mechanics: headings, tables, code fences, links, frontmatter, anchors, task lists, and ordered steps unless changing them clearly improves readability.
4. Rewrite in passes: intent -> structure -> paragraph voice -> sentence rhythm -> Markdown scanability.
5. If the user provided "人类规则" or style rules, treat them as the primary rubric and map each rewrite choice back to those rules.
6. Deliver either a direct replacement Markdown draft or a concise changelog plus the rewritten file, depending on the user's ask.

## Progressive Loading

Load only the references needed for the current task:
- For choosing document templates, audience/object guides, or communication type: first read `references/expression-templates.md`, then load the selected `references/templates/*.md` file.
- For Lark document rules, PPT-ready outline rules, speaker notes, and page-level visual planning: `references/presentation-forms.md`
- For removing AI-sounding language, humanizing Markdown, or applying human writing rules to a case file: `references/humanizer-rules.md`
- For diagram selection, image style, and image prompt constraints: `references/diagram-image-rules.md`

## Defaults

- Output: Lark document plus PPT-ready outline.
- Questioning depth: deep questioning.
- Writing tone: professional, direct, human, and audience-aware.
- Safety: preserve source documents unless the user explicitly asks to edit them.
- Images: analyze and ask first; generate only after confirmation.
