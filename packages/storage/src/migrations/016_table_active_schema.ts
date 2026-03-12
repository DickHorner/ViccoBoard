/**
 * Migration 016: Table Definition Active Flag
 *
 * Adds an `active` column to table_definitions to support
 * activate/deactivate management in the sport tables area.
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class TableActiveSchemaMigration implements Migration {
  version = 16;
  name = 'table_active_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      ALTER TABLE table_definitions ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_table_definitions_active ON table_definitions(active);
    `);
  }

  async down(): Promise<void> {
    // SQLite does not support DROP COLUMN in older versions; recreate table instead.
    const db = this.storage.getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS table_definitions_backup AS
        SELECT id, name, type, description, source, dimensions, mapping_rules,
               entries, created_at, last_modified
        FROM table_definitions;
    `);
    db.exec(`DROP INDEX IF EXISTS idx_table_definitions_active;`);
    db.exec(`DROP TABLE IF EXISTS table_definitions;`);
    db.exec(`
      ALTER TABLE table_definitions_backup RENAME TO table_definitions;
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_table_definitions_source ON table_definitions(source);
      CREATE INDEX IF NOT EXISTS idx_table_definitions_type ON table_definitions(type);
    `);
  }
}
