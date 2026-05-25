# 实操型模板 / Hands-On Practice Template

Use this template when creating classroom practice documents, hands-on tutorials, workflow operation guides, plugin/API setup guides, or self-paced task sheets. If the user provides their own hands-on template, use the user's template first and only borrow missing parts from this file.

## When To Use

Use for:
- 实战练习, 课堂练习, 实战营任务, 操作手册
- Coze/Kouzi plugin, workflow, agent, API, cloud function, or cross-platform call practice
- Any document where the reader must perform steps and verify a result

Do not use as the primary template when the goal is strategy, decision, conceptual explanation, or project review.

## Default Document Structure

Unless the user asks for a chapter-style version, use this structure:

1. **核心逻辑概述**: one short callout summarizing the runnable product and execution loop.
2. **实战目标与最终产物**: compact two-column table.
3. **操作步骤总表**: main four-column task table.
4. **关键参数速查**: parameter/value/purpose table.
5. **测试输入与预期输出**: concrete input, expected output, and validation prompt.
6. **课堂排查清单**: common failures and first checks.
7. **参考截图区**: real screenshot blocks grouped by step when screenshots exist.

## Required Markdown Skeleton

```markdown
# 实战练习X：主题名称

> 核心逻辑：本练习的核心是完成“输入/配置 -> 平台能力 -> 测试验证 -> 可复用产物”的闭环。

## 一、实战目标与最终产物

| 项目 | 内容 |
|---|---|
| 实战名称 | ... |
| 最终产物 | ... |
| 关键能力 | ... |
| 验证效果 | ... |

## 二、操作步骤总表

| 具体步骤 | 步骤描述 | 参考截图 | 备注 |
|---|---|---|---|
| **步骤1：...** | 1. ...<br/>2. ... | 见截图：... | ... |

## 三、关键参数速查

| 参数 | 值 | 用途 |
|---|---|---|
| `param` | `value` | ... |

## 四、测试输入与预期输出

## 五、课堂排查清单

| 问题 | 优先检查 |
|---|---|
| 试运行报错 | URL、路径、请求方法、鉴权 |

## 六、参考截图区
```

## Four-Column Task Table

The main table columns must be exactly:

| 具体步骤 | 步骤描述 | 参考截图 | 备注 |
|---|---|---|---|

Column rules:
- **具体步骤:** Start with bold step labels, such as `**步骤3：配置输入参数**`. Use one row per learner action group, not one row per click.
- **步骤描述:** Use numbered actions with concrete UI labels, exact values, and expected next state. Prefer `<br/>` line breaks inside table cells for Feishu/Lark Markdown stability.
- **参考截图:** Use a short pointer such as `见截图：创建插件入口`. Do not paste raw image tokens as text.
- **备注:** Explain why the step matters, common mistakes, or classroom hints. Keep it short.

## Required Supporting Sections

### 实战目标与最终产物

Include concrete artifact names and operational values:
- plugin / workflow / app / agent name
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
- exact input JSON or learner prompt
- expected output JSON, text, screen state, or document result
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
2. Collect only screenshots that directly support steps.
3. Use pointers in the task table and place real image blocks in `参考截图区`.
4. If rewriting a Lark document, refetch after creation/update and verify image blocks still exist.

Screenshot section pattern:

```xml
<h3>步骤1：创建插件</h3>
<img src="SOURCE_IMAGE_TOKEN"/>
```

## Common Practice Rows

### API Plugin Deployment

| 具体步骤 | 步骤描述 | 参考截图 | 备注 |
|---|---|---|---|
| **步骤1：创建插件容器** | 进入资源库，选择 **+资源 > 插件**。 | 见截图：创建插件入口 | 插件是能力容器。 |
| **步骤2：填写插件基础信息** | 填插件名称、描述、创建方式、插件 URL。 | 见截图：插件信息配置 | URL 只填域名，不填路径和 Query。 |
| **步骤3：配置鉴权方式** | 选择无授权、Service token、API key 或 OAuth。 | 见截图：授权配置 | 按本实战实际接口选择，不要泛讲所有选项。 |
| **步骤4：创建工具** | 创建 `query_xxx` 工具并写清用途。 | 见截图：创建工具 | 工具描述影响模型是否调用。 |
| **步骤5：配置路径与参数** | 配置 method、path、Query/Path/Body/Header 参数。 | 见截图：工具编辑 | 参数位置必须和 API 一致。 |
| **步骤6：试运行并发布** | 输入测试参数，确认返回后发布。 | 见截图：试运行/发布 | 发布后智能体才可调用。 |

### Coze Cloud Function IDE

| 具体步骤 | 步骤描述 | 参考截图 | 备注 |
|---|---|---|---|
| **步骤1：创建 IDE 插件** | 选择“云侧插件-在扣子 IDE 中创建”，选择 runtime。 | 见截图：新建插件 | Runtime must match code sample. |
| **步骤2：创建工具** | 添加工具，命名 like `query_weather_by_coordinates`。 | 见截图：工具列表 | Tool names should be action-oriented. |
| **步骤3：编写函数代码** | Keep `handler`; replace internal logic only. | 见截图：代码区 | Return a JSON object. |
| **步骤4：配置元数据** | Define input and output params. | 见截图：元数据 | Output types must match code return. |
| **步骤5：测试代码并更新输出** | Run test input, inspect Console, update outputs. | 见截图：测试代码 | If agent output is empty, check metadata. |
| **步骤6：发布并关联智能体** | Publish plugin and enable the tool. | 见截图：发布 | Tool must be enabled. |

### Cross-Platform API Call

| 具体步骤 | 步骤描述 | 参考截图 | 备注 |
|---|---|---|---|
| **步骤1：准备目标平台参数** | Collect workflow ID, input variables, and token. | 见截图：参数获取 | Do not expose real tokens in public docs. |
| **步骤2：创建调用载体** | Create app/workflow/tool in the calling platform. | 见截图：创建入口 | This is the execution container. |
| **步骤3：组装请求体** | Use script/node to adapt source parameters to target API shape. | 见截图：脚本节点 | This is the format adapter. |
| **步骤4：配置 API 节点** | Set method, URL, headers, body, and output schema. | 见截图：API 节点 | This is the platform bridge. |
| **步骤5：配置结束节点** | Select final output fields shown to the learner/user. | 见截图：结束节点 | Complete the result loop. |
| **步骤6：运行验证** | Run with real input and check node status/output. | 见截图：运行结果 | Failures usually come from token, ID, URL, or parameter mismatch. |

## Writing Rules

- Audience: learners following a live class or self-paced task.
- Tone: direct, executable, and concrete.
- Prefer "本实战里这样填写..." over generic platform explanation.
- Use code formatting for URLs, parameter names, tool names, field names, paths, and fixed values.
- Avoid long abstract explanations. Convert them into row-level notes or troubleshooting items.
- Do not expose secrets. Replace tokens, API keys, or private credentials with placeholders unless the source intentionally uses public demo values and the user approves.
- Prefer stable public APIs for examples. If an API requires credentials, clearly separate authorization configuration from request parameters.
- Prefer screenshots, diagrams, or generated images where they reduce learner ambiguity.
