/**
 * Game Entry Metadata Migration
 * Adds stable built-in identity and optional video links to game entries.
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

type TableInfoRow = {
  name: string;
};

export class GameEntryMetadataMigration implements Migration {
  version = 25;
  name = 'game_entry_metadata';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();
    const tableInfo = db.prepare('PRAGMA table_info(game_entries)').all() as TableInfoRow[];
    const existingColumns = new Set(tableInfo.map((column) => column.name));

    if (!existingColumns.has('video_url')) {
      db.exec('ALTER TABLE game_entries ADD COLUMN video_url TEXT;');
    }

    if (!existingColumns.has('builtin_key')) {
      db.exec('ALTER TABLE game_entries ADD COLUMN builtin_key TEXT;');
    }

    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_game_entries_builtin_key ON game_entries(builtin_key);');
  }

  async down(): Promise<void> {
    // SQLite does not support dropping columns without table rebuild.
  }
}
