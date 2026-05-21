import { getStorage, VICCOBOARD_DATABASE_NAME } from './storage.service'

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
  importedRecords: number
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
  let importedStores = 0
  let importedRecords = 0
  const skippedStores: string[] = []

  for (const storeBackup of backup.stores) {
    if (!db.objectStoreNames.contains(storeBackup.name)) {
      skippedStores.push(storeBackup.name)
      continue
    }

    importedStores += 1
    importedRecords += await putRecords(db, storeBackup.name, storeBackup.records)
  }

  return {
    importedStores,
    skippedStores,
    importedRecords
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

function putRecords(
  db: IDBDatabase,
  storeName: string,
  records: Array<Record<string, unknown>>
): Promise<number> {
  if (records.length === 0) {
    return Promise.resolve(0)
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    let queued = 0

    for (const record of records) {
      store.put(record)
      queued += 1
    }

    tx.oncomplete = () => resolve(queued)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('Die Wiederherstellung wurde abgebrochen.'))
  })
}
