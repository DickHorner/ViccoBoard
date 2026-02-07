/**
 * Class Group Color Migration
 * Adds color column to class_groups
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class ClassGroupColorMigration implements Migration {
  version = 8;
  name = 'class_group_color';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      ALTER TABLE class_groups ADD COLUMN color TEXT;
    `);
  }

  async down(): Promise<void> {
    // SQLite does not support dropping columns without table rebuild.
  }
}
