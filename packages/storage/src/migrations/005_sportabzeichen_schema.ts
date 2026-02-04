/**
 * Sportabzeichen Schema Migration
 * Creates tables for standards and results
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage';

export class SportabzeichenSchemaMigration implements Migration {
  version = 5;
  name = 'sportabzeichen_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS sportabzeichen_standards (
        id TEXT PRIMARY KEY,
        discipline_id TEXT NOT NULL,
        gender TEXT NOT NULL,
        age_min INTEGER NOT NULL,
        age_max INTEGER NOT NULL,
        level TEXT NOT NULL,
        comparison TEXT NOT NULL,
        threshold REAL NOT NULL,
        unit TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS sportabzeichen_results (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        discipline_id TEXT NOT NULL,
        test_date TEXT NOT NULL,
        age_at_test INTEGER NOT NULL,
        gender TEXT NOT NULL,
        performance_value REAL NOT NULL,
        unit TEXT NOT NULL,
        achieved_level TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sportabzeichen_standards_discipline ON sportabzeichen_standards(discipline_id);
      CREATE INDEX IF NOT EXISTS idx_sportabzeichen_standards_gender ON sportabzeichen_standards(gender);
      CREATE INDEX IF NOT EXISTS idx_sportabzeichen_standards_age ON sportabzeichen_standards(age_min, age_max);
      CREATE INDEX IF NOT EXISTS idx_sportabzeichen_results_student ON sportabzeichen_results(student_id);
      CREATE INDEX IF NOT EXISTS idx_sportabzeichen_results_test_date ON sportabzeichen_results(test_date);
    `);
  }

  async down(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      DROP TABLE IF EXISTS sportabzeichen_results;
      DROP TABLE IF EXISTS sportabzeichen_standards;
    `);
  }
}
