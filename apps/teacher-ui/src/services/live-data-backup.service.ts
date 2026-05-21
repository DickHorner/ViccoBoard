import { getStorage } from './storage.service'

const VICCOBOARD_DATABASE_NAME = 'viccoboard'

export interface LiveDataBackupStore {
  name: string
  records: Array<Record<string, unknown>>
}

export interface LiveDataBackupFile {
  format: 'viccoboard-live-data-backup'
  formatVersion: 1
  databaseName: string
  exportedAt: string
  stores: LiveDataBackupStore[]
}

export interface LiveDataRestoreResult {
  importedStores: number
  skippedStores: string[]
  insertedRecords: number
  mergedRecords: number
  unchangedRecords: number
  conflictRecords: number
}

interface MergeResult {
  value: unknown
  changed: boolean
  conflict: boolean
}

export async function createLiveDataBackup(): Promise<LiveDataBackupFile> {
  const db = getStorage().getDatabase()
  const stores = Array.from(db.objectStoreNames).sort()
  const backupStores: LiveDataBackupStore[] = []

  for (const storeName of stores) {
    backupStores.push({
      name: storeName,
      records: await readAllRecords(db, storeName)
    })
  }

  return {
    format: 'viccoboard-live-data-backup',
    formatVersion: 1,
    databaseName: VICCOBOARD_DATABASE_NAME,
    exportedAt: new Date().toISOString(),
    stores: backupStores
  }
}

export function buildBackupFileName(referenceDate = new Date()): string {
  const stamp = referenceDate.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `viccoboard-backup-${stamp}.json`
}

export async function restoreLiveDataBackup(backup: LiveDataBackupFile): Promise<LiveDataRestoreResult> {
  assertBackupFile(backup)

  const db = getStorage().getDatabase()
  let insertedRecords = 0
  let mergedRecords = 0
  let unchangedRecords = 0
  let conflictRecords = 0
  let importedStores = 0
  const skippedStores: string[] = []

  for (const storeBackup of backup.stores) {
    if (!db.objectStoreNames.contains(storeBackup.name)) {
      skippedStores.push(storeBackup.name)
      continue
    }

    importedStores += 1
    const result = await restoreChangedRecords(db, storeBackup.name, storeBackup.records)
    insertedRecords += result.insertedRecords
    mergedRecords += result.mergedRecords
    unchangedRecords += result.unchangedRecords
    conflictRecords += result.conflictRecords
  }

  return {
    importedStores,
    skippedStores,
    insertedRecords,
    mergedRecords,
    unchangedRecords,
    conflictRecords
  }
}

export function parseLiveDataBackup(content: string): LiveDataBackupFile {
  const parsed = JSON.parse(content) as unknown
  assertBackupFile(parsed)
  return parsed
}

function assertBackupFile(value: unknown): asserts value is LiveDataBackupFile {
  if (!value || typeof value !== 'object') {
    throw new Error('Die Backup-Datei ist ungültig.')
  }

  const backup = value as Partial<LiveDataBackupFile>
  if (backup.format !== 'viccoboard-live-data-backup' || backup.formatVersion !== 1) {
    throw new Error('Die Backup-Datei hat kein unterstütztes ViccoBoard-Format.')
  }

  if (!Array.isArray(backup.stores)) {
    throw new Error('Die Backup-Datei enthält keine Store-Daten.')
  }
}

function readAllRecords(db: IDBDatabase, storeName: string): Promise<Array<Record<string, unknown>>> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const request = tx.objectStore(storeName).getAll()

    request.onsuccess = () => resolve(request.result as Array<Record<string, unknown>>)
    request.onerror = () => reject(request.error)
    tx.onerror = () => reject(tx.error)
  })
}

function restoreChangedRecords(
  db: IDBDatabase,
  storeName: string,
  records: Array<Record<string, unknown>>
): Promise<{
  insertedRecords: number
  mergedRecords: number
  unchangedRecords: number
  conflictRecords: number
}> {
  if (records.length === 0) {
    return Promise.resolve({
      insertedRecords: 0,
      mergedRecords: 0,
      unchangedRecords: 0,
      conflictRecords: 0
    })
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    let insertedRecords = 0
    let mergedRecords = 0
    let unchangedRecords = 0
    let conflictRecords = 0

    tx.oncomplete = () => resolve({ insertedRecords, mergedRecords, unchangedRecords, conflictRecords })
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('Die Wiederherstellung wurde abgebrochen.'))

    for (const backupRecord of records) {
      const id = backupRecord.id
      if (typeof id !== 'string') {
        tx.abort()
        reject(new Error(`Backup-Datensatz in ${storeName} hat keine gültige ID.`))
        return
      }

      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const currentRecord = getRequest.result as Record<string, unknown> | undefined
        if (!currentRecord) {
          store.put(backupRecord)
          insertedRecords += 1
          return
        }

        const merge = mergeValue(currentRecord, backupRecord)
        if (merge.conflict) {
          conflictRecords += 1
          return
        }

        if (!merge.changed) {
          unchangedRecords += 1
          return
        }

        store.put(merge.value as Record<string, unknown>)
        mergedRecords += 1
      }
      getRequest.onerror = () => reject(getRequest.error)
    }
  })
}

function mergeValue(current: unknown, incoming: unknown): MergeResult {
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

function mergeRecord(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>
): MergeResult {
  const merged: Record<string, unknown> = { ...current }
  let changed = false
  let conflict = false

  for (const key of Object.keys(incoming)) {
    const result = mergeValue(current[key], incoming[key])
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
  if (canMergeArrayById(current) && canMergeArrayById(incoming)) {
    return mergeArrayById(current, incoming)
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

function mergeArrayById(current: Array<Record<string, unknown>>, incoming: Array<Record<string, unknown>>): MergeResult {
  const merged = [...current]
  let changed = false
  let conflict = false

  for (const incomingItem of incoming) {
    const id = incomingItem.id
    const index = merged.findIndex((currentItem) => currentItem.id === id)

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

function canMergeArrayById(items: unknown[]): items is Array<Record<string, unknown>> {
  return items.every((item) => isPlainRecord(item) && typeof item.id === 'string')
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stableStringify(value: unknown): string {
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
