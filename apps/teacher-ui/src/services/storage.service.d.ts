/**
 * Storage Service
 * Initializes and manages @viccoboard/storage for the UI
 * This is the ONLY place where storage should be initialized in the app
 *
 * ARCHITECTURE: Provides shared storage instance to all composables/bridges
 */
import { IndexedDBStorage } from '@viccoboard/storage';
import type { StorageAdapter } from '@viccoboard/storage';
/**
 * Initialize storage (should be called in main.ts or App.vue setup)
 */
export declare function initializeStorage(): Promise<StorageAdapter>;
/**
 * Get initialized storage instance
 */
export declare function getStorage(): IndexedDBStorage;
/**
 * Get storage adapter (for repositories)
 */
export declare function getStorageAdapter(): StorageAdapter;
/**
 * Close storage (for cleanup)
 */
export declare function closeStorage(): Promise<void>;
/**
 * Check if storage is initialized
 */
export declare function isStorageInitialized(): boolean;
