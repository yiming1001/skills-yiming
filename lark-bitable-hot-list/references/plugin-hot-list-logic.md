# 插件热榜逻辑摘要

这个 Skill 来自仓库 `collect_big_Data` 里的热榜能力抽象。

## 当前插件里的真实调用链

```text
collectConfig
  -> 平台 hot_list 配置
  -> CollectForm 页面取配置
  -> collector.collect() 统一请求
  -> dataTransform 统一映射
  -> dataMigration 写入飞书多维表
```

## 对应代码位置

- 平台与功能注册: `src/config/collectConfig.js`
- 热榜配置: `src/config/fields/*/hot_list.js`
- 手动采集入口: `src/views/CollectForm/index.vue`
- 采集执行器: `src/utils/collector.js`
- 数据转换: `src/utils/dataTransform.js`
- 多维表写入: `src/utils/dataMigration.js`

## 当前插件已经抽象好的部分

- 热榜平台是配置驱动的
- API 请求执行器是通用的
- 字段映射是通用的
- 写表逻辑是通用的

这意味着 Skill 不需要复刻 UI，只要承接这几层抽象即可。

## Skill 最适合承接的边界

Skill 只保留：

1. 平台热榜配置
2. 通用采集执行器
3. 通用字段映射器
4. 飞书 Base 写入适配器

Skill 不保留：

- Vue 页面
- router
- drawer / confirm UI
- localStorage 绑定管理
- 自动化中心页面状态

## 迁移建议

先抽热榜，不要一开始就抽整个插件。

最小可行版本只做：

1. 选择平台热榜配置
2. 发起 API 请求
3. 提取数据列表
4. 映射成统一字段
5. 写入飞书多维表

等这条主链跑稳，再补：

- 去重策略
- 自动建表
- 定时任务
- 批量任务
