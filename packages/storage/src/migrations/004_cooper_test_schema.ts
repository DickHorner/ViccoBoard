/**
 * Cooper Test Schema Migration
 * Creates tables for Cooper test configs and grading table definitions
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage';

export class CooperTestSchemaMigration implements Migration {
  version = 4;
  name = 'cooper_test_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS table_definitions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        source TEXT NOT NULL,
        dimensions TEXT NOT NULL,
        mapping_rules TEXT NOT NULL,
        entries TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS cooper_test_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sport_type TEXT NOT NULL,
        distance_unit TEXT NOT NULL,
        lap_length_meters REAL NOT NULL,
        grading_table_id TEXT,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (grading_table_id) REFERENCES table_definitions(id) ON DELETE SET NULL
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_cooper_configs_sport_type ON cooper_test_configs(sport_type);
      CREATE INDEX IF NOT EXISTS idx_cooper_configs_source ON cooper_test_configs(source);
      CREATE INDEX IF NOT EXISTS idx_table_definitions_source ON table_definitions(source);
      CREATE INDEX IF NOT EXISTS idx_table_definitions_type ON table_definitions(type);
    `);
  }

  async down(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      DROP TABLE IF EXISTS cooper_test_configs;
      DROP TABLE IF EXISTS table_definitions;
    `);
  }
}
