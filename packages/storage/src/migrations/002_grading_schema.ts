/**
 * Grading Schema Migration
 * Creates tables for grading schemes, categories, and performance entries
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class GradingSchemaMigration implements Migration {
  version = 2;
  name = 'grading_schema';
  
  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();
    
    // Grade Schemes Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS grade_schemes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        grades TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL
      )
    `);

    // Grade Categories Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS grade_categories (
        id TEXT PRIMARY KEY,
        class_group_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        weight REAL NOT NULL,
        configuration TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (class_group_id) REFERENCES class_groups(id) ON DELETE CASCADE
      )
    `);

    // Performance Entries Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS performance_entries (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        measurements TEXT NOT NULL,
        calculated_grade TEXT,
        timestamp TEXT NOT NULL,
        device_info TEXT,
        comment TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES grade_categories(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_grade_categories_class_group ON grade_categories(class_group_id);
      CREATE INDEX IF NOT EXISTS idx_grade_categories_type ON grade_categories(type);
      CREATE INDEX IF NOT EXISTS idx_performance_entries_student ON performance_entries(student_id);
      CREATE INDEX IF NOT EXISTS idx_performance_entries_category ON performance_entries(category_id);
      CREATE INDEX IF NOT EXISTS idx_performance_entries_timestamp ON performance_entries(timestamp);
    `);
  }

  async down(): Promise<void> {
    const db = this.storage.getDatabase();
    
    db.exec(`
      DROP TABLE IF EXISTS performance_entries;
      DROP TABLE IF EXISTS grade_categories;
      DROP TABLE IF EXISTS grade_schemes;
    `);
  }
}
