/**
 * Shuttle Run Schema Migration
 * Adds tables for shuttle run configuration
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class ShuttleRunSchemaMigration implements Migration {
  version = 3;
  name = 'shuttle_run_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS shuttle_run_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        levels TEXT NOT NULL,
        audio_signals_enabled INTEGER NOT NULL DEFAULT 1,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_shuttle_run_configs_source ON shuttle_run_configs(source);
    `);
  }

  async down(): Promise<void> {
    const db = this.storage.getDatabase();
    db.exec(`
      DROP TABLE IF EXISTS shuttle_run_configs;
    `);
  }
}
