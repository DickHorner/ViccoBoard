/**
 * Migration 017: Game Database Schema
 *
 * Creates a `game_entries` table for the local sport game / exercise database.
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class GameDatabaseSchemaMigration implements Migration {
  version = 17;
  name = 'game_database_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS game_entries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        phase TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        duration INTEGER NOT NULL DEFAULT 0,
        age_group TEXT NOT NULL DEFAULT '',
        material TEXT,
        goal TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        variation TEXT,
        notes TEXT,
        sport_type TEXT,
        is_custom INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_game_entries_category ON game_entries(category);
      CREATE INDEX IF NOT EXISTS idx_game_entries_phase ON game_entries(phase);
      CREATE INDEX IF NOT EXISTS idx_game_entries_difficulty ON game_entries(difficulty);
      CREATE INDEX IF NOT EXISTS idx_game_entries_is_custom ON game_entries(is_custom);
    `);
  }

  async down(): Promise<void> {
    const db = this.storage.getDatabase();
    db.exec(`DROP TABLE IF EXISTS game_entries;`);
  }
}
