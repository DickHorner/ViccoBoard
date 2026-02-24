/**
 * Browser-safe entrypoint for @viccoboard/storage.
 * Excludes Node.js-only SQLite storage and adapters.
 */

export * from './indexeddb.storage.js';
export * from './repositories/adapter.repository.js';
export * from './adapters/storage-adapter.interface.js';
export * from './adapters/indexeddb.adapter.js';
export * from './adapters/in-memory.adapter.js';
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
export * from './migrations/indexeddb/013_sport_schema.js';
export * from './migrations/indexeddb/014_tool_sessions_schema.js';
