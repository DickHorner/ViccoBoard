import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class StudentImportBatchesMigration implements Migration {
  version = 21;
  name = 'student_import_batches';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();
    const studentColumns = (db.prepare(`PRAGMA table_info(students)`).all() as Array<{ name: string }>)
      .map((column) => column.name);

    if (!studentColumns.includes('date_of_birth')) {
      db.exec(`
        ALTER TABLE students ADD COLUMN date_of_birth TEXT;
      `);
    }

    if (!studentColumns.includes('legacy_dob_missing')) {
      db.exec(`
        ALTER TABLE students ADD COLUMN legacy_dob_missing INTEGER NOT NULL DEFAULT 0;
      `);
    }

    if (studentColumns.includes('birth_year')) {
      db.exec(`
        UPDATE students
        SET legacy_dob_missing = CASE
          WHEN birth_year IS NOT NULL THEN 1
          ELSE legacy_dob_missing
        END;
      `);
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS sport_student_profiles (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        module_key TEXT NOT NULL,
        medical_notes TEXT,
        asthma INTEGER,
        diabetes INTEGER,
        hemiplegia INTEGER,
        exempt_from TEXT,
        exempt_until TEXT,
        disadvantage_compensation TEXT,
        swimming_capable INTEGER,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      );
    `);

    const hasLegacySportColumns =
      studentColumns.includes('settings') ||
      studentColumns.includes('stats') ||
      studentColumns.includes('public_code');

    if (hasLegacySportColumns) {
      const settingsExpression = studentColumns.includes('settings')
        ? `coalesce('settings=' || settings || ' ', '')`
        : `''`;
      const statsExpression = studentColumns.includes('stats')
        ? `coalesce('stats=' || stats || ' ', '')`
        : `''`;
      const publicCodeExpression = studentColumns.includes('public_code')
        ? `coalesce('public_code=' || public_code, '')`
        : `''`;
      const whereConditions = [
        studentColumns.includes('settings') ? 'settings IS NOT NULL' : null,
        studentColumns.includes('stats') ? 'stats IS NOT NULL' : null,
        studentColumns.includes('public_code') ? 'public_code IS NOT NULL' : null
      ].filter(Boolean).join(' OR ');

      db.exec(`
        INSERT OR REPLACE INTO sport_student_profiles (
          id,
          student_id,
          module_key,
          medical_notes,
          created_at,
          last_modified
        )
        SELECT
          'sport-profile-' || id,
          id,
          'sport',
          trim(${settingsExpression} || ${statsExpression} || ${publicCodeExpression}),
          created_at,
          last_modified
        FROM students
        WHERE ${whereConditions};
      `);
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS import_batches (
        id TEXT PRIMARY KEY,
        source_type TEXT NOT NULL,
        import_type TEXT NOT NULL,
        label TEXT NOT NULL,
        summary_read INTEGER NOT NULL DEFAULT 0,
        summary_valid INTEGER NOT NULL DEFAULT 0,
        summary_imported INTEGER NOT NULL DEFAULT 0,
        summary_skipped INTEGER NOT NULL DEFAULT 0,
        summary_conflicts INTEGER NOT NULL DEFAULT 0,
        summary_errors INTEGER NOT NULL DEFAULT 0,
        metadata TEXT,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS import_batch_items (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (batch_id) REFERENCES import_batches(id) ON DELETE CASCADE
      );
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
      CREATE INDEX IF NOT EXISTS idx_sport_student_profiles_student ON sport_student_profiles(student_id);
      CREATE INDEX IF NOT EXISTS idx_import_batches_source_type ON import_batches(source_type);
      CREATE INDEX IF NOT EXISTS idx_import_batch_items_batch ON import_batch_items(batch_id);
    `);
  }

  async down(): Promise<void> {
    throw new Error('Down migration not supported for student_import_batches');
  }
}
