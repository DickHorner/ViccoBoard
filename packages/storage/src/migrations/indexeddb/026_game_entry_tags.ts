import type { IndexedDBMigration } from './indexeddb-migration.js';

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

function legacyTags(category: unknown, sportType: unknown): string[] {
  const tags: string[] = [];
  const categoryTag = typeof category === 'string' ? CATEGORY_TAGS[category] : undefined;
  if (categoryTag) tags.push(categoryTag);

  if (typeof sportType === 'string') {
    for (const tag of sportType.split('/').map((value) => value.trim()).filter(Boolean)) {
      if (!tags.includes(tag)) tags.push(tag);
    }
  }

  return tags;
}

/** Migrates game entries from exclusive category/sport fields to free-form tags. */
export class IndexedDBGameEntryTagsMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 26;
  name = 'indexeddb_game_entry_tags';

  up(db: IDBDatabase, tx: IDBTransaction): void {
    if (!db.objectStoreNames.contains('game_entries')) return;

    const store = tx.objectStore('game_entries');
    if (store.indexNames.contains('category')) {
      store.deleteIndex('category');
    }

    const request = store.openCursor();

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;

      const entry = cursor.value as Record<string, unknown>;
      if (entry.tags === undefined) {
        entry.tags = JSON.stringify(legacyTags(entry.category, entry.sport_type));
      }
      delete entry.category;
      delete entry.sport_type;
      cursor.update(entry);
      cursor.continue();
    };
  }
}
