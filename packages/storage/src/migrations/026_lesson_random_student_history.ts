/**
 * Lesson Random Student History Migration
 * Adds persisted local random-student selection history to lessons.
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

type TableInfoRow = {
  name: string;
};

export class LessonRandomStudentHistoryMigration implements Migration {
  version = 26;
  name = 'lesson_random_student_history';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();
    const tableInfo = db.prepare('PRAGMA table_info(lessons)').all() as TableInfoRow[];
    const existingColumns = new Set(tableInfo.map((column) => column.name));

    if (!existingColumns.has('random_student_history')) {
      db.exec('ALTER TABLE lessons ADD COLUMN random_student_history TEXT;');
    }
  }

  async down(): Promise<void> {
    // SQLite does not support dropping columns without table rebuild.
  }
}
