import {
  IndexedDBStorage,
  IndexedDBInitialSchemaMigration,
  IndexedDBGradingSchemaMigration,
  IndexedDBShuttleRunSchemaMigration,
  IndexedDBCooperTestSchemaMigration,
  IndexedDBSportabzeichenSchemaMigration,
  IndexedDBExamSchemaMigration,
  correctionSchemaMigration,
  IndexedDBClassGroupColorMigration,
  IndexedDBClassGroupArchiveMigration,
  IndexedDBSportSchemaMigration,
  IndexedDBToolSessionsSchemaMigration,
  IndexedDBTacticsSnapshotsSchemaMigration,
  IndexedDBTournamentSchemaMigration,
  IndexedDBLegacyStoreRepairMigration,
  IndexedDBCatalogAndTableStoreRepairMigration,
  IndexedDBGameDatabaseSchemaMigration,
  IndexedDBKbrFeedbackWorkflowMigration,
  IndexedDBStudentImportBatchesMigration,
  IndexedDBLessonScheduleFieldsMigration,
  IndexedDBSupportTipsMigration
} from '@viccoboard/storage/browser';
import type { StorageAdapter } from '@viccoboard/storage/browser';

export const VICCOBOARD_DATABASE_NAME = 'viccoboard';

let storageInstance: IndexedDBStorage | null = null;
let storageInitialized = false;

export async function initializeStorage(): Promise<StorageAdapter> {
  if (storageInitialized && storageInstance) {
    return storageInstance.getAdapter();
  }

  const storage = new IndexedDBStorage({
    databaseName: VICCOBOARD_DATABASE_NAME,
    version: 1
  });

  storage.registerMigration(new IndexedDBInitialSchemaMigration());
  storage.registerMigration(new IndexedDBGradingSchemaMigration());
  storage.registerMigration(new IndexedDBShuttleRunSchemaMigration());
  storage.registerMigration(new IndexedDBCooperTestSchemaMigration());
  storage.registerMigration(new IndexedDBSportabzeichenSchemaMigration());
  storage.registerMigration(new IndexedDBExamSchemaMigration());
  storage.registerMigration(correctionSchemaMigration);
  storage.registerMigration(new IndexedDBClassGroupColorMigration());
  storage.registerMigration(new IndexedDBClassGroupArchiveMigration());
  storage.registerMigration(new IndexedDBSportSchemaMigration());
  storage.registerMigration(new IndexedDBToolSessionsSchemaMigration());
  storage.registerMigration(new IndexedDBTacticsSnapshotsSchemaMigration());
  storage.registerMigration(new IndexedDBTournamentSchemaMigration());
  storage.registerMigration(new IndexedDBLegacyStoreRepairMigration());
  storage.registerMigration(new IndexedDBCatalogAndTableStoreRepairMigration());
  storage.registerMigration(new IndexedDBGameDatabaseSchemaMigration());
  storage.registerMigration(new IndexedDBKbrFeedbackWorkflowMigration());
  storage.registerMigration(new IndexedDBStudentImportBatchesMigration());
  storage.registerMigration(new IndexedDBLessonScheduleFieldsMigration());
  storage.registerMigration(new IndexedDBSupportTipsMigration());

  await storage.initialize('');

  storageInstance = storage;
  storageInitialized = true;

  return storage.getAdapter();
}

export function getStorage(): IndexedDBStorage {
  if (!storageInstance) {
    throw new Error(
      'Storage not initialized. Call initializeStorage() first.'
    );
  }
  return storageInstance;
}

export function getStorageAdapter(): StorageAdapter {
  return getStorage().getAdapter();
}

export async function closeStorage(): Promise<void> {
  if (storageInstance) {
    await storageInstance.close();
    storageInstance = null;
    storageInitialized = false;
  }
}

export function isStorageInitialized(): boolean {
  return storageInitialized && storageInstance !== null;
}
