/**
 * Migration 011: Highlighted Works Schema
 */

import { SQLiteStorage } from '../storage.js';

export class HighlightedWorksMigration {
  version = 11;
  name = 'highlighted_works_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS highlighted_works (
        id TEXT PRIMARY KEY,
        correction_id TEXT NOT NULL,
        exam_id TEXT NOT NULL,
        candidate_id TEXT NOT NULL,
        task_id TEXT,
        category TEXT,
        image_url TEXT,
        description TEXT,
        anonymized INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (correction_id) REFERENCES correction_entries(id) ON DELETE CASCADE,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
        FOREIGN KEY (candidate_id) REFERENCES exams_candidates(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_highlighted_correction ON highlighted_works(correction_id);
      CREATE INDEX IF NOT EXISTS idx_highlighted_exam ON highlighted_works(exam_id);
      CREATE INDEX IF NOT EXISTS idx_highlighted_candidate ON highlighted_works(candidate_id);
    `);
  }

  async down(): Promise<void> {
    const db = this.storage.getDatabase();
    db.exec(`DROP TABLE IF EXISTS highlighted_works;`);
  }
}
