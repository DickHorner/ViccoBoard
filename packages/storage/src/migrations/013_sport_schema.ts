/**
 * SportZens Schema Migration
 * Adds SportZens APK parity fields and tables (scope v2, WOW excluded)
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class SportZensSchemaMigration implements Migration {
  version = 13;
  name = 'sportzens_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    const statements: string[] = [
      'ALTER TABLE class_groups ADD COLUMN teacher_id TEXT;',
      'ALTER TABLE class_groups ADD COLUMN grade_scheme TEXT;',
      'ALTER TABLE class_groups ADD COLUMN settings TEXT;',
      'ALTER TABLE class_groups ADD COLUMN stats TEXT;',
      'ALTER TABLE class_groups ADD COLUMN is_dirty INTEGER;',
      'ALTER TABLE class_groups ADD COLUMN version REAL;',
      'ALTER TABLE class_groups ADD COLUMN sort TEXT;',
      'ALTER TABLE class_groups ADD COLUMN student_count INTEGER;',
      'ALTER TABLE class_groups ADD COLUMN grade_category_count INTEGER;',
      'ALTER TABLE class_groups ADD COLUMN updated_at TEXT;',
      'ALTER TABLE students ADD COLUMN teacher_id TEXT;',
      'ALTER TABLE students ADD COLUMN public_code TEXT;',
      'ALTER TABLE students ADD COLUMN settings TEXT;',
      'ALTER TABLE students ADD COLUMN stats TEXT;',
      'ALTER TABLE students ADD COLUMN is_dirty INTEGER;',
      'ALTER TABLE students ADD COLUMN version REAL;',
      'ALTER TABLE grade_categories ADD COLUMN categories TEXT;',
      'ALTER TABLE grade_categories ADD COLUMN color TEXT;',
      'ALTER TABLE grade_categories ADD COLUMN deleted INTEGER;',
      'ALTER TABLE grade_categories ADD COLUMN is_dirty INTEGER;',
      'ALTER TABLE grade_categories ADD COLUMN main_category_id TEXT;',
      'ALTER TABLE grade_categories ADD COLUMN max_value REAL;',
      'ALTER TABLE grade_categories ADD COLUMN min_value REAL;',
      'ALTER TABLE grade_categories ADD COLUMN settings TEXT;',
      'ALTER TABLE grade_categories ADD COLUMN stats TEXT;',
      'ALTER TABLE grade_categories ADD COLUMN teacher_id TEXT;',
      'ALTER TABLE grade_categories ADD COLUMN updated_at TEXT;',
      'ALTER TABLE grade_categories ADD COLUMN year INTEGER;'
    ];

    for (const statement of statements) {
      db.exec(statement);
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS grades (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        teacher_id TEXT NOT NULL,
        type TEXT NOT NULL,
        year INTEGER NOT NULL,
        created_at TEXT,
        criterias TEXT,
        deleted INTEGER,
        grade TEXT,
        is_dirty INTEGER,
        main_category_id TEXT,
        name TEXT,
        total_points REAL,
        updated_at TEXT,
        weight REAL
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_grades_class_id ON grades(class_id);
      CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
      CREATE INDEX IF NOT EXISTS idx_grades_category_id ON grades(category_id);
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS sportzens_tables (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        grade_scheme TEXT NOT NULL,
        teacher_id TEXT NOT NULL,
        color TEXT,
        created_at TEXT,
        grade_scheme_direction TEXT,
        is_dirty INTEGER,
        school TEXT,
        updated_at TEXT,
        version REAL,
        visibility TEXT
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sportzens_tables_teacher_id ON sportzens_tables(teacher_id);
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS grade_weightings (
        id TEXT PRIMARY KEY,
        attendance REAL NOT NULL,
        grades REAL NOT NULL,
        remarks REAL NOT NULL,
        wow REAL NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS new_day_data (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        additional_exercises TEXT,
        exercises TEXT,
        notes TEXT
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_new_day_data_date ON new_day_data(date);
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS user_data (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        addons TEXT,
        first_name TEXT,
        invoices TEXT,
        last_name TEXT,
        settings TEXT
      )
    `);
  }

  async down(): Promise<void> {
    // SQLite does not support dropping columns without table rebuild.
    const db = this.storage.getDatabase();
    db.exec('DROP TABLE IF EXISTS grades;');
    db.exec('DROP TABLE IF EXISTS sportzens_tables;');
    db.exec('DROP TABLE IF EXISTS grade_weightings;');
    db.exec('DROP TABLE IF EXISTS new_day_data;');
    db.exec('DROP TABLE IF EXISTS user_data;');
  }
}
