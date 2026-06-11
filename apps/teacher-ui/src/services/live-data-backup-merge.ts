export interface MergeResult {
  value: unknown
  changed: boolean
  conflict: boolean
}

const ARRAY_MERGE_KEYS = ['id', 'taskId', 'criterionId', 'subCriterionId'] as const

export function mergeBackupValue(current: unknown, incoming: unknown): MergeResult {
  if (stableStringify(current) === stableStringify(incoming)) {
    return { value: current, changed: false, conflict: false }
  }

  if (current === undefined || current === null || current === '') {
    return { value: incoming, changed: true, conflict: false }
  }

  if (incoming === undefined || incoming === null || incoming === '') {
    return { value: current, changed: false, conflict: false }
  }

  if (Array.isArray(current) && Array.isArray(incoming)) {
    return mergeArray(current, incoming)
  }

  if (isPlainRecord(current) && isPlainRecord(incoming)) {
    return mergeRecord(current, incoming)
  }

  return { value: current, changed: false, conflict: true }
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  if (isPlainRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}

function mergeRecord(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>
): MergeResult {
  const merged: Record<string, unknown> = { ...current }
  let changed = false
  let conflict = false

  for (const key of Object.keys(incoming)) {
    const result = mergeBackupValue(current[key], incoming[key])
    if (result.conflict) {
      conflict = true
      continue
    }
    if (result.changed) {
      merged[key] = result.value
      changed = true
    }
  }

  return { value: merged, changed, conflict }
}

function mergeArray(current: unknown[], incoming: unknown[]): MergeResult {
  const mergeKey = ARRAY_MERGE_KEYS.find((key) => canMergeArrayByField(current, key) && canMergeArrayByField(incoming, key))
  if (mergeKey) {
    return mergeArrayByField(
      current as Array<Record<string, unknown>>,
      incoming as Array<Record<string, unknown>>,
      mergeKey
    )
  }

  const merged = [...current]
  let changed = false

  for (const incomingItem of incoming) {
    if (!merged.some((currentItem) => stableStringify(currentItem) === stableStringify(incomingItem))) {
      merged.push(incomingItem)
      changed = true
    }
  }

  return { value: merged, changed, conflict: false }
}

function mergeArrayByField(
  current: Array<Record<string, unknown>>,
  incoming: Array<Record<string, unknown>>,
  field: (typeof ARRAY_MERGE_KEYS)[number]
): MergeResult {
  const merged = [...current]
  let changed = false
  let conflict = false

  for (const incomingItem of incoming) {
    const value = incomingItem[field]
    const index = merged.findIndex((currentItem) => currentItem[field] === value)

    if (index === -1) {
      merged.push(incomingItem)
      changed = true
      continue
    }

    const result = mergeRecord(merged[index], incomingItem)
    if (result.conflict) {
      conflict = true
      continue
    }
    if (result.changed) {
      merged[index] = result.value as Record<string, unknown>
      changed = true
    }
  }

  return { value: merged, changed, conflict }
}

function canMergeArrayByField(
  items: unknown[],
  field: (typeof ARRAY_MERGE_KEYS)[number]
): items is Array<Record<string, unknown>> {
  return items.every((item) => isPlainRecord(item) && typeof item[field] === 'string')
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
