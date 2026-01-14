/**
 * Initial Database Schema Migration
 * Creates core tables for ViccoBoard
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage';

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
        birth_year INTEGER,
        gender TEXT,
        photo_uri TEXT,
        email TEXT,
        parent_email TEXT,
        phone TEXT,
        class_group_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (class_group_id) REFERENCES class_groups(id) ON DELETE CASCADE
      )
    `);

    // Lessons
    db.exec(`
      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        class_group_id TEXT NOT NULL,
        date TEXT NOT NULL,
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
      DROP TABLE IF EXISTS students;
      DROP TABLE IF EXISTS class_groups;
      DROP TABLE IF EXISTS teacher_accounts;
      DROP TABLE IF EXISTS backups;
      DROP TABLE IF EXISTS templates;
    `);
  }
}