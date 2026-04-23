/**
 * Lesson Schedule Fields Migration
 * Adds schedule fields to lessons table for planning support.
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

type TableInfoRow = {
  name: string;
};

export class LessonScheduleFieldsMigration implements Migration {
  version = 23;
  name = 'lesson_schedule_fields';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();
    const tableInfo = db.prepare('PRAGMA table_info(lessons)').all() as TableInfoRow[];
    const existingColumns = new Set(tableInfo.map((column) => column.name));

    if (!existingColumns.has('start_time')) {
      db.exec("ALTER TABLE lessons ADD COLUMN start_time TEXT NOT NULL DEFAULT '08:00';");
    }

    if (!existingColumns.has('duration_minutes')) {
      db.exec('ALTER TABLE lessons ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 45;');
    }

    if (!existingColumns.has('title')) {
      db.exec('ALTER TABLE lessons ADD COLUMN title TEXT;');
    }

    if (!existingColumns.has('room')) {
      db.exec('ALTER TABLE lessons ADD COLUMN room TEXT;');
    }
  }

  async down(): Promise<void> {
    // SQLite does not support dropping columns without table rebuild.
  }
}
