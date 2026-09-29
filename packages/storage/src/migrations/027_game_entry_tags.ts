/**
 * Game Entry Tags Migration
 * Replaces the legacy single category/sport fields with a persisted tag list.
 */

import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

type TableInfoRow = {
  name: string;
};

type LegacyGameEntryRow = {
  id: string;
  category: string | null;
  sport_type: string | null;
  tags: string | null;
};

const CATEGORY_TAGS: Record<string, string> = {
  erwaermung: 'Aufwärmen',
  ballspiel: 'Ballspiel',
  reaktionsspiel: 'Reaktion',
  laufspiel: 'Laufspiel',
  koordination: 'Koordination',
  kooperation: 'Kooperation',
  entspannung: 'Entspannung',
  kraft: 'Kraft',
  ausdauer: 'Ausdauer',
  schnelligkeit: 'Schnelligkeit',
  beweglichkeit: 'Beweglichkeit',
  sonstiges: 'Sonstiges'
};

function legacyTags(category: string | null, sportType: string | null): string[] {
  const tags: string[] = [];
  const categoryTag = category ? CATEGORY_TAGS[category] : undefined;
  if (categoryTag) tags.push(categoryTag);

  for (const tag of (sportType ?? '').split('/').map((value) => value.trim()).filter(Boolean)) {
    if (!tags.includes(tag)) tags.push(tag);
  }

  return tags;
}

export class GameEntryTagsMigration implements Migration {
  version = 27;
  name = 'game_entry_tags';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();
    const tableInfo = db.prepare('PRAGMA table_info(game_entries)').all() as TableInfoRow[];
    const existingColumns = new Set(tableInfo.map((column) => column.name));

    if (!existingColumns.has('tags')) {
      db.exec("ALTER TABLE game_entries ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';");
    }

    const rows = db
      .prepare('SELECT id, category, sport_type, tags FROM game_entries')
      .all() as LegacyGameEntryRow[];
    const update = db.prepare('UPDATE game_entries SET tags = ? WHERE id = ?');

    for (const row of rows) {
      if (row.tags && row.tags !== '[]') continue;
      update.run(JSON.stringify(legacyTags(row.category, row.sport_type)), row.id);
    }
  }

  async down(): Promise<void> {
    // SQLite does not support dropping columns without table rebuild.
  }
}
