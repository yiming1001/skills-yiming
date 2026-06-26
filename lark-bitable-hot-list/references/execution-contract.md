# Backend Execute Contract

This skill sends user preferences plus a Skill-owned `runtime_schema` and a separate Skill-owned `table_schema` to the backend execute API.

The backend should eventually prefer these Skill-provided schemas over backend hardcoded platform registries.

## Endpoint

- `POST /api/v1/auto-collect/execute`

Default API base used by the script:

- `https://i-sync.cn/api/v1`

Optional override:

- CLI flag: `--api-base`
- Environment variable: `HOT_LIST_SKILL_API_BASE`

## Request

The skill sends:

```json
{
  "platform": "douyin",
  "function_type": "hot_list",
  "form_data": {
    "func": "high_play",
    "page": 1
  },
  "runtime_schema": {
    "schema_version": "hot-list-runtime.v1",
    "platform": "douyin",
    "function_type": "hot_list",
    "collection_config": {},
    "table_schema_ref": {
      "schema_id": "douyin_hot_list",
      "schema_file": "../tables/douyin_hot_list.json"
    },
    "execution_defaults": {}
  },
  "table_schema": {
    "schema_version": "table-schema.v1",
    "table_schema_id": "douyin_hot_list",
    "table_name": "抖音热榜",
    "fields": []
  },
  "tool_api_key": "backend_api_token",
  "export_target": {
    "base_token": "appxxxx",
    "api_key": "personal_auth_code",
    "table_name": "抖音热榜"
  },
  "source": "skill_manual",
  "collect_mode": "times",
  "collect_times": 1,
  "deduplication_enabled": true,
  "deduplication_field": "item_id",
  "deduplication_strategy": "keepOld"
}
```

The request also sends:

- `Authorization: Bearer <backend_api_token>`
- `Content-Type: application/json`

## Response

Expected success response:

```json
{
  "success": true,
  "message": "执行成功",
  "result": {
    "total": 50,
    "inserted": 50,
    "skipped": 0,
    "replaced": 0,
    "table_name": "抖音热榜",
    "table_url": "optional"
  }
}
```

## Responsibilities

The skill is responsible for:

- local preference storage
- platform execution preference storage
- binding resolution
- platform runtime schema ownership
- table schema ownership
- request assembly
- readable result display

The backend is responsible for:

- validating `runtime_schema`
- validating `table_schema`
- hot-list collection using `collection_config`
- data extraction and transforms
- table creation if needed using `table_schema`
- Base writing
- deduplication using `execution_defaults` and payload overrides
- final execution result
