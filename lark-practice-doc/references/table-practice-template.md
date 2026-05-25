# Table Practice Template

Use this reference when drafting the body of a Feishu/Lark classroom practice document.

## Required Structure

```markdown
# 实战练习X：主题名称

<callout emoji="sparkles">

### 一、核心逻辑概述

本练习的核心是完成“输入/配置 → 平台能力 → 测试验证 → 可复用产物”的闭环。
</callout>

## 二、实战目标与最终产物

| 项目 | 内容 |
|---|---|
| 实战名称 | ... |
| 最终产物 | ... |
| 关键能力 | ... |
| 验证效果 | ... |

## 三、操作步骤总表

| 具体步骤 | 步骤描述 | 参考截图 | 备注 |
|---|---|---|---|
| **步骤1：...** | 1. ...<br/>2. ... | 见截图：... | ... |

## 四、关键参数速查

| 参数 | 值 | 用途 |
|---|---|---|
| `param` | `value` | ... |

## 五、测试输入与预期输出

## 六、课堂排查清单

## 七、参考截图区
```

## Four Table Columns

### `具体步骤`

- Start with bold step labels, for example `**步骤3：配置输入参数**`.
- Use one row per action group, not one row per click.
- The label should include both the action and the purpose when useful, for example `配置输出参数——让智能体拿到可用字段`.

### `步骤描述`

- Use numbered actions with concrete UI labels and exact values.
- Include what to fill in, where to fill it, and what should happen next.
- Prefer `<br/>` line breaks inside table cells for Feishu/Lark Markdown stability.

### `参考截图`

- Use a short pointer in the table: `见截图：创建插件入口`.
- Do not paste raw image tokens as text.
- If image blocks are unstable inside table cells, place real image blocks under `参考截图区`.

### `备注`

- Explain why this step matters, common mistakes, or classroom hints.
- Keep notes short and practical.
- Do not put long conceptual explanations here; move them to `课堂排查清单` if needed.

## Required Supporting Sections

### 实战目标与最终产物

Include concrete artifact names and operational values:

- plugin / workflow / app name
- tool / node name
- API domain or service
- request method
- authorization mode
- validation effect

### 关键参数速查

Use this table for every fixed value learners need:

```markdown
| 参数 | 值 | 用途 |
|---|---|---|
| 插件 URL | `https://example.com` | API 服务域名 |
| 工具路径 | `/v1/example` | 接口路径 |
```

### 测试输入与预期输出

Always include:

- exact input JSON or text
- expected output JSON or text
- learner-facing validation prompt

### 课堂排查清单

Use a two-column table:

```markdown
| 问题 | 优先检查 |
|---|---|
| 试运行报错 | URL、路径、请求方法、鉴权 |
| 输出为空 | 输出字段路径和数据类型 |
```

## Screenshot Handling

When transforming source docs:

1. Fetch source with v2 content so `<img ... src="TOKEN"/>` blocks are visible.
2. Collect only the screenshots that directly support steps.
3. Insert the real image blocks in `参考截图区`:

```xml
<h3>步骤1：创建插件</h3>
<img src="SOURCE_IMAGE_TOKEN"/>
```

4. After creating or overwriting a document, refetch it and verify `<img` blocks exist.
