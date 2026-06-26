#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')

const SUPPORTED_PLATFORMS = {
  bilibili: 'B站',
  douyin: '抖音',
  xiaohongshu: '小红书'
}

const DEFAULT_API_BASE = 'https://i-sync.cn/api/v1'
const BASE_TOKEN_PATTERNS = [
  /\/base\/([A-Za-z0-9]+)/i,
  /\/wiki\/([A-Za-z0-9]+)/i
]

class SkillStateError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SkillStateError'
  }
}

function utcNowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function buildSkillPaths() {
  const skillRoot = path.resolve(__dirname, '..')
  const stateDir = process.env.HOT_LIST_SKILL_STATE_DIR
    ? path.resolve(process.env.HOT_LIST_SKILL_STATE_DIR)
    : path.join(skillRoot, 'state')

  return {
    skillRoot,
    stateDir,
    preferencesPath: path.join(stateDir, 'preferences.json'),
    platformPreferencesPath: path.join(stateDir, 'platform-preferences.json'),
    douyinTagsTreePath: path.join(skillRoot, 'assets', 'douyin_content_tags_tree.json'),
    hotListSchemaDir: path.join(skillRoot, 'schemas', 'hot_list'),
    tableSchemaDir: path.join(skillRoot, 'schemas', 'tables')
  }
}

function ensureStateDir(paths) {
  fs.mkdirSync(paths.stateDir, { recursive: true })
}

function defaultPreferences() {
  return {
    backend_api_token: '',
    active_binding_id: '',
    bindings: []
  }
}

function defaultPlatformPreferences() {
  return {
    schema_version: 'platform-preferences.v1',
    platforms: {}
  }
}

function extractBaseToken(rawValue) {
  const value = String(rawValue || '').trim()
  if (!value) return ''

  for (const pattern of BASE_TOKEN_PATTERNS) {
    const matched = value.match(pattern)
    if (matched && matched[1]) return matched[1]
  }

  return value
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .trim()
}

function maskSecret(value, keepStart = 3, keepEnd = 4) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (text.length <= keepStart + keepEnd) return `${text.slice(0, 2)}****`
  return `${text.slice(0, keepStart)}****${text.slice(-keepEnd)}`
}

function normalizePreferences(data, sourcePath) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new SkillStateError(
      `偏好设置文件格式不正确: ${sourcePath}。请备份后删除该文件，再重新设置 token 和 binding。`
    )
  }

  const backendApiToken = data.backend_api_token ?? ''
  const activeBindingId = data.active_binding_id ?? ''
  const bindings = data.bindings ?? []

  if (typeof backendApiToken !== 'string') {
    throw new SkillStateError(
      `偏好设置文件中的 backend_api_token 不是字符串: ${sourcePath}。请修复或删除后重建。`
    )
  }
  if (typeof activeBindingId !== 'string') {
    throw new SkillStateError(
      `偏好设置文件中的 active_binding_id 不是字符串: ${sourcePath}。请修复或删除后重建。`
    )
  }
  if (!Array.isArray(bindings)) {
    throw new SkillStateError(
      `偏好设置文件中的 bindings 不是数组: ${sourcePath}。请修复或删除后重建。`
    )
  }

  const normalizedBindings = bindings.map((binding, index) => {
    if (!binding || typeof binding !== 'object' || Array.isArray(binding)) {
      throw new SkillStateError(
        `偏好设置文件中的第 ${index + 1} 个 binding 不是对象: ${sourcePath}。请修复或删除后重建。`
      )
    }

    const requiredFields = [
      'id',
      'name',
      'base_token',
      'api_key',
      'created_at',
      'updated_at'
    ]
    const missingFields = requiredFields.filter(field => typeof binding[field] !== 'string')
    if (missingFields.length > 0) {
      throw new SkillStateError(
        `偏好设置文件中的 binding 缺少或损坏字段 ${missingFields.join(', ')}: ${sourcePath}。请修复或删除后重建。`
      )
    }

    return {
      id: binding.id.trim(),
      name: binding.name.trim(),
      base_token: extractBaseToken(binding.base_token),
      api_key: binding.api_key.trim(),
      is_default: false,
      created_at: binding.created_at.trim(),
      updated_at: binding.updated_at.trim()
    }
  })

  if (activeBindingId && !normalizedBindings.some(binding => binding.id === activeBindingId)) {
    throw new SkillStateError(
      `偏好设置文件中的 active_binding_id 找不到对应 binding: ${sourcePath}。请修复或删除后重建。`
    )
  }

  for (const binding of normalizedBindings) {
    binding.is_default = binding.id === activeBindingId
  }

  return {
    backend_api_token: backendApiToken.trim(),
    active_binding_id: activeBindingId.trim(),
    bindings: normalizedBindings
  }
}

function loadPreferences(paths) {
  if (!fs.existsSync(paths.preferencesPath)) return defaultPreferences()

  let rawText
  try {
    rawText = fs.readFileSync(paths.preferencesPath, 'utf8')
  } catch (error) {
    throw new SkillStateError(`无法读取偏好设置文件: ${paths.preferencesPath}。${error.message}`)
  }

  let raw
  try {
    raw = JSON.parse(rawText)
  } catch (error) {
    throw new SkillStateError(
      `偏好设置文件已损坏: ${paths.preferencesPath}。请备份后删除该文件，再重新设置。原始错误: ${error.message}`
    )
  }

  return normalizePreferences(raw, paths.preferencesPath)
}

function normalizePlatformPreference(platformId, value, sourcePath) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SkillStateError(`平台 ${platformId} 的偏好不是对象: ${sourcePath}`)
  }

  const normalized = {
    request_params: {},
    collect_mode: '',
    collect_times: null,
    deduplication_enabled: null,
    deduplication_field: '',
    deduplication_strategy: '',
    updated_at: typeof value.updated_at === 'string' ? value.updated_at.trim() : ''
  }

  if (value.request_params !== undefined) {
    if (!value.request_params || typeof value.request_params !== 'object' || Array.isArray(value.request_params)) {
      throw new SkillStateError(`平台 ${platformId} 的 request_params 必须是 JSON object: ${sourcePath}`)
    }
    normalized.request_params = { ...value.request_params }
  }

  if (value.collect_mode !== undefined && value.collect_mode !== null) {
    const collectMode = String(value.collect_mode).trim()
    if (collectMode && !['times', 'all'].includes(collectMode)) {
      throw new SkillStateError(`平台 ${platformId} 的 collect_mode 只能是 times 或 all: ${sourcePath}`)
    }
    normalized.collect_mode = collectMode
  }

  if (value.collect_times !== undefined && value.collect_times !== null && value.collect_times !== '') {
    const collectTimes = Number.parseInt(String(value.collect_times), 10)
    if (!Number.isFinite(collectTimes) || collectTimes < 1) {
      throw new SkillStateError(`平台 ${platformId} 的 collect_times 必须是大于等于 1 的整数: ${sourcePath}`)
    }
    normalized.collect_times = collectTimes
  }

  if (value.deduplication_enabled !== undefined && value.deduplication_enabled !== null) {
    if (typeof value.deduplication_enabled !== 'boolean') {
      throw new SkillStateError(`平台 ${platformId} 的 deduplication_enabled 必须是 boolean: ${sourcePath}`)
    }
    normalized.deduplication_enabled = value.deduplication_enabled
  }

  if (value.deduplication_field !== undefined && value.deduplication_field !== null) {
    normalized.deduplication_field = String(value.deduplication_field).trim()
  }

  if (value.deduplication_strategy !== undefined && value.deduplication_strategy !== null) {
    const strategy = String(value.deduplication_strategy).trim()
    if (strategy && !['keepOld', 'keepNew'].includes(strategy)) {
      throw new SkillStateError(`平台 ${platformId} 的 deduplication_strategy 只能是 keepOld 或 keepNew: ${sourcePath}`)
    }
    normalized.deduplication_strategy = strategy
  }

  return normalized
}

function normalizePlatformPreferences(data, sourcePath) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new SkillStateError(`平台偏好文件格式不正确: ${sourcePath}。请备份后删除该文件，再重新设置。`)
  }

  const platforms = data.platforms ?? {}
  if (!platforms || typeof platforms !== 'object' || Array.isArray(platforms)) {
    throw new SkillStateError(`平台偏好文件中的 platforms 不是对象: ${sourcePath}`)
  }

  const normalized = defaultPlatformPreferences()
  for (const [platformId, value] of Object.entries(platforms)) {
    if (!Object.prototype.hasOwnProperty.call(SUPPORTED_PLATFORMS, platformId)) {
      continue
    }
    normalized.platforms[platformId] = normalizePlatformPreference(platformId, value, sourcePath)
  }

  return normalized
}

function loadPlatformPreferences(paths) {
  if (!fs.existsSync(paths.platformPreferencesPath)) return defaultPlatformPreferences()

  let rawText
  try {
    rawText = fs.readFileSync(paths.platformPreferencesPath, 'utf8')
  } catch (error) {
    throw new SkillStateError(`无法读取平台偏好文件: ${paths.platformPreferencesPath}。${error.message}`)
  }

  let raw
  try {
    raw = JSON.parse(rawText)
  } catch (error) {
    throw new SkillStateError(
      `平台偏好文件已损坏: ${paths.platformPreferencesPath}。请备份后删除该文件，再重新设置。原始错误: ${error.message}`
    )
  }

  return normalizePlatformPreferences(raw, paths.platformPreferencesPath)
}

function savePlatformPreferences(paths, prefs) {
  ensureStateDir(paths)
  const normalized = normalizePlatformPreferences(prefs, paths.platformPreferencesPath)
  try {
    fs.writeFileSync(paths.platformPreferencesPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
  } catch (error) {
    throw new SkillStateError(`无法写入平台偏好文件: ${paths.platformPreferencesPath}。${error.message}`)
  }
}

function readJsonFile(filePath, label) {
  let rawText
  try {
    rawText = fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    throw new SkillStateError(`无法读取${label}: ${filePath}。${error.message}`)
  }

  try {
    return JSON.parse(rawText)
  } catch (error) {
    throw new SkillStateError(`${label}不是合法 JSON: ${filePath}。${error.message}`)
  }
}

function loadRuntimeSchema(paths, platformId) {
  const schemaPath = path.join(paths.hotListSchemaDir, `${platformId}.json`)
  if (!fs.existsSync(schemaPath)) {
    throw new SkillStateError(`找不到平台 runtime_schema: ${schemaPath}`)
  }

  const schema = readJsonFile(schemaPath, '平台 runtime_schema')
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new SkillStateError(`平台 runtime_schema 格式不正确: ${schemaPath}`)
  }
  if (schema.platform !== platformId) {
    throw new SkillStateError(`平台 runtime_schema 的 platform=${schema.platform} 与请求平台 ${platformId} 不一致。`)
  }
  if (schema.function_type !== 'hot_list') {
    throw new SkillStateError(`平台 runtime_schema 的 function_type 必须是 hot_list: ${schemaPath}`)
  }
  if (!schema.collection_config || !schema.table_schema_ref) {
    throw new SkillStateError(`平台 runtime_schema 缺少 collection_config 或 table_schema_ref: ${schemaPath}`)
  }

  return {
    schema,
    schemaPath
  }
}

function loadTableSchema(paths, runtimeSchemaResult) {
  const runtimeSchema = runtimeSchemaResult.schema
  const tableRef = runtimeSchema.table_schema_ref || {}
  const schemaFile = String(tableRef.schema_file || '').trim()
  const schemaId = String(tableRef.schema_id || '').trim()

  if (!schemaFile && !schemaId) {
    throw new SkillStateError(`平台 runtime_schema 缺少可解析的 table_schema_ref: ${runtimeSchemaResult.schemaPath}`)
  }

  const resolvedPath = schemaFile
    ? path.resolve(path.dirname(runtimeSchemaResult.schemaPath), schemaFile)
    : path.join(paths.tableSchemaDir, `${schemaId}.json`)

  if (!fs.existsSync(resolvedPath)) {
    throw new SkillStateError(`找不到表格 table_schema: ${resolvedPath}`)
  }

  const tableSchema = readJsonFile(resolvedPath, '表格 table_schema')
  if (!tableSchema || typeof tableSchema !== 'object' || Array.isArray(tableSchema)) {
    throw new SkillStateError(`表格 table_schema 格式不正确: ${resolvedPath}`)
  }
  if (schemaId && tableSchema.table_schema_id !== schemaId) {
    throw new SkillStateError(`表格 table_schema_id=${tableSchema.table_schema_id} 与引用 ${schemaId} 不一致。`)
  }
  if (!Array.isArray(tableSchema.fields)) {
    throw new SkillStateError(`表格 table_schema 缺少 fields 数组: ${resolvedPath}`)
  }

  return {
    schema: tableSchema,
    schemaPath: resolvedPath
  }
}

function savePreferences(paths, prefs) {
  ensureStateDir(paths)
  const normalized = normalizePreferences(prefs, paths.preferencesPath)
  try {
    fs.writeFileSync(paths.preferencesPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
  } catch (error) {
    throw new SkillStateError(`无法写入偏好设置文件: ${paths.preferencesPath}。${error.message}`)
  }
}

function emit(data) {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`)
  return 0
}

function emitWithCode(data, code) {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`)
  return code
}

function emitError(message) {
  process.stderr.write(`${JSON.stringify({ success: false, error: message }, null, 2)}\n`)
  return 1
}

function maskedPreferences(prefs) {
  return {
    configured: Boolean(prefs.backend_api_token || prefs.bindings.length),
    backend_api_token: maskSecret(prefs.backend_api_token, 4, 4),
    active_binding_id: prefs.active_binding_id,
    bindings: prefs.bindings.map(binding => {
      const { default_table_name: _legacyTableName, ...visibleBinding } = binding
      return {
        ...visibleBinding,
        base_token: maskSecret(binding.base_token, 5, 4),
        api_key: maskSecret(binding.api_key, 3, 4)
      }
    })
  }
}

function buildPreflightSummary(paths, options = {}) {
  const platformId = String(options['platform-id'] || '').trim()
  const missing = []
  const warnings = []
  const nextSteps = []
  let prefs = null
  let platformPrefs = null

  if (platformId && !Object.prototype.hasOwnProperty.call(SUPPORTED_PLATFORMS, platformId)) {
    missing.push({
      code: 'unsupported_platform',
      message: `不支持的平台: ${platformId}。可用平台: ${Object.keys(SUPPORTED_PLATFORMS).join(', ')}`
    })
  }

  try {
    prefs = loadPreferences(paths)
  } catch (error) {
    missing.push({
      code: 'preferences_unreadable',
      message: error.message
    })
  }

  try {
    platformPrefs = loadPlatformPreferences(paths)
  } catch (error) {
    missing.push({
      code: 'platform_preferences_unreadable',
      message: error.message
    })
  }

  if (prefs) {
    if (!prefs.backend_api_token) {
      missing.push({
        code: 'missing_backend_token',
        message: '缺少后端 API token。'
      })
      nextSteps.push({
        command: 'set-backend-token',
        example: 'bash scripts/run.sh set-backend-token --token "YOUR_BACKEND_TOKEN"'
      })
    }

    if (!prefs.bindings.length) {
      missing.push({
        code: 'missing_binding',
        message: '缺少至少一个 Lark Base 表格绑定。'
      })
      nextSteps.push({
        command: 'add-or-update-binding',
        example: 'bash scripts/run.sh add-or-update-binding --name "主业务表" --base-token "appxxxx" --api-key "personal_auth_code" --make-default'
      })
    } else {
      if (!prefs.active_binding_id) {
        missing.push({
          code: 'missing_default_binding',
          message: '缺少默认表格绑定。'
        })
        nextSteps.push({
          command: 'set-default-binding',
          example: 'bash scripts/run.sh set-default-binding --binding-name "主业务表"'
        })
      }

      const activeBinding = prefs.bindings.find(binding => binding.id === prefs.active_binding_id)
      if (prefs.active_binding_id && !activeBinding) {
        missing.push({
          code: 'invalid_default_binding',
          message: '默认表格绑定已失效。'
        })
      }
      if (activeBinding) {
        if (!activeBinding.base_token) {
          missing.push({ code: 'missing_base_token', message: '默认绑定缺少 base_token。' })
        }
        if (!activeBinding.api_key) {
          missing.push({ code: 'missing_base_api_key', message: '默认绑定缺少个人授权码 api_key。' })
        }
      }
    }
  }

  if (platformId && Object.prototype.hasOwnProperty.call(SUPPORTED_PLATFORMS, platformId)) {
    try {
      const runtimeSchemaResult = loadRuntimeSchema(paths, platformId)
      loadTableSchema(paths, runtimeSchemaResult)
      if (platformPrefs && !platformPrefs.platforms[platformId]) {
        warnings.push({
          code: 'using_schema_defaults',
          message: `${SUPPORTED_PLATFORMS[platformId]} 尚未保存平台偏好，将使用 schema 默认参数。`
        })
      }
    } catch (error) {
      missing.push({
        code: 'schema_unreadable',
        message: error.message
      })
    }
  }

  const ready = missing.length === 0
  return {
    success: ready,
    ready,
    setup_required: !ready,
    preferences_path: paths.preferencesPath,
    platform_preferences_path: paths.platformPreferencesPath,
    platform_id: platformId || null,
    supported_platforms: Object.keys(SUPPORTED_PLATFORMS),
    missing,
    warnings,
    next_steps: nextSteps,
    preferred_setup_prompt: ready
      ? ''
      : '首次使用前需要先完成必要配置。请先提供后端 API token、Lark Base 链接或 base_token、个人授权码；配置完成后我再继续执行热榜采集。表名由 Skill 自动决定。'
  }
}

function resolveBinding(prefs, bindingId = '', bindingName = '') {
  if (!prefs.bindings.length) {
    throw new SkillStateError('当前还没有任何表格绑定，请先执行 add-or-update-binding。')
  }
  if (bindingId && bindingName) {
    throw new SkillStateError('binding_id 和 binding_name 不能同时传。')
  }

  if (bindingId) {
    const found = prefs.bindings.find(binding => binding.id === bindingId)
    if (!found) throw new SkillStateError(`找不到 binding_id=${bindingId} 对应的表格绑定。`)
    return found
  }

  if (bindingName) {
    const found = prefs.bindings.find(binding => binding.name === bindingName)
    if (!found) throw new SkillStateError(`找不到名称为“${bindingName}”的表格绑定。`)
    return found
  }

  if (!prefs.active_binding_id) {
    throw new SkillStateError('当前没有默认表格绑定，请先执行 set-default-binding 或新增默认 binding。')
  }

  const active = prefs.bindings.find(binding => binding.id === prefs.active_binding_id)
  if (!active) {
    throw new SkillStateError('当前默认表格绑定已失效，请重新设置默认 binding。')
  }
  return active
}

function parseRequestParams(rawValue) {
  let parsed
  try {
    parsed = JSON.parse(rawValue)
  } catch (error) {
    throw new SkillStateError(`request_params 不是合法 JSON: ${error.message}`)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new SkillStateError('request_params 必须是 JSON object。')
  }
  return parsed
}

function parseOptionalRequestParams(rawValue, fallback = {}) {
  const value = String(rawValue ?? '').trim()
  if (!value) return { ...fallback }
  return parseRequestParams(value)
}

function parseBooleanOption(rawValue, label) {
  if (typeof rawValue === 'boolean') return rawValue
  const value = String(rawValue ?? '').trim().toLowerCase()
  if (['true', '1', 'yes', 'y', 'on'].includes(value)) return true
  if (['false', '0', 'no', 'n', 'off'].includes(value)) return false
  throw new SkillStateError(`${label} 必须是 true 或 false。`)
}

function parsePositiveIntOption(rawValue, label) {
  const value = Number.parseInt(String(rawValue ?? '').trim(), 10)
  if (!Number.isFinite(value) || value < 1) {
    throw new SkillStateError(`${label} 必须是大于等于 1 的整数。`)
  }
  return value
}

function parseExecutionPreferenceOptions(options) {
  const parsed = {}

  if (options['request-params'] !== undefined) {
    parsed.request_params = parseRequestParams(String(options['request-params']))
  }

  if (options['collect-mode'] !== undefined) {
    const collectMode = String(options['collect-mode'] || '').trim()
    if (!['times', 'all'].includes(collectMode)) {
      throw new SkillStateError('collect_mode 只能是 times 或 all。')
    }
    parsed.collect_mode = collectMode
  }

  if (options['collect-times'] !== undefined) {
    parsed.collect_times = parsePositiveIntOption(options['collect-times'], 'collect_times')
  }

  if (options['deduplication-enabled'] !== undefined) {
    parsed.deduplication_enabled = parseBooleanOption(options['deduplication-enabled'], 'deduplication_enabled')
  }

  if (options['deduplication-field'] !== undefined) {
    parsed.deduplication_field = String(options['deduplication-field'] || '').trim()
  }

  if (options['deduplication-strategy'] !== undefined) {
    const strategy = String(options['deduplication-strategy'] || '').trim()
    if (!['keepOld', 'keepNew'].includes(strategy)) {
      throw new SkillStateError('deduplication_strategy 只能是 keepOld 或 keepNew。')
    }
    parsed.deduplication_strategy = strategy
  }

  return parsed
}

function getSchemaExecutionDefaults(runtimeSchema) {
  const defaults = runtimeSchema.execution_defaults || {}
  return {
    request_params: { ...(defaults.form_data || {}) },
    collect_mode: defaults.collect_mode || 'times',
    collect_times: defaults.collect_times || 1,
    deduplication_enabled: defaults.deduplication_enabled !== undefined ? Boolean(defaults.deduplication_enabled) : true,
    deduplication_field: defaults.deduplication_field || '',
    deduplication_strategy: defaults.deduplication_strategy || 'keepOld'
  }
}

function buildEffectiveExecutionOptions(runtimeSchema, savedPreference = {}, runtimeOverrides = {}) {
  const defaults = getSchemaExecutionDefaults(runtimeSchema)
  const saved = savedPreference || {}
  const overrides = runtimeOverrides || {}

  return {
    request_params: {
      ...defaults.request_params,
      ...(saved.request_params || {}),
      ...(overrides.request_params || {})
    },
    collect_mode: overrides.collect_mode || saved.collect_mode || defaults.collect_mode,
    collect_times: overrides.collect_times || saved.collect_times || defaults.collect_times,
    deduplication_enabled:
      overrides.deduplication_enabled !== undefined
        ? overrides.deduplication_enabled
        : saved.deduplication_enabled !== null && saved.deduplication_enabled !== undefined
          ? saved.deduplication_enabled
          : defaults.deduplication_enabled,
    deduplication_field: overrides.deduplication_field || saved.deduplication_field || defaults.deduplication_field,
    deduplication_strategy: overrides.deduplication_strategy || saved.deduplication_strategy || defaults.deduplication_strategy
  }
}

function printHelp() {
  const helpText = `
Usage:
  hot_list_skill.js show-current-preferences
  hot_list_skill.js set-backend-token --token <token>
  hot_list_skill.js add-or-update-binding --name <name> --base-token <token-or-url> --api-key <auth> [--binding-id <id>] [--make-default]
  hot_list_skill.js set-default-binding (--binding-id <id> | --binding-name <name>)
  hot_list_skill.js preflight-check [--platform-id <platform>]
  hot_list_skill.js show-platform-options [--platform-id <platform>] [--primary-tag <douyin-primary-tag-value>]
  hot_list_skill.js show-platform-preferences [--platform-id <platform>]
  hot_list_skill.js set-platform-preferences --platform-id <platform> [--request-params '<json>'] [--collect-mode times|all] [--collect-times <n>] [--deduplication-enabled true|false] [--deduplication-field <field>] [--deduplication-strategy keepOld|keepNew]
  hot_list_skill.js show-runtime-schema --platform-id <platform>
  hot_list_skill.js execute --platform-id <platform> [--request-params '<json>'] [--collect-mode times|all] [--collect-times <n>] [--deduplication-enabled true|false] [--deduplication-field <field>] [--deduplication-strategy keepOld|keepNew] [--binding-id <id> | --binding-name <name>] [--api-base <url>] [--timeout-sec <n>]

Supported platforms:
  ${Object.keys(SUPPORTED_PLATFORMS).join(', ')}
`.trim()

  process.stdout.write(`${helpText}\n`)
  return 0
}

function parseOptions(argv) {
  const options = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) {
      throw new SkillStateError(`无法识别的参数: ${token}`)
    }
    const key = token.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      options[key] = true
      continue
    }
    options[key] = next
    index += 1
  }
  return options
}

function requireStringOption(options, key, label = key) {
  const value = String(options[key] || '').trim()
  if (!value) throw new SkillStateError(`${label} 不能为空。`)
  return value
}

async function sendExecuteRequest(apiBase, backendToken, payload, timeoutSec) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutSec * 1000)

  try {
    const response = await fetch(`${apiBase.replace(/\/$/, '')}/auto-collect/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${backendToken}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    let parsed = {}
    try {
      parsed = await response.json()
    } catch (_) {
      parsed = {}
    }

    if (!response.ok) {
      throw new SkillStateError(
        parsed.detail || parsed.message || `后端执行失败: HTTP ${response.status}`
      )
    }

    if (parsed && typeof parsed === 'object' && parsed.success === false) {
      throw new SkillStateError(parsed.detail || parsed.message || '后端执行返回失败。')
    }

    return parsed
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new SkillStateError(`请求超时，超过 ${timeoutSec} 秒未返回。`)
    }
    if (error instanceof SkillStateError) throw error
    throw new SkillStateError(`无法连接后端执行接口: ${error.message}`)
  } finally {
    clearTimeout(timer)
  }
}

function commandShowCurrentPreferences(paths) {
  const prefs = loadPreferences(paths)
  return emit({
    success: true,
    preferences_path: paths.preferencesPath,
    preferences: maskedPreferences(prefs)
  })
}

function commandSetBackendToken(paths, options) {
  const token = requireStringOption(options, 'token', 'backend_api_token')
  const prefs = loadPreferences(paths)
  prefs.backend_api_token = token
  savePreferences(paths, prefs)
  return emit({
    success: true,
    message: 'backend_api_token 已保存。',
    preferences_path: paths.preferencesPath
  })
}

function commandAddOrUpdateBinding(paths, options) {
  const name = requireStringOption(options, 'name', 'binding name')
  const baseToken = extractBaseToken(requireStringOption(options, 'base-token', 'base_token'))
  const apiKey = requireStringOption(options, 'api-key', 'api_key')
  const bindingId = String(options['binding-id'] || '').trim()

  if (options['default-table-name'] !== undefined) {
    throw new SkillStateError('输出表名由 schemas/tables/*.json 决定，不能在绑定配置里传 --default-table-name。')
  }

  const prefs = loadPreferences(paths)
  const bindings = prefs.bindings
  const now = utcNowIso()

  let target = null
  if (bindingId) {
    target = bindings.find(binding => binding.id === bindingId) || null
    if (!target) throw new SkillStateError(`找不到 binding_id=${bindingId} 对应的表格绑定。`)
  } else {
    target = bindings.find(binding => binding.name === name) || null
  }

  if (!target) {
    target = {
      id: `binding_${crypto.randomBytes(6).toString('hex')}`,
      name,
      base_token: baseToken,
      api_key: apiKey,
      is_default: false,
      created_at: now,
      updated_at: now
    }
    bindings.push(target)
  } else {
    target.name = name
    target.base_token = baseToken
    target.api_key = apiKey
    target.updated_at = now
  }

  if (options['make-default'] || !prefs.active_binding_id) {
    prefs.active_binding_id = target.id
  }

  for (const binding of bindings) {
    binding.is_default = binding.id === prefs.active_binding_id
  }

  prefs.bindings = bindings
  savePreferences(paths, prefs)
  return emit({
    success: true,
    message: '表格绑定已保存。',
    binding: {
      ...target,
      base_token: maskSecret(target.base_token, 5, 4),
      api_key: maskSecret(target.api_key, 3, 4)
    },
    is_active_default: prefs.active_binding_id === target.id
  })
}

function commandSetDefaultBinding(paths, options) {
  const bindingId = String(options['binding-id'] || '').trim()
  const bindingName = String(options['binding-name'] || '').trim()

  if (!bindingId && !bindingName) {
    throw new SkillStateError('请提供 binding-id 或 binding-name。')
  }

  const prefs = loadPreferences(paths)
  const target = resolveBinding(prefs, bindingId, bindingName)
  prefs.active_binding_id = target.id
  for (const binding of prefs.bindings) {
    binding.is_default = binding.id === target.id
  }
  savePreferences(paths, prefs)
  return emit({
    success: true,
    message: '默认表格绑定已更新。',
    active_binding_id: target.id,
    active_binding_name: target.name
  })
}

function commandPreflightCheck(paths, options) {
  const summary = buildPreflightSummary(paths, options)
  return emitWithCode(summary, summary.ready ? 0 : 2)
}

function commandShowRuntimeSchema(paths, options) {
  const platformId = requireStringOption(options, 'platform-id', 'platform_id')
  if (!Object.prototype.hasOwnProperty.call(SUPPORTED_PLATFORMS, platformId)) {
    throw new SkillStateError(
      `不支持的平台: ${platformId}。可用平台: ${Object.keys(SUPPORTED_PLATFORMS).join(', ')}`
    )
  }

  const runtimeSchemaResult = loadRuntimeSchema(paths, platformId)
  const tableSchemaResult = loadTableSchema(paths, runtimeSchemaResult)
  return emit({
    success: true,
    runtime_schema_path: runtimeSchemaResult.schemaPath,
    table_schema_path: tableSchemaResult.schemaPath,
    runtime_schema: runtimeSchemaResult.schema,
    table_schema: tableSchemaResult.schema
  })
}

function loadDouyinTagTree(paths) {
  if (!fs.existsSync(paths.douyinTagsTreePath)) {
    throw new SkillStateError(`找不到抖音垂类标签树: ${paths.douyinTagsTreePath}`)
  }

  const tagTree = readJsonFile(paths.douyinTagsTreePath, '抖音垂类标签树')
  if (!tagTree || typeof tagTree !== 'object' || !Array.isArray(tagTree.groups)) {
    throw new SkillStateError(`抖音垂类标签树格式不正确: ${paths.douyinTagsTreePath}`)
  }
  return tagTree
}

function optionList(items) {
  return (items || []).map(item => ({
    value: String(item.value),
    label: String(item.label)
  }))
}

function fieldOptions(schema, key) {
  const fields = schema.input_schema && Array.isArray(schema.input_schema.fields)
    ? schema.input_schema.fields
    : []
  const field = fields.find(item => item.key === key)
  return optionList(field ? field.options : [])
}

function platformSelectionOptions(paths, platformId, options = {}) {
  const runtimeSchemaResult = loadRuntimeSchema(paths, platformId)
  const runtimeSchema = runtimeSchemaResult.schema
  const fields = runtimeSchema.input_schema && Array.isArray(runtimeSchema.input_schema.fields)
    ? runtimeSchema.input_schema.fields
    : []

  const result = {
    platform_id: platformId,
    platform_name: SUPPORTED_PLATFORMS[platformId],
    runtime_schema_path: runtimeSchemaResult.schemaPath,
    input_fields: fields,
    execution_defaults: getSchemaExecutionDefaults(runtimeSchema)
  }

  if (platformId === 'douyin') {
    const tagTree = loadDouyinTagTree(paths)
    const primaryTag = String(options['primary-tag'] || '').trim()
    const selectedGroup = primaryTag
      ? tagTree.groups.find(group => String(group.value) === primaryTag)
      : null

    if (primaryTag && !selectedGroup) {
      throw new SkillStateError(`找不到抖音一级垂类标签: ${primaryTag}`)
    }

    result.selection_model = {
      hot_list_type: {
        key: 'func',
        mode: 'single',
        options: fieldOptions(runtimeSchema, 'func')
      },
      primary_tag: {
        key: 'primary_tag',
        mode: 'single',
        options: optionList(tagTree.groups)
      },
      secondary_tag: {
        key: 'secondary_tag',
        mode: 'single',
        depends_on: 'primary_tag',
        primary_tag: primaryTag || null,
        options: selectedGroup ? optionList(selectedGroup.children) : []
      },
      page_size: {
        key: 'page_size',
        mode: 'single',
        options: [
          { value: '20', label: '20' },
          { value: '40', label: '40' }
        ]
      }
    }
  }

  return result
}

function commandShowPlatformOptions(paths, options) {
  const platformId = String(options['platform-id'] || '').trim()
  const platformIds = platformId ? [platformId] : Object.keys(SUPPORTED_PLATFORMS)

  for (const currentPlatformId of platformIds) {
    if (!Object.prototype.hasOwnProperty.call(SUPPORTED_PLATFORMS, currentPlatformId)) {
      throw new SkillStateError(
        `不支持的平台: ${currentPlatformId}。可用平台: ${Object.keys(SUPPORTED_PLATFORMS).join(', ')}`
      )
    }
  }

  const platforms = {}
  for (const currentPlatformId of platformIds) {
    platforms[currentPlatformId] = platformSelectionOptions(paths, currentPlatformId, options)
  }

  return emit({
    success: true,
    supported_platforms: Object.keys(SUPPORTED_PLATFORMS),
    platforms
  })
}

function commandShowPlatformPreferences(paths, options) {
  const platformId = String(options['platform-id'] || '').trim()
  if (platformId && !Object.prototype.hasOwnProperty.call(SUPPORTED_PLATFORMS, platformId)) {
    throw new SkillStateError(
      `不支持的平台: ${platformId}。可用平台: ${Object.keys(SUPPORTED_PLATFORMS).join(', ')}`
    )
  }

  const platformPrefs = loadPlatformPreferences(paths)
  const platformIds = platformId ? [platformId] : Object.keys(SUPPORTED_PLATFORMS)
  const platforms = {}

  for (const currentPlatformId of platformIds) {
    const runtimeSchemaResult = loadRuntimeSchema(paths, currentPlatformId)
    const saved = platformPrefs.platforms[currentPlatformId] || {}
    platforms[currentPlatformId] = {
      platform_name: SUPPORTED_PLATFORMS[currentPlatformId],
      saved_preferences: saved,
      effective_preferences: buildEffectiveExecutionOptions(runtimeSchemaResult.schema, saved)
    }
  }

  return emit({
    success: true,
    platform_preferences_path: paths.platformPreferencesPath,
    platforms
  })
}

function commandSetPlatformPreferences(paths, options) {
  const platformId = requireStringOption(options, 'platform-id', 'platform_id')
  if (!Object.prototype.hasOwnProperty.call(SUPPORTED_PLATFORMS, platformId)) {
    throw new SkillStateError(
      `不支持的平台: ${platformId}。可用平台: ${Object.keys(SUPPORTED_PLATFORMS).join(', ')}`
    )
  }

  loadRuntimeSchema(paths, platformId)
  const platformPrefs = loadPlatformPreferences(paths)
  const existing = platformPrefs.platforms[platformId] || {}
  const updates = parseExecutionPreferenceOptions(options)
  const now = utcNowIso()

  const merged = {
    ...existing,
    ...updates,
    request_params: {
      ...(existing.request_params || {}),
      ...(updates.request_params || {})
    },
    updated_at: now
  }

  platformPrefs.platforms[platformId] = merged
  savePlatformPreferences(paths, platformPrefs)

  const normalized = loadPlatformPreferences(paths)
  const runtimeSchemaResult = loadRuntimeSchema(paths, platformId)

  return emit({
    success: true,
    message: `${SUPPORTED_PLATFORMS[platformId]} 平台偏好已保存。`,
    platform_preferences_path: paths.platformPreferencesPath,
    platform_id: platformId,
    saved_preferences: normalized.platforms[platformId],
    effective_preferences: buildEffectiveExecutionOptions(runtimeSchemaResult.schema, normalized.platforms[platformId])
  })
}

async function commandExecute(paths, options) {
  const platformId = requireStringOption(options, 'platform-id', 'platform_id')
  if (!Object.prototype.hasOwnProperty.call(SUPPORTED_PLATFORMS, platformId)) {
    throw new SkillStateError(
      `不支持的平台: ${platformId}。可用平台: ${Object.keys(SUPPORTED_PLATFORMS).join(', ')}`
    )
  }

  const preflight = buildPreflightSummary(paths, { ...options, 'platform-id': platformId })
  if (!preflight.ready) {
    return emitWithCode(preflight, 2)
  }

  const prefs = loadPreferences(paths)
  const backendToken = String(prefs.backend_api_token || '').trim()
  if (!backendToken) {
    throw new SkillStateError('当前还没有 backend_api_token，请先执行 set-backend-token。')
  }

  const binding = resolveBinding(
    prefs,
    String(options['binding-id'] || '').trim(),
    String(options['binding-name'] || '').trim()
  )

  const runtimeSchemaResult = loadRuntimeSchema(paths, platformId)
  const tableSchemaResult = loadTableSchema(paths, runtimeSchemaResult)

  if (options['table-name'] !== undefined) {
    throw new SkillStateError('table_name 由 Skill 的表结构配置决定，不能在执行时手动传 --table-name。')
  }

  const tableName = String(tableSchemaResult.schema.table_name || '').trim()
  if (!tableName) {
    throw new SkillStateError(`表结构配置缺少 table_name: ${tableSchemaResult.schemaPath}`)
  }

  const platformPrefs = loadPlatformPreferences(paths)
  const runtimeOverrides = parseExecutionPreferenceOptions(options)
  runtimeOverrides.request_params = parseOptionalRequestParams(options['request-params'], runtimeOverrides.request_params || {})
  const effectiveExecution = buildEffectiveExecutionOptions(
    runtimeSchemaResult.schema,
    platformPrefs.platforms[platformId],
    runtimeOverrides
  )
  const apiBase = String(options['api-base'] || process.env.HOT_LIST_SKILL_API_BASE || DEFAULT_API_BASE).trim()
  const timeoutSec = Number.parseInt(String(options['timeout-sec'] || '60'), 10)

  const payload = {
    platform: platformId,
    function_type: 'hot_list',
    form_data: effectiveExecution.request_params,
    runtime_schema: runtimeSchemaResult.schema,
    table_schema: tableSchemaResult.schema,
    tool_api_key: backendToken,
    export_target: {
      base_token: binding.base_token,
      api_key: binding.api_key,
      table_name: tableName
    },
    source: 'skill_manual',
    collect_mode: effectiveExecution.collect_mode,
    collect_times: effectiveExecution.collect_times,
    deduplication_enabled: effectiveExecution.deduplication_enabled,
    deduplication_field: effectiveExecution.deduplication_field,
    deduplication_strategy: effectiveExecution.deduplication_strategy
  }

  const response = await sendExecuteRequest(apiBase, backendToken, payload, Number.isFinite(timeoutSec) ? timeoutSec : 60)
  const result = response.result || {}

  return emit({
    success: response.success !== false,
    message: response.message || '执行完成',
    platform_id: platformId,
    platform_name: SUPPORTED_PLATFORMS[platformId],
    binding_id: binding.id,
    binding_name: binding.name,
    table_name: result.table_name || tableName,
    request_params: effectiveExecution.request_params,
    execution_preferences: {
      collect_mode: effectiveExecution.collect_mode,
      collect_times: effectiveExecution.collect_times,
      deduplication_enabled: effectiveExecution.deduplication_enabled,
      deduplication_field: effectiveExecution.deduplication_field,
      deduplication_strategy: effectiveExecution.deduplication_strategy
    },
    runtime_schema_version: runtimeSchemaResult.schema.schema_version,
    table_schema_id: tableSchemaResult.schema.table_schema_id,
    result,
    raw_response: response
  })
}

async function main() {
  const [, , command, ...rest] = process.argv
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    return printHelp()
  }

  const paths = buildSkillPaths()
  const options = parseOptions(rest)

  switch (command) {
    case 'show-current-preferences':
      return commandShowCurrentPreferences(paths)
    case 'set-backend-token':
      return commandSetBackendToken(paths, options)
    case 'add-or-update-binding':
      return commandAddOrUpdateBinding(paths, options)
    case 'set-default-binding':
      return commandSetDefaultBinding(paths, options)
    case 'preflight-check':
      return commandPreflightCheck(paths, options)
    case 'show-platform-options':
      return commandShowPlatformOptions(paths, options)
    case 'show-platform-preferences':
      return commandShowPlatformPreferences(paths, options)
    case 'set-platform-preferences':
      return commandSetPlatformPreferences(paths, options)
    case 'show-runtime-schema':
      return commandShowRuntimeSchema(paths, options)
    case 'execute':
      return commandExecute(paths, options)
    default:
      throw new SkillStateError(`不支持的命令: ${command}`)
  }
}

main()
  .then(code => {
    process.exit(typeof code === 'number' ? code : 0)
  })
  .catch(error => {
    if (error instanceof SkillStateError) {
      process.exit(emitError(error.message))
    }
    process.exit(emitError(error.message || '未知错误'))
  })
