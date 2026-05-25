# Practice Document Examples

These are pattern examples, not full documents.

## API Plugin Deployment

Use when the learner connects an existing API as a Coze plugin tool.

Recommended rows:

| 具体步骤 | 步骤描述 | 参考截图 | 备注 |
|---|---|---|---|
| **步骤1：创建插件容器** | 进入资源库，选择 **+资源 > 插件**。 | 见截图：创建插件入口 | 插件是能力容器。 |
| **步骤2：填写插件基础信息** | 填插件名称、描述、创建方式、插件 URL。 | 见截图：插件信息配置 | URL 只填域名，不填路径和 Query。 |
| **步骤3：配置鉴权方式** | 选择无授权、Service token、API key 或 OAuth。 | 见截图：授权配置 | 按本实战实际接口选择，不要泛讲所有选项。 |
| **步骤4：创建工具** | 创建 `query_xxx` 工具并写清用途。 | 见截图：创建工具 | 工具描述影响模型是否调用。 |
| **步骤5：配置路径与参数** | 配置 method、path、Query/Path/Body/Header 参数。 | 见截图：工具编辑 | 参数位置必须和 API 一致。 |
| **步骤6：试运行并发布** | 输入测试参数，确认返回后发布。 | 见截图：试运行/发布 | 发布后智能体才可调用。 |

Required validation:

- request URL
- test input
- expected JSON
- agent prompt and expected answer

## Coze Cloud Function IDE

Use when the learner writes code inside Coze IDE.

Recommended rows:

| 具体步骤 | 步骤描述 | 参考截图 | 备注 |
|---|---|---|---|
| **步骤1：创建 IDE 插件** | 选择“云侧插件-在扣子 IDE 中创建”，选择 runtime。 | 见截图：新建插件 | Runtime must match code sample. |
| **步骤2：创建工具** | 添加工具，命名 like `query_weather_by_coordinates`。 | 见截图：工具列表 | Tool names should be action-oriented. |
| **步骤3：编写函数代码** | Keep `handler`; replace internal logic only. | 见截图：代码区 | Return a JSON object. |
| **步骤4：配置元数据** | Define input and output params. | 见截图：元数据 | Output types must match code return. |
| **步骤5：测试代码并更新输出** | Run test input, inspect Console, update outputs. | 见截图：测试代码 | If agent output is empty, check metadata. |
| **步骤6：发布并关联智能体** | Publish plugin and enable the tool. | 见截图：发布 | Tool must be enabled. |

Include code examples only when learners need to paste or adapt code.

## Cross-Platform API Call

Use when one platform calls another platform's workflow/API.

Recommended rows:

| 具体步骤 | 步骤描述 | 参考截图 | 备注 |
|---|---|---|---|
| **步骤1：准备目标平台参数** | Collect workflow ID, input variables, and token. | 见截图：参数获取 | Do not expose real tokens in public docs. |
| **步骤2：创建调用载体** | Create app/workflow/tool in the calling platform. | 见截图：创建入口 | This is the execution container. |
| **步骤3：组装请求体** | Use script/node to adapt source parameters to target API shape. | 见截图：脚本节点 | This is the format adapter. |
| **步骤4：配置 API 节点** | Set method, URL, headers, body, and output schema. | 见截图：API 节点 | This is the platform bridge. |
| **步骤5：配置结束节点** | Select final output fields shown to the learner/user. | 见截图：结束节点 | Complete the result loop. |
| **步骤6：运行验证** | Run with real input and check node status/output. | 见截图：运行结果 | Failures usually come from token, ID, URL, or parameter mismatch. |

## Style Patterns

Prefer:

- `本实战使用 ... 因为 ...`
- `这里填写 ...`
- `如果失败，优先检查 ...`
- `预期返回 ...`

Avoid:

- long platform feature explanations
- listing every optional configuration that this practice does not use
- screenshots without step labels
- token-only image references
