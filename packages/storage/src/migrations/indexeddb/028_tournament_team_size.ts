import type { IndexedDBMigration } from './indexeddb-migration.js';

export class IndexedDBTournamentTeamSizeMigration implements IndexedDBMigration {
  storage: 'indexeddb' = 'indexeddb';
  version = 28;
  name = 'indexeddb_tournament_team_size';

  up(db: IDBDatabase, tx: IDBTransaction): void {
    const store = tx.objectStore('tournaments');
    const request = store.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      const tournament = cursor.value as Record<string, unknown>;
      if (!Number.isInteger(tournament.team_size)) {
        cursor.update({ ...tournament, team_size: 1 });
      }
      cursor.continue();
    };
  }
}
