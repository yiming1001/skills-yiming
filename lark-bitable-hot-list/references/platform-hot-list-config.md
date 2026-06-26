# 平台热榜配置参考

这份参考文件只保留当前 Skill 支持的 3 个热榜平台配置：B 站、抖音、小红书。

## 通用配置结构

每个平台都遵守这套结构：

```js
{
  inputFields: [],
  api: {
    url: '...',
    method: 'GET' | 'POST',
    params: [],
    stringParams: [],
    transformParams: fn,
    dataPath: '...',
    pagination: { ... },
    estimatePerPage: 20,
    allowCollectAll: false
  },
  defaultDeduplicationField: '...',
  exportFields: [
    { key, label, type, source, transform }
  ]
}
```

## 抖音 `douyin.hot_list`

来源文件: `src/config/fields/douyin/hot_list.js`

### 输入参数

- `func`: 热榜类型
- `tags`: 垂类标签，多选
- `page`: 页码
- `page_size`: 每页数量
- `data_window`: 数据窗口小时数

### 请求配置

- `url`: `https://i-sync.cn/api/v1/tools/douyin/fetch_hot_total_high_play_list`
- `method`: `POST`
- `dataPath`: `data.data.objs`

### 特殊规则

- `stringParams`: `page`, `page_size`, `data_window`, `func`
- `transformParams`:
  - 若 `tags` 有值，转成 `[{ value: Number(id) }]`
  - 若 `tags` 为空，删除该字段
- 分页:
  - `type`: `page`
  - `paramName`: `page`
  - `startPage`: `1`
- `allowCollectAll`: `true`

### 默认去重字段

- `item_id`

### 主要输出字段

- `item_id`
- `item_title`
- `item_cover_url`
- `item_duration`
- `nick_name`
- `avatar_url`
- `fans_cnt`
- `play_cnt`
- `publish_time`
- `score`
- `item_url`
- `like_cnt`
- `follow_cnt`
- `follow_rate`
- `like_rate`

## 小红书 `xiaohongshu.hot_list`

来源文件: `src/config/fields/xiaohongshu/hot_list.js`

### 输入参数

- 无

### 请求配置

- `url`: `https://i-sync.cn/api/v1/tools/xiaohongshu/fetch_hot_list`
- `method`: `GET`
- `dataPath`: `data.data.items`

### 特殊规则

- 无分页
- `allowCollectAll`: `false`

### 默认去重字段

- `id`

### 主要输出字段

- `id`
- `title`
- `score`
- `rank_change`
- `type`
- `word_type`
- `icon`
- `title_img`

## B 站 `bilibili.hot_list`

来源文件: `src/config/fields/bilibili/hot_list.js`

### 输入参数

- `pn`

### 请求配置

- `url`: `https://i-sync.cn/api/v1/tools/bilibili/fetch_com_popular`
- `method`: `POST`
- `dataPath`: `data.list`

### 特殊规则

- 分页:
  - `type`: `page`
  - `paramName`: `pn`
  - `startPage`: `1`
- `allowCollectAll`: `false`

### 默认去重字段

- `bvid`

### 主要输出字段

- `aid`
- `bvid`
- `title`
- `tname`
- `pubdate`
- `duration`
- `pub_location`
- `view`
- `danmaku`
- `reply`
- `favorite`
- `coin`
- `share`
- `like`
- `short_link_v2`
- `pic`
- `owner_mid`
- `owner_name`
- `owner_face`

## Skill 化时的最小抽象建议

如果要把这些配置真正抽成 Skill，可统一成下面的运行时输入：

```json
{
  "platform_id": "douyin",
  "request_params": {},
  "api_token": "xxx",
  "target_binding": {
    "base_token": "appxxxx",
    "mode": "new_table"
  },
  "table_schema_ref": {
    "schema_id": "douyin_hot_list",
    "schema_file": "../tables/douyin_hot_list.json"
  },
  "deduplication": {
    "enabled": true,
    "field": "item_id",
    "strategy": "keepOld"
  }
}
```

这样做时，Skill 只需要做三件事：

1. 按平台读取热榜配置
2. 执行通用采集逻辑
3. 把结果写入飞书多维表
