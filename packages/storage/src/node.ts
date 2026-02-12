/**
 * Node.js entrypoint for @viccoboard/storage.
 * Includes SQLite-backed storage and migrations.
 */

export * from './index.js';
export * from './storage.js';
export * from './repositories/base.repository.js';
export * from './adapters/sqlite.adapter.js';
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
export * from './migrations/014_tool_sessions_schema.js';
