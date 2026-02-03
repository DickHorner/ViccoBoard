/**
 * ViccoBoard Storage Package
 * Exports storage, crypto, and repository implementations
 */

export * from './storage';
export * from './crypto/crypto.service';
export * from './repositories/base.repository';
export * from './repositories/adapter.repository';
export * from './adapters/storage-adapter.interface';
export * from './adapters/sqlite.adapter';
export * from './adapters/indexeddb.adapter';
export * from './migrations/001_initial_schema_new';
export * from './migrations/002_grading_schema';
export * from './migrations/004_cooper_test_schema';
export * from './migrations/indexeddb/indexeddb-migration';
export * from './migrations/indexeddb/001_initial_schema';
export * from './migrations/indexeddb/002_grading_schema';
export * from './migrations/indexeddb/004_cooper_test_schema';
export * from './indexeddb.storage';

// Version
export const STORAGE_VERSION = '0.1.0';
