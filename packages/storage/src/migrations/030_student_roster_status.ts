import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class StudentRosterStatusMigration implements Migration {
  version = 30;
  name = 'student_roster_status';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();
    const columns = db.prepare('PRAGMA table_info(students)').all() as Array<{ name: string }>;
    if (!columns.some(column => column.name === 'inactive')) {
      db.exec('ALTER TABLE students ADD COLUMN inactive INTEGER NOT NULL DEFAULT 0;');
    }
  }

  async down(): Promise<void> {
    // Dropping a SQLite column would require rebuilding the table on older SQLite versions.
  }
}
