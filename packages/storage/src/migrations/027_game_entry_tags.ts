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

    if (!existingColumns.has('category')) {
      return;
    }

    const rows = db.prepare(`
      SELECT
        id, name, category, phase, difficulty, duration, age_group, material, goal,
        description, variation, notes, sport_type, video_url, builtin_key, is_custom,
        created_at, last_modified
      FROM game_entries
    `).all() as Array<LegacyGameEntryRow & {
      name: string;
      phase: string;
      difficulty: string;
      duration: number;
      age_group: string;
      material: string | null;
      goal: string;
      description: string;
      variation: string | null;
      notes: string | null;
      video_url: string | null;
      builtin_key: string | null;
      is_custom: number;
      created_at: string;
      last_modified: string;
    }>;

    const migrate = db.transaction(() => {
      db.exec('ALTER TABLE game_entries RENAME TO game_entries_legacy;');
      db.exec(`
        CREATE TABLE game_entries (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          tags TEXT NOT NULL DEFAULT '[]',
          phase TEXT NOT NULL,
          difficulty TEXT NOT NULL,
          duration INTEGER NOT NULL DEFAULT 0,
          age_group TEXT NOT NULL DEFAULT '',
          material TEXT,
          goal TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '',
          variation TEXT,
          notes TEXT,
          video_url TEXT,
          builtin_key TEXT,
          is_custom INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          last_modified TEXT NOT NULL
        );
      `);

      const insert = db.prepare(`
        INSERT INTO game_entries (
          id, name, tags, phase, difficulty, duration, age_group, material, goal,
          description, variation, notes, video_url, builtin_key, is_custom,
          created_at, last_modified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const row of rows) {
        insert.run(
          row.id,
          row.name,
          JSON.stringify(legacyTags(row.category, row.sport_type)),
          row.phase,
          row.difficulty,
          row.duration,
          row.age_group,
          row.material,
          row.goal,
          row.description,
          row.variation,
          row.notes,
          row.video_url,
          row.builtin_key,
          row.is_custom,
          row.created_at,
          row.last_modified
        );
      }

      db.exec('DROP TABLE game_entries_legacy;');
      db.exec(`
        CREATE INDEX idx_game_entries_phase ON game_entries(phase);
        CREATE INDEX idx_game_entries_difficulty ON game_entries(difficulty);
        CREATE INDEX idx_game_entries_is_custom ON game_entries(is_custom);
        CREATE UNIQUE INDEX idx_game_entries_builtin_key ON game_entries(builtin_key);
      `);
    });

    migrate();
  }

  async down(): Promise<void> {
    // SQLite does not support dropping columns without table rebuild.
  }
}
