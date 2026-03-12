/**
 * Migration 015: Tactics Snapshots Schema
 *
 * Creates dedicated table for tactics board snapshots.
 * Each snapshot stores board markings/annotations as JSON and a background type.
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class TacticsSnapshotsSchemaMigration implements Migration {
  version = 15;
  name = 'tactics_snapshots_schema';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS tactics_snapshots (
        id TEXT PRIMARY KEY,
        lesson_id TEXT,
        sport TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL DEFAULT '',
        version INTEGER NOT NULL DEFAULT 1,
        markings TEXT NOT NULL DEFAULT '[]',
        background TEXT NOT NULL DEFAULT 'field',
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tactics_snapshots_lesson ON tactics_snapshots(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_tactics_snapshots_created ON tactics_snapshots(created_at);
    `);
  }

  async down(): Promise<void> {
    const db = this.storage.getDatabase();
    db.exec(`DROP TABLE IF EXISTS tactics_snapshots;`);
  }
}
