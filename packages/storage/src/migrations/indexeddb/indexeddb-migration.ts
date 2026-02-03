export interface IndexedDBMigration {
  storage: 'indexeddb';
  version: number;
  name: string;
  up(db: IDBDatabase, tx: IDBTransaction): void;
  down?(db: IDBDatabase, tx: IDBTransaction): void;
}
