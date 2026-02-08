/**
 * ViccoBoard Storage Package
 * Exports storage, crypto, and repository implementations
 */

export * from './storage.js';
export * from './crypto/crypto.service.js';
export * from './repositories/base.repository.js';
export * from './repositories/adapter.repository.js';
export * from './adapters/storage-adapter.interface.js';
export * from './adapters/sqlite.adapter.js';
export * from './adapters/indexeddb.adapter.js';
export * from './migrations/001_initial_schema_new.js';
export * from './migrations/002_grading_schema.js';
export * from './migrations/003_shuttle_run_schema.js';
export * from './migrations/004_cooper_test_schema.js';
export * from './migrations/005_sportabzeichen_schema.js';
export * from './migrations/006_exam_schema.js';
export * from './migrations/007_correction_schema.js';
export * from './migrations/008_class_group_color.js';
export * from './migrations/009_class_group_archive.js';
export * from './migrations/013_sportzens_schema.js';
export * from './migrations/indexeddb/indexeddb-migration.js';
export * from './migrations/indexeddb/001_initial_schema.js';
export * from './migrations/indexeddb/002_grading_schema.js';
export * from './migrations/indexeddb/003_shuttle_run_schema.js';
export * from './migrations/indexeddb/004_cooper_test_schema.js';
export * from './migrations/indexeddb/005_sportabzeichen_schema.js';
export * from './migrations/indexeddb/006_exam_schema.js';
export * from './migrations/indexeddb/007_correction_schema.js';
export * from './migrations/indexeddb/008_class_group_color.js';
export * from './migrations/indexeddb/009_class_group_archive.js';
export * from './migrations/indexeddb/013_sportzens_schema.js';
export * from './indexeddb.storage.js';

// Version
export const STORAGE_VERSION = '0.1.0';

