/** @jest-environment node */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import {
  parseLiveDataBackup,
  restoreLiveDataBackup,
  type LiveDataBackupFile
} from '../src/services/live-data-backup.service'

const getStorage = jest.fn<() => { getDatabase(): IDBDatabase }>()

jest.mock('../src/services/storage.service', () => ({
  getStorage: () => getStorage(),
  VICCOBOARD_DATABASE_NAME: 'viccoboard'
}))

function backup(stores: LiveDataBackupFile['stores']): LiveDataBackupFile {
  return {
    format: 'viccoboard-live-data-backup',
    formatVersion: 1,
    databaseName: 'viccoboard',
    exportedAt: '2026-11-13T06:00:00.000Z',
    stores
  }
}

async function openTestDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('viccoboard-backup-atomicity-test', 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('students', { keyPath: 'id' })
      request.result.createObjectStore('classes', { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function rows(db: IDBDatabase, storeName: string): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName).objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result as Record<string, unknown>[])
    request.onerror = () => reject(request.error)
  })
}

describe('live-data-backup restore safety', () => {
  let db: IDBDatabase

  beforeEach(async () => {
    db = await openTestDatabase()
    getStorage.mockReturnValue({ getDatabase: () => db })
    const tx = db.transaction(['students', 'classes'], 'readwrite')
    tx.objectStore('students').clear()
    tx.objectStore('classes').clear()
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onabort = () => reject(tx.error)
    })
  })

  it('keeps legacy v1 JSON imports supported', async () => {
    const file = parseLiveDataBackup(JSON.stringify(backup([
      { name: 'students', records: [{ id: 's1', first_name: 'Ada' }] }
    ])))
    const result = await restoreLiveDataBackup(file)
    expect(result.insertedRecords).toBe(1)
    expect(await rows(db, 'students')).toEqual([{ id: 's1', first_name: 'Ada' }])
  })

  it('rejects unknown stores before writing any data', async () => {
    await expect(restoreLiveDataBackup(backup([
      { name: 'students', records: [{ id: 's1' }] },
      { name: 'unknown_store', records: [{ id: 'x1' }] }
    ]))).rejects.toThrow('Nichts wurde importiert')
    expect(await rows(db, 'students')).toEqual([])
  })

  it('rejects duplicates and malformed records before any writes', async () => {
    for (const file of [
      backup([{ name: 'students', records: [{ id: 's1' }, { id: 's1' }] }]),
      backup([{ name: 'students', records: [{ id: 's1' }] }, { name: 'students', records: [] }]),
      backup([{ name: 'students', records: [{ first_name: 'Missing ID' }] }])
    ]) {
      await expect(restoreLiveDataBackup(file)).rejects.toThrow()
    }
    expect(await rows(db, 'students')).toEqual([])
  })

  it('rejects another database without writing', async () => {
    const file = { ...backup([{ name: 'students', records: [{ id: 's1' }] }]), databaseName: 'another' }
    await expect(restoreLiveDataBackup(file)).rejects.toThrow('anderen Datenbank')
    expect(await rows(db, 'students')).toEqual([])
  })

  it('rolls back writes from earlier stores when a later record conflicts', async () => {
    await restoreLiveDataBackup(backup([
      { name: 'students', records: [{ id: 'existing', first_name: 'Ada' }] }
    ]))

    await expect(restoreLiveDataBackup(backup([
      { name: 'classes', records: [{ id: 'new-class', name: '5a' }] },
      { name: 'students', records: [{ id: 'existing', first_name: 'Grace' }] }
    ]))).rejects.toThrow('vollständig abgebrochen')
    expect(await rows(db, 'classes')).toEqual([])
    expect(await rows(db, 'students')).toEqual([{ id: 'existing', first_name: 'Ada' }])
  })

  it('rolls back all stores if a later IndexedDB constraint fails', async () => {
    db.close()
    const request = indexedDB.open('viccoboard-backup-constraint-test', 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('students', { keyPath: 'id' })
      const classes = request.result.createObjectStore('classes', { keyPath: 'id' })
      classes.createIndex('unique_name', 'name', { unique: true })
    }
    db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    getStorage.mockReturnValue({ getDatabase: () => db })
    await expect(restoreLiveDataBackup(backup([
      { name: 'students', records: [{ id: 'new-student' }] },
      { name: 'classes', records: [{ id: 'c1', name: 'Same' }, { id: 'c2', name: 'Same' }] }
    ]))).rejects.toThrow()
    expect(await rows(db, 'students')).toEqual([])
    expect(await rows(db, 'classes')).toEqual([])
    db.close()
  })
})
