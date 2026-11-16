import {
  InitialSchemaMigration,
  SQLiteStorage
} from '../src/node';
import { TournamentSchemaMigration } from '../src/migrations/016_tournament_schema';
import { TournamentTeamSizeMigration } from '../src/migrations/030_tournament_team_size';
import { StudentRosterStatusMigration } from '../src/migrations/031_student_roster_status';

describe('student roster SQLite migration', () => {
  it('applies after the existing version-30 tournament migration', async () => {
    const storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');

    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new TournamentSchemaMigration(storage));
    storage.registerMigration(new TournamentTeamSizeMigration(storage));
    await storage.migrate();

    const before = storage.getDatabase()
      .prepare('PRAGMA table_info(students)')
      .all() as Array<{ name: string }>;
    expect(before.some(column => column.name === 'inactive')).toBe(false);

    storage.registerMigration(new StudentRosterStatusMigration(storage));
    await storage.migrate();

    const after = storage.getDatabase()
      .prepare('PRAGMA table_info(students)')
      .all() as Array<{ name: string }>;
    expect(after.some(column => column.name === 'inactive')).toBe(true);

    const migrationVersions = storage.getDatabase()
      .prepare('SELECT version FROM migrations ORDER BY version')
      .all() as Array<{ version: number }>;
    expect(migrationVersions.map(row => row.version)).toEqual([1, 16, 30, 31]);

    await storage.close();
  });
});
