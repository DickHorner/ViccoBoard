/**
 * Storage Service
 * Initializes and manages @viccoboard/storage for the UI
 * This is the ONLY place where storage should be initialized in the app
 * 
 * ARCHITECTURE: Provides shared storage instance to all composables/bridges
 */

import { IndexedDBStorage } from '@viccoboard/storage';
import type { StorageAdapter } from '@viccoboard/storage';

let storageInstance: IndexedDBStorage | null = null;
let storageInitialized = false;

/**
 * Initialize storage (should be called in main.ts or App.vue setup)
 */
export async function initializeStorage(): Promise<StorageAdapter> {
  if (storageInitialized && storageInstance) {
    return storageInstance.getAdapter();
  }

  // Create storage instance
  const storage = new IndexedDBStorage({
    databaseName: 'viccoboard',
    version: 1
  });

  // Register migrations here (when implemented)
  // storage.registerMigration(migration001);
  // storage.registerMigration(migration002);
  // etc.

  // Initialize with empty password (no encryption yet)
  // TODO: Implement proper encryption/password in Phase X
  await storage.initialize('');

  storageInstance = storage;
  storageInitialized = true;

  return storage.getAdapter();
}

/**
 * Get initialized storage instance
 */
export function getStorage(): IndexedDBStorage {
  if (!storageInstance) {
    throw new Error(
      'Storage not initialized. Call initializeStorage() first.'
    );
  }
  return storageInstance;
}

/**
 * Get storage adapter (for repositories)
 */
export function getStorageAdapter(): StorageAdapter {
  return getStorage().getAdapter();
}

/**
 * Close storage (for cleanup)
 */
export async function closeStorage(): Promise<void> {
  if (storageInstance) {
    await storageInstance.close();
    storageInstance = null;
    storageInitialized = false;
  }
}

/**
 * Check if storage is initialized
 */
export function isStorageInitialized(): boolean {
  return storageInitialized && storageInstance !== null;
}
