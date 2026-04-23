import type { IndexedDBMigration } from './indexeddb-migration.js';

/**
 * Lesson Schedule Fields — IndexedDB variant (no-op migration)
 *
 * No object-store schema changes are required for the new lesson schedule
 * fields (start_time, duration_minutes, title, room).
 *
 * IndexedDB stores lesson objects as opaque JSON blobs keyed by `id`.
 * Adding new properties to those objects does not require a migration
 * because IndexedDB does not enforce column-level schemas on existing
 * object stores. New writes already include all four fields, and
 * pre-existing records are handled by the repository's legacy-safe
 * `mapToEntity()` fallbacks (NULL → default values).
 *
 * No new index is needed for any of the four fields: the overlap-check
 * in UpdateLessonUseCase / CreateLessonUseCase loads lessons by
 * class_group_id (which is already indexed) and filters in memory.
 *
 * This migration exists solely to keep the IndexedDB version sequence
 * aligned with the SQLite migration sequence and to make the explicit
 * architectural decision auditable in the migration registry.
 */
export class IndexedDBLessonScheduleFieldsMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 22;
  name = 'indexeddb_lesson_schedule_fields';

  // No schema changes needed — see class-level comment.
  up(_db: IDBDatabase, _tx: IDBTransaction): void {}
}
