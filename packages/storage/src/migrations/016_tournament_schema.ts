/**
 * Migration 016: Tournament Schema
 *
 * Creates a `tournaments` table that stores tournament metadata including
 * teams and matches serialised as JSON.
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class TournamentSchemaMigration implements Migration {
  version = 16;
  name = 'tournament_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id TEXT PRIMARY KEY,
        class_group_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        teams TEXT NOT NULL DEFAULT '[]',
        matches TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'planning',
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (class_group_id) REFERENCES class_groups(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tournaments_class_group ON tournaments(class_group_id);
      CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
    `);
  }

  async down(): Promise<void> {
    const db = this.storage.getDatabase();
    db.exec(`DROP TABLE IF EXISTS tournaments;`);
  }
}
