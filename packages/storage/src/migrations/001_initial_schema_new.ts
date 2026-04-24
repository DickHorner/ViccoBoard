/**
 * Initial Database Schema Migration
 * Creates core tables for ViccoBoard
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class InitialSchemaMigration implements Migration {
  version = 1;
  name = 'initial_schema';
  
  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    // Synchronously execute all migrations
    const db = this.storage.getDatabase();
    
    // Teacher Account
    db.exec(`
      CREATE TABLE IF NOT EXISTS teacher_accounts (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        pin_enabled INTEGER NOT NULL DEFAULT 0,
        pin_hash TEXT,
        password_hash TEXT,
        database_password_hash TEXT,
        session_timeout_minutes INTEGER NOT NULL DEFAULT 30,
        biometric_enabled INTEGER NOT NULL DEFAULT 0,
        lock_after_minutes INTEGER NOT NULL DEFAULT 5
      )
    `);

    // Class Groups
    db.exec(`
      CREATE TABLE IF NOT EXISTS class_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        school_year TEXT NOT NULL,
        color TEXT,
        archived INTEGER NOT NULL DEFAULT 0,
        state TEXT,
        holiday_calendar_ref TEXT,
        grading_scheme TEXT,
        subject_profile TEXT,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL
      )
    `);

    // Students
    db.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        date_of_birth TEXT,
        gender TEXT,
        photo_uri TEXT,
        email TEXT,
        parent_email TEXT,
        phone TEXT,
        class_group_id TEXT NOT NULL,
        legacy_dob_missing INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (class_group_id) REFERENCES class_groups(id) ON DELETE CASCADE
      )
    `);

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
      )
    `);

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
      )
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
      )
    `);

    // Lessons
    db.exec(`
      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        class_group_id TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL DEFAULT '08:00',
        duration_minutes INTEGER NOT NULL DEFAULT 45,
        title TEXT,
        room TEXT,
        random_student_seed TEXT,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (class_group_id) REFERENCES class_groups(id) ON DELETE CASCADE
      )
    `);

    // Lesson Parts
    db.exec(`
      CREATE TABLE IF NOT EXISTS lesson_parts (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL,
        description TEXT NOT NULL,
        duration INTEGER,
        type TEXT,
        order_index INTEGER NOT NULL,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
      )
    `);

    // Attendance Records
    db.exec(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        status TEXT NOT NULL,
        reason TEXT,
        notes TEXT,
        timestamp TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        exported INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE(lesson_id, student_id)
      )
    `);

    // Backups
    db.exec(`
      CREATE TABLE IF NOT EXISTS backups (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        version TEXT NOT NULL,
        description TEXT,
        encrypted INTEGER NOT NULL,
        size INTEGER NOT NULL,
        file_path TEXT NOT NULL
      )
    `);

    // Templates
    db.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL
      )
    `);

    // Create indexes for better query performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_students_class_group ON students(class_group_id);
      CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
      CREATE INDEX IF NOT EXISTS idx_sport_student_profiles_student ON sport_student_profiles(student_id);
      CREATE INDEX IF NOT EXISTS idx_import_batches_source_type ON import_batches(source_type);
      CREATE INDEX IF NOT EXISTS idx_import_batch_items_batch ON import_batch_items(batch_id);
      CREATE INDEX IF NOT EXISTS idx_lessons_class_group ON lessons(class_group_id);
      CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(date);
      CREATE INDEX IF NOT EXISTS idx_attendance_lesson ON attendance_records(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
    `);
  }

  async down(): Promise<void> {
    const db = this.storage.getDatabase();
    
    db.exec(`
      DROP TABLE IF EXISTS attendance_records;
      DROP TABLE IF EXISTS lesson_parts;
      DROP TABLE IF EXISTS lessons;
      DROP TABLE IF EXISTS import_batch_items;
      DROP TABLE IF EXISTS import_batches;
      DROP TABLE IF EXISTS sport_student_profiles;
      DROP TABLE IF EXISTS students;
      DROP TABLE IF EXISTS class_groups;
      DROP TABLE IF EXISTS teacher_accounts;
      DROP TABLE IF EXISTS backups;
      DROP TABLE IF EXISTS templates;
    `);
  }
}
