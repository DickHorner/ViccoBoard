/**
 * Migration 012: Student Long-term Notes Schema
 */

import { SQLiteStorage } from '../storage.js';

export class StudentLongTermNotesMigration {
  version = 12;
  name = 'student_long_term_notes_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS student_long_term_notes (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        class_group_id TEXT NOT NULL,
        school_year TEXT NOT NULL,
        competency_areas TEXT NOT NULL DEFAULT '[]',
        development_notes TEXT NOT NULL DEFAULT '[]',
        internal_notes TEXT NOT NULL DEFAULT '',
        strengths TEXT NOT NULL DEFAULT '[]',
        focus_areas TEXT NOT NULL DEFAULT '[]',
        last_review_date TEXT,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (class_group_id) REFERENCES class_groups(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_student_long_term_student ON student_long_term_notes(student_id);
      CREATE INDEX IF NOT EXISTS idx_student_long_term_class ON student_long_term_notes(class_group_id);
      CREATE INDEX IF NOT EXISTS idx_student_long_term_year ON student_long_term_notes(school_year);
    `);
  }

  async down(): Promise<void> {
    const db = this.storage.getDatabase();
    db.exec(`DROP TABLE IF EXISTS student_long_term_notes;`);
  }
}
