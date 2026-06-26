# Runtime Schema Contract

`schemas/hot_list/*.json` is the Skill-owned executable contract for hot-list collection.

`schemas/tables/*.json` is the Skill-owned executable contract for Feishu Base table structure.

The backend should treat `runtime_schema` as the source of truth for platform-specific collection shape and `table_schema` as the source of truth for table fields. Backend code should stay generic: validate, collect, transform, ensure table fields, write records, and deduplicate.

## Top-Level Shape

```json
{
  "schema_version": "hot-list-runtime.v1",
  "platform": "douyin",
  "platform_name": "抖音",
  "function_type": "hot_list",
  "function_name": "热榜",
  "input_schema": {},
  "collection_config": {},
  "table_schema_ref": {
    "schema_id": "douyin_hot_list",
    "schema_file": "../tables/douyin_hot_list.json"
  },
  "execution_defaults": {}
}
```

## `input_schema`

Describes the user-facing request parameters copied from the plugin's `inputFields`.

This is mainly for Agent/UI guidance. The backend may use it for validation, default merging, and enum checks.

## `collection_config`

Describes how the backend calls the internal tool API.

Important fields:

- `endpoint_path`: Path relative to `/api/v1`, such as `/tools/bilibili/fetch_com_popular`.
- `request_method`: `GET` or `POST`.
- `request_payload_mode`: `query` or `json`.
- `params`: Allowed request parameter keys.
- `string_params`: Parameters that should be stringified before calling the tool API.
- `param_transforms`: Named, backend-implemented transforms. The Skill stores transform names, not JavaScript functions.
- `data_path`: Dot path for extracting records from the tool response.
- `pagination`: Page or cursor config, or `null`.
- `estimate_per_page` and `allow_collect_all`: Collection behavior hints from the plugin.

## `table_schema_ref`

The hot-list runtime schema does not embed table fields.

It only points to one table config file:

```json
{
  "schema_id": "douyin_hot_list",
  "schema_file": "../tables/douyin_hot_list.json"
}
```

This keeps "one table, one config file" as the extension boundary.

## Table Schema File

Each file under `schemas/tables/*.json` describes one target Base table structure.

```json
{
  "schema_version": "table-schema.v1",
  "table_schema_id": "douyin_hot_list",
  "platform": "douyin",
  "function_type": "hot_list",
  "table_name": "抖音热榜",
  "target": "personal_bitable",
  "default_mode": "existing_table",
  "ensure_table": true,
  "ensure_fields": true,
  "field_name_source": "label",
  "fields": []
}
```

Important fields:

- `table_schema_id`: Stable table schema identifier.
- `table_name`: Skill-owned output table name. The user-facing runtime must not override it.
- `target`: Currently `personal_bitable`.
- `default_mode`: Usually `existing_table`; backend may still create table when `ensure_table` is true.
- `ensure_table`: Backend should create the table if missing.
- `ensure_fields`: Backend should create missing fields if possible.
- `field_name_source`: Currently `label`, meaning Feishu field names use the field `label`.
- `fields`: Export field definitions.

Each field keeps both plugin-style type and Feishu field type:

```json
{
  "key": "item_id",
  "label": "作品ID",
  "type": "text",
  "field_type": 1,
  "source": "item_id",
  "transform": "optional_transform_name"
}
```

Field type mapping:

- `text` -> `1`
- `number` -> `2`
- `datetime` -> `5`
- `checkbox` -> `7`
- `url` -> `15`

## `execution_defaults`

Describes collection and deduplication defaults.

Important fields:

- `form_data`: Default request parameters.
- `collect_mode`: Usually `times`.
- `collect_times`: Usually `1`.
- `deduplication_enabled`: Usually `true`.
- `deduplication_field`: Field `key` used for deduplication.
- `deduplication_source`: Raw record path used to read the deduplication value.
- `deduplication_strategy`: `keepOld` or `keepNew`.

## Execute Payload

The Skill sends the normal user binding plus two separated executable schemas:

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
    "table_schema_ref": {
      "schema_id": "douyin_hot_list",
      "schema_file": "../tables/douyin_hot_list.json"
    }
  },
  "table_schema": {
    "schema_version": "table-schema.v1",
    "table_schema_id": "douyin_hot_list",
    "fields": []
  },
  "tool_api_key": "backend_api_token",
  "export_target": {
    "base_token": "appxxxx",
    "api_key": "personal_auth_code",
    "table_name": "抖音热榜"
  },
  "source": "skill_manual"
}
```

## Backend Migration Guideline

1. Prefer `payload.runtime_schema` when present.
2. Fall back to backend registry only for old clients.
3. Validate `endpoint_path` against an allowlist such as `/tools/*`.
4. Merge defaults as `runtime_schema.execution_defaults.form_data + saved platform preferences + payload.form_data`.
5. Use `runtime_schema.collection_config` for collection.
6. Use `payload.table_schema.fields` for mapping, field creation, and value formatting.
7. Use `runtime_schema.execution_defaults` plus payload overrides for deduplication.
