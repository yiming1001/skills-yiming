# Presentation Forms

Use this reference when choosing between a Lark document, a PPT-ready outline, or both. A PPT outline is not a text outline; it is a page-by-page speaking and visual plan.

## Lark Document

Use a Lark document when the output needs complete reasoning, details, tables, checklists, examples, or follow-up reading.

Rules:
- Create a new document by default; do not overwrite the source.
- Use clear section headings, callouts only for real conclusions or risks, and tables/checklists where they reduce reading load.
- Each section should answer one reader question.
- Preserve a local Markdown draft for substantial articles.
- Verify by fetching the outline and key sections after creation.
- Keep document detail richer than PPT detail. The document can carry definitions, caveats, full examples, parameter tables, and references that would overload slides.
- When the document and PPT outline are both requested, use the document as the reasoning base and the PPT outline as the live communication script.

Document norms:
- Start with the reader's problem or decision, not a ceremonial background section.
- Use headings that tell the reader what question the section answers.
- Put dense implementation details into tables only when comparison or checking is easier in rows.
- Use checklists for acceptance criteria, review points, or operational handoff.
- Use diagrams in the document when they clarify process, responsibility, system flow, timeline, comparison, or decision logic.
- Avoid repeated summary boxes. One strong conclusion beats many decorative callouts.

## PPT-Ready Outline

Use a PPT-ready outline when the content may be presented in a meeting. The output should let someone build slides and rehearse the talk without asking what each page is supposed to show.

Rules:
- Do not simply split the document into slides.
- Each page should have one main conclusion.
- Default to 6-10 pages unless the user specifies otherwise.
- For each page, include: page title, a speaker script code block directly under that page title, page role, main message, 3-5 supporting points, visual plan, image/diagram asset suggestion, and transition to the next page.
- Speaker script is required for every page. Each `P1/P2/P3...` page unit must have its own fenced code block labeled `口播稿` immediately below that page's title. Do not provide one global script for the whole outline, and do not only add scripts to selected pages.
- If a PPT outline is grouped by chapters or sections, still write口播稿 at the page level. A chapter may have a short intro, but it does not replace each page's script.
- This format is optimized for Feishu documents: easy to scan, copy, and hand to a presenter page by page.
- The speaker script should sound like something a presenter can actually say in 30-90 seconds, not a paragraph copied from the document.
- Visual planning is required. Every page should say what the audience sees: diagram, chart, screenshot, comparison table, process map, quote, photo-style image, or simple text layout.
- Image participation is part of the outline. If a visual would improve the page, specify whether it should be a generated image, diagram, screenshot, icon system, or existing source asset.
- Remove detail that belongs in the document; keep only what helps live communication.

Page schema:

````markdown
### P{n}. {Page title}

```口播稿
Write the 30-90 second speaker script here. It should be natural, concrete, and refer to the page visual when useful.
```

- **Page role:** Why this page exists in the talk.
- **Main message:** One sentence the audience should remember.
- **On-slide content:** 3-5 concise bullets or labels.
- **Visual plan:** Layout and visual type, such as flow diagram, before/after, quadrant, timeline, architecture map, data chart, screenshot annotation, or image-led cover.
- **Image/diagram asset:** What image is needed, what it should contain, source/generation recommendation, and style constraints.
- **Transition:** One sentence that leads to the next page.
````

Speaker script rules:
- Place the script directly under the page title, before bullets or visual notes.
- Use a fenced code block with the info string `口播稿`; do not put the script in a bullet field.
- Write one script per page. If a page has multiple fragments, explain how those fragments should be spoken within that page's single script.
- Write for speaking, not reading. Use shorter sentences, clear verbs, and concrete references to what appears on the slide.
- Mention the visual when it matters: "左边是现状，右边是我们建议的流程".
- Do not recite every bullet. Explain the relationship between the bullets.
- Include the tension, tradeoff, or decision point. A talk without tension becomes a document read aloud.
- Keep claims proportional. If evidence is weak, say "目前看" or "这部分还需要验证".
- Avoid stagey openings like "大家好，今天我将". Start from the page's point.

Visual and image rules:
- Read `diagram-image-rules.md` when a page needs diagrams, generated images, visual style, or prompt constraints.
- Prefer diagrams for mechanisms, workflows, responsibilities, timelines, comparisons, and decisions.
- Prefer screenshots or source images when the audience needs to inspect a real product, interface, document, workflow, or physical object.
- Prefer generated images for covers, abstract concept visuals, scenario illustrations, and consistent article/PPT visuals when no real asset exists.
- Do not leave a page with only text if the idea contains a process, contrast, hierarchy, data pattern, or scene.
- For generated page visuals, specify: purpose, subject, layout, style, aspect ratio, required Chinese labels, what not to include, and whether it must be reusable in Feishu docs.
- For charts, describe the data needed and the intended chart message. Do not invent precise numbers unless the source provides them.

Default shape:
1. Why this topic matters.
2. Core judgment.
3. Current problem or misconception.
4. How the object works.
5. Recommended strategy or workflow.
6. Risks and boundaries.
7. What to do next.

## Lark Document Plus PPT Outline

When both are requested, produce them as two connected artifacts:

- **Document:** complete reasoning, definitions, examples, tables, detailed steps, caveats, and references.
- **PPT outline:** meeting narrative, page-by-page main messages, visuals, image/diagram assets,口播稿, and transitions.

Do not make the PPT outline a compressed copy of the document. Convert:
- Paragraph explanation -> slide message plus speaker script.
- Long process section -> flow diagram page.
- Comparison table -> decision/comparison visual.
- Case details -> scene image, before/after, or annotated screenshot.
- Risk section -> risk matrix or boundary page.

Before final delivery, check:
- Every slide has one main message.
- Every slide has a visual plan or a deliberate reason for being text-led.
- Every slide has a `口播稿` code block immediately under the page title.
- No page is allowed to share or inherit another page's口播稿.
- Suggested images or diagrams are concrete enough for a designer or image model to produce.
- The document carries the details that the PPT intentionally leaves out.
