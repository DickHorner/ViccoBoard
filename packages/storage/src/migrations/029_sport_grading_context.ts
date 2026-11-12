import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

type TableInfoRow = { name: string };

export class SportGradingContextMigration implements Migration {
  version = 29;
  name = 'sport_grading_context';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    const classColumns = db.prepare('PRAGMA table_info(class_groups)').all() as TableInfoRow[];
    if (!classColumns.some((column) => column.name === 'grade_level')) {
      db.exec('ALTER TABLE class_groups ADD COLUMN grade_level INTEGER;');
    }

    const sportProfileColumns = db.prepare('PRAGMA table_info(sport_student_profiles)').all() as TableInfoRow[];
    if (!sportProfileColumns.some((column) => column.name === 'body_height_cm')) {
      db.exec('ALTER TABLE sport_student_profiles ADD COLUMN body_height_cm REAL;');
    }
  }

  async down(): Promise<void> {
    // SQLite column removal would require table rebuilds.
  }
}
