import { Migration } from '@viccoboard/core';
import { SQLiteStorage } from '../storage.js';

export class TournamentTeamSizeMigration implements Migration {
  version = 30;
  name = 'tournament_team_size';

  constructor(private storage: SQLiteStorage) {}

  async up(): Promise<void> {
    const db = this.storage.getDatabase();
    const columns = db.prepare('PRAGMA table_info(tournaments)').all() as Array<{ name: string }>;
    if (!columns.some(column => column.name === 'team_size')) {
      db.exec('ALTER TABLE tournaments ADD COLUMN team_size INTEGER NOT NULL DEFAULT 1;');
    }
  }

  async down(): Promise<void> {
    // Removing a SQLite column would require a table rebuild.
  }
}
