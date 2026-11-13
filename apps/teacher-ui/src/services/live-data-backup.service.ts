import { getStorage, VICCOBOARD_DATABASE_NAME } from './storage.service'
import { mergeBackupValue } from './live-data-backup-merge'

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
  const missingStores = backup.stores
    .filter((store) => !db.objectStoreNames.contains(store.name))
    .map((store) => store.name)

  if (missingStores.length > 0) {
    throw new Error(
      'Diese Datenbereiche sind in der aktuellen ViccoBoard-Version nicht vorhanden: ' +
      missingStores.join(', ') + '. Nichts wurde importiert.'
    )
  }

  return restoreChangedRecords(db, backup.stores)
}

export function parseLiveDataBackup(content: string): LiveDataBackupFile {
  const parsed = JSON.parse(content) as unknown
  assertBackupFile(parsed)
  return parsed
}

function assertBackupFile(value: unknown): asserts value is LiveDataBackupFile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Die Backup-Datei ist ungültig.')
  }

  const backup = value as Partial<LiveDataBackupFile>
  if (backup.format !== 'viccoboard-live-data-backup' || backup.formatVersion !== 1) {
    throw new Error('Die Backup-Datei hat kein unterstütztes ViccoBoard-Format.')
  }

  if (backup.databaseName !== VICCOBOARD_DATABASE_NAME) {
    throw new Error('Das Backup gehört zu einer anderen Datenbank.')
  }

  if (typeof backup.exportedAt !== 'string' || !Number.isFinite(Date.parse(backup.exportedAt))) {
    throw new Error('Das Backup hat kein gültiges Exportdatum.')
  }

  if (!Array.isArray(backup.stores) || backup.stores.length === 0) {
    throw new Error('Die Backup-Datei enthält keine Store-Daten.')
  }

  const storeNames = new Set<string>()
  for (const store of backup.stores) {
    if (!store || typeof store.name !== 'string' || !store.name ||
        !Array.isArray(store.records) || storeNames.has(store.name)) {
      throw new Error('Die Backup-Datei enthält ungültige oder doppelte Datenbereiche.')
    }
    storeNames.add(store.name)

    const recordIds = new Set<string>()
    for (const record of store.records) {
      if (!record || typeof record !== 'object' || Array.isArray(record) ||
          typeof record.id !== 'string' || !record.id || recordIds.has(record.id)) {
        throw new Error('Das Backup enthält ungültige oder doppelte IDs in ' + store.name + '.')
      }
      recordIds.add(record.id)
    }
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

function restoreChangedRecords(db: IDBDatabase, backupStores: LiveDataBackupStore[]): Promise<LiveDataRestoreResult> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(backupStores.map((store) => store.name), 'readwrite')
    let insertedRecords = 0
    let mergedRecords = 0
    let unchangedRecords = 0
    let failure: Error | null = null

    tx.oncomplete = () => resolve({
      importedStores: backupStores.length,
      skippedStores: [],
      insertedRecords,
      mergedRecords,
      unchangedRecords,
      conflictRecords: 0
    })
    tx.onabort = () => reject(failure ?? tx.error ?? new Error('Die Wiederherstellung wurde abgebrochen.'))

    for (const storeBackup of backupStores) {
      const store = tx.objectStore(storeBackup.name)
      for (const backupRecord of storeBackup.records) {
        const request = store.get(backupRecord.id as string)
        request.onsuccess = () => {
          try {
            const currentRecord = request.result as Record<string, unknown> | undefined
            if (!currentRecord) {
              store.put(backupRecord)
              insertedRecords += 1
              return
            }

            const merge = mergeBackupValue(currentRecord, backupRecord)
            if (merge.conflict) {
              failure = new Error(
                'Konflikt bei Datensatz ' + String(backupRecord.id) + ' in ' + storeBackup.name +
                '. Die Wiederherstellung wurde vollständig abgebrochen.'
              )
              tx.abort()
              return
            }

            if (!merge.changed) {
              unchangedRecords += 1
              return
            }

            store.put(merge.value as Record<string, unknown>)
            mergedRecords += 1
          } catch (error) {
            failure = error instanceof Error ? error : new Error('Fehler beim Wiederherstellen.')
            tx.abort()
          }
        }
      }
    }
  })
}
