import 'fake-indexeddb/auto';
import {
  GameDatabaseSchemaMigration,
  GameEntryMetadataMigration,
  GameEntryTagsMigration,
  InitialSchemaMigration,
  SQLiteStorage
} from '../src/node';
import { IndexedDBStorage } from '../src/indexeddb.storage';
import { IndexedDBGameDatabaseSchemaMigration } from '../src/migrations/indexeddb/019_game_database_schema';
import { IndexedDBGameEntryTagsMigration } from '../src/migrations/indexeddb/026_game_entry_tags';

describe('game entry tags migrations', () => {
  it('backfills SQLite tags from legacy category and sport type', async () => {
    const storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GameDatabaseSchemaMigration(storage));
    storage.registerMigration(new GameEntryMetadataMigration(storage));
    await storage.migrate();

    storage.getDatabase().prepare(`
      INSERT INTO game_entries (
        id, name, category, phase, difficulty, duration, age_group, goal, description,
        sport_type, is_custom, created_at, last_modified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'legacy-1',
      'Give and Go',
      'reaktionsspiel',
      'hauptteil',
      'fortgeschrittene',
      0,
      'Klasse 7–10',
      'Reaktion',
      'Beschreibung',
      'Basketball',
      0,
      new Date().toISOString(),
      new Date().toISOString()
    );

    storage.registerMigration(new GameEntryTagsMigration(storage));
    await storage.migrate();

    const row = storage.getDatabase()
      .prepare('SELECT tags FROM game_entries WHERE id = ?')
      .get('legacy-1') as { tags: string };

    expect(JSON.parse(row.tags)).toEqual(['Reaktion', 'Basketball']);

    const columns = storage.getDatabase()
      .prepare('PRAGMA table_info(game_entries)')
      .all() as Array<{ name: string }>;
    expect(columns.map((column) => column.name)).not.toContain('category');
    expect(columns.map((column) => column.name)).not.toContain('sport_type');

    await storage.close();
  });

  it('backfills IndexedDB tags and removes legacy classification fields', async () => {
    const databaseName = 'viccoboard-game-entry-tags-test';
    const oldStorage = new IndexedDBStorage({ databaseName });
    oldStorage.registerMigration(new IndexedDBGameDatabaseSchemaMigration());
    await oldStorage.initialize('');

    await oldStorage.getAdapter().insert('game_entries', {
      id: 'legacy-1',
      name: 'Give and Go',
      category: 'reaktionsspiel',
      sport_type: 'Fitness/Turnen'
    });
    await oldStorage.close();

    const migratedStorage = new IndexedDBStorage({ databaseName });
    migratedStorage.registerMigration(new IndexedDBGameDatabaseSchemaMigration());
    migratedStorage.registerMigration(new IndexedDBGameEntryTagsMigration());
    await migratedStorage.initialize('');

    const row = await migratedStorage.getAdapter().getById<Record<string, unknown>>('game_entries', 'legacy-1');
    expect(JSON.parse(row?.tags as string)).toEqual(['Reaktion', 'Fitness', 'Turnen']);
    expect(row?.category).toBeUndefined();
    expect(row?.sport_type).toBeUndefined();

    await migratedStorage.close();
    indexedDB.deleteDatabase(databaseName);
  });
});
