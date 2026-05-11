/**
 * Attendance Late Minutes Migration
 * Adds optional late duration to lesson attendance records.
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

type TableInfoRow = {
  name: string;
};

export class AttendanceLateMinutesMigration implements Migration {
  version = 24;
  name = 'attendance_late_minutes';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();
    const tableInfo = db.prepare('PRAGMA table_info(attendance_records)').all() as TableInfoRow[];
    const existingColumns = new Set(tableInfo.map((column) => column.name));

    if (!existingColumns.has('late_minutes')) {
      db.exec('ALTER TABLE attendance_records ADD COLUMN late_minutes INTEGER;');
    }
  }

  async down(): Promise<void> {
    // SQLite does not support dropping columns without table rebuild.
  }
}
