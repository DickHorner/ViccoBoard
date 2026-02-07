/**
 * Class Group Archive Migration
 * Adds archived column to class_groups
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class ClassGroupArchiveMigration implements Migration {
  version = 9;
  name = 'class_group_archive';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      ALTER TABLE class_groups ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
    `);
  }

  async down(): Promise<void> {
    // SQLite does not support dropping columns without table rebuild.
  }
}
