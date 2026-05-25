# Humanizer Rules

Use these rules when polishing text so it sounds human, not generic-AI. For Markdown files, humanization means preserving the document's usable structure while making the thinking, examples, and rhythm feel written by a real practitioner.

## Core Principle

Human writing usually has three qualities:
- It has a position: the writer knows what they believe, where they are uncertain, and what they want the reader to do.
- It has friction: constraints, tradeoffs, examples, exceptions, and small operational details appear naturally.
- It has uneven rhythm: not every paragraph has the same shape, not every section ends with a summary, and not every claim is inflated.

Do not "beautify" by adding generic polish. Make the text more specific, more situated, and easier to trust.

## Editing Pass Order

1. **Classify the draft.** Identify whether it is an oral draft, AI tutorial, rule document, case write-up, internal report, sales copy, technical note, or Lark/Markdown article.
2. **Find the real intent.** Mark the main claim, the reader action, the useful caveats, and the parts that should not be softened.
3. **Preserve the usable structure.** Keep Markdown headings, tables, code fences, links, frontmatter, anchors, task lists, and ordered steps unless they are clearly hurting comprehension.
4. **Remove AI-shaped scaffolding.** Cut fixed openings, repeated formulas, forced summaries, generic transitions, and overly balanced sentence patterns.
5. **Add grounded specificity.** Bring in concrete scenes, source details, operational constraints, named objects, and examples already implied by the material.
6. **Rebalance rhythm.** Vary sentence length, paragraph length, section openings, and the density of bullets.
7. **Check human rules.** If the user provides a "人类规则" document, use it as the rubric and revise until the draft visibly follows those rules.

## Markdown-Specific Rules

Markdown humanization should improve how the document reads on a screen.

- Keep headings functional. A heading should name the reader question or action, not merely announce a theme.
  - Weak: `## 背景介绍`
  - Better: `## 为什么这套规则不能只靠润色解决`
- Do not turn every paragraph into bullets. Use bullets for lists, comparisons, steps, and checklists; use paragraphs for judgment.
- Keep list items uneven when the ideas are uneven. Mechanical "三点式" lists often feel generated.
- Use bold sparingly. Bold the decision, risk, term, or instruction that a skimming reader must catch.
- Preserve code fences and examples exactly unless the task includes code editing.
- If a table is already useful, keep it. If a table only repeats vague adjectives, convert it to prose or add concrete criteria.
- Do not add decorative callouts, excessive blockquotes, or repeated "核心结论" boxes unless the document format needs them.
- Keep internal links and anchors stable. If a heading changes and links may depend on it, mention the change.
- For rule docs, prefer concise rule -> reason -> example. For case docs, prefer situation -> conflict -> choice -> result -> lesson.

## Document-Type Playbooks

### Rule Document

Goal: make a rule feel usable, not ceremonial.

Structure:
1. What the rule is.
2. When to use it.
3. What to avoid.
4. Examples of weak vs better.
5. Edge cases or exceptions.

Rewrite moves:
- Replace abstract principles with observable criteria.
- Add "when not to use" if the rule could be over-applied.
- Use examples that show the boundary, not only the ideal case.
- Avoid moralizing language like "必须深刻认识到"; use direct operating language.

### Case Write-Up

Goal: let readers see the decision process.

Structure:
1. Situation: what was happening.
2. Constraint: what made it hard.
3. Choice: what was tried and why.
4. Result: what changed.
5. Lesson: what transfers to the next case.

Rewrite moves:
- Keep the messy middle. A case without constraints reads like marketing.
- Name the inputs: documents, user roles, workflow steps, data shape, review pressure, time limit.
- Do not overstate the result. Say what improved and what still needs work.

### Tutorial Or Practice Guide

Goal: help a beginner succeed without guessing.

Structure:
1. What the learner will build or finish.
2. Prerequisites.
3. Steps with visible checkpoints.
4. Common mistakes.
5. Acceptance criteria.

Rewrite moves:
- Replace "理解并掌握" with observable outcomes.
- Add validation examples: what the screen/output should look like.
- Keep commands, parameters, and field names literal.

### Internal Proposal

Goal: help a decision-maker judge whether to act.

Structure:
1. Current problem.
2. Why it matters now.
3. Options.
4. Recommendation.
5. Risks and next steps.

Rewrite moves:
- Put the recommendation earlier than a normal essay would.
- Remove empty urgency; show actual cost, delay, risk, or missed opportunity.
- Separate facts from judgment.

### Technical Note

Goal: make implementation knowledge precise and reviewable.

Structure:
1. Problem or context.
2. Design choice.
3. Behavior and constraints.
4. Alternatives considered.
5. Verification.

Rewrite moves:
- Keep terminology stable.
- Avoid metaphor when an interface, parameter, state, or data flow can be named.
- Keep caveats visible, especially compatibility, security, latency, and failure modes.

## Common AI Smells To Remove

- Filler openings: "本文将深入探讨", "在当今快速发展的时代", "需要注意的是", "值得一提的是", "综上所述".
- Inflated importance: "具有重要意义", "发挥至关重要的作用", "标志着关键转折点", "体现了深远影响".
- Empty connective phrases: "此外", "与此同时", "更进一步地说", "从某种程度上讲" when they only glue paragraphs together.
- Generic recommendation language: "最佳实践", "全面赋能", "显著提升", "构建闭环", "打造生态" unless made specific.
- Vague authority: "行业专家认为", "相关研究表明", "业内普遍认为" without a concrete source or example.
- Promotional adjectives: "强大", "领先", "卓越", "丰富", "深刻", "创新性", "革命性" unless backed by evidence.
- Mechanical emphasis: too many bold phrases, callouts, "核心结论", "阶段结论", "一句话总结", or repeated label blocks.
- Forced symmetry: every section has the same number of bullets, every bullet starts the same way, or every paragraph ends with a takeaway.
- Hollow contrast: repeated "不是 A，而是 B" structures when the contrast does not reveal a real distinction.
- Over-explained transitions: "基于以上分析，我们可以得出" when the next sentence can simply state the conclusion.

## Sentence-Level Rules

- Prefer direct verbs over abstract nouns.
  - Weak: "实现对资料清洗能力的提升"
  - Better: "让资料清洗更快、更容易复核"
- Prefer simple "是/有/能" over inflated structures.
  - Weak: "PaddleOCR 作为一套具备成熟生态的解决方案"
  - Better: "PaddleOCR 的生态更成熟"
- Replace generic adjectives with observable details.
  - Weak: "复杂工业场景"
  - Better: "图纸模糊、照片反光、手写记录难辨认"
- Split stacked clauses. If one sentence carries three ideas, make the relationship explicit or split it.
- Keep a few short sentences. They give the article a human pulse.
- Use first-person judgment only when it fits the context: "我会优先..." can work in a case note, but not in a policy document.
- Preserve uncertainty. "可能", "目前看", "还需要验证" often make a draft more credible than a forced absolute.
- Avoid decorative punctuation and repeated slogan-like endings.

## Before And After Patterns

### Generic Claim To Situated Claim

Weak:
> 该方法能够显著提升内容表达质量，并帮助用户构建更加完整的表达体系。

Better:
> 这套方法真正解决的是两个问题：先把要表达的对象问清楚，再根据读者的理解门槛选择写法。否则文章会很顺，但读者看完仍然不知道该怎么用。

### Rule With No Boundary To Rule With Boundary

Weak:
> 输出内容时要保持专业、清晰、结构化。

Better:
> 默认保持专业和清晰，但不要为了结构化把所有内容都拆成三段式。规则文档适合用短句和例子；案例复盘则要保留背景、限制和当时的取舍。

### Empty Transition To Direct Move

Weak:
> 基于以上内容，我们可以看到，人类化表达具有非常重要的意义。

Better:
> 这里的关键不是"更像人"，而是让读者看见判断从哪里来。

## Human Rule Rubric

When the user mentions "人类规则", "人类化规则", "humanizer rules", or a case-specific rule Markdown, run this rubric:

- **Stance:** Does the text make a real judgment, or only describe a neutral framework?
- **Specificity:** Are examples concrete enough to picture or verify?
- **Constraint:** Does the text include limits, tradeoffs, exceptions, or failure cases?
- **Reader fit:** Does the language match the audience's knowledge and job-to-be-done?
- **Rhythm:** Do paragraphs and bullets vary naturally?
- **Markdown usability:** Can a reader scan headings, examples, tables, and checklists without fighting the format?
- **Source fidelity:** Did the rewrite preserve facts, terms, names, and caveats from the source?

If a rewrite scores weak on two or more dimensions, revise again before delivering.

## Delivery Format

For short text, return only the rewritten version unless the user asks for explanation.

For Markdown files or substantial case documents, return:
1. The rewritten Markdown or updated file path.
2. A brief change summary focused on voice, structure, and specificity.
3. Any assumptions or source gaps that affected the rewrite.

Do not include a long audit trail unless the user asks for a comparison.
