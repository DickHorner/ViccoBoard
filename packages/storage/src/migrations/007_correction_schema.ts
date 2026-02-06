/**
 * Correction Entry Schema Migration
 * Creates tables for correction entries
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class CorrectionSchemaMigration implements Migration {
  version = 7;
  name = 'correction_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS correction_entries (
        id TEXT PRIMARY KEY,
        exam_id TEXT NOT NULL,
        candidate_id TEXT NOT NULL,
        task_scores TEXT NOT NULL,
        total_points REAL NOT NULL,
        total_grade TEXT NOT NULL,
        percentage_score REAL NOT NULL,
        comments TEXT NOT NULL,
        support_tips TEXT NOT NULL,
        highlighted_work TEXT,
        status TEXT NOT NULL,
        corrected_by TEXT,
        corrected_at TEXT,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_corrections_exam ON correction_entries(exam_id);
      CREATE INDEX IF NOT EXISTS idx_corrections_candidate ON correction_entries(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_corrections_status ON correction_entries(status);
    `);
  }

  async down(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      DROP TABLE IF EXISTS correction_entries;
    `);
  }
}
