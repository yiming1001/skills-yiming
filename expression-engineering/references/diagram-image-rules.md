# Diagram And Image Rules

Use this reference for diagram selection, image style, and image prompt constraints.

## When To Recommend A Diagram

Recommend a diagram when text contains:
- A multi-step workflow or closed loop.
- A before/after or wrong-way/right-way comparison.
- Role boundaries between people, AI, systems, teams, or vendors.
- A rollout plan, roadmap, maturity path, or phased implementation.
- A decision framework with tradeoffs.
- A dense table whose message would be easier to scan visually.

When analyzing a document, list 3-5 candidates with location, diagram type, why it helps, and priority.

## Image Style

Before image generation, ask for style unless the user already chose one.

Default style: `白底简约科技风`.

Style presets:
- **白底简约科技风:** White background, thin lines, light blue/cyan accents, clean business feel. Best for Feishu docs and PPT reuse.
- **蓝色科技风:** Blue-dominant, data-flow and system feeling. Best for AI and technical solution articles.
- **极简黑白风:** Minimal color, strong structure, consulting-report feel.
- **轻工业风:** Clean manufacturing cues such as blueprints, equipment, work orders, inspection photos, and document flows.
- **PPT 封面级视觉:** Stronger title presence and visual impact. Use sparingly for core visuals.

Every image prompt must include: Feishu article/PPT reuse, 16:9, Chinese text only, crisp sparse typography, consistent palette, no logo, no watermark, no fake English, no unreadable tiny text, and generous whitespace.
