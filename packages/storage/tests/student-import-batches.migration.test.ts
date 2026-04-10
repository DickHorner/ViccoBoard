import { StudentImportBatchesMigration } from '../src/migrations/021_student_import_batches.js';

describe('StudentImportBatchesMigration', () => {
  test('adds new student import tables and preserves legacy markers', async () => {
    const execCalls: string[] = [];
    const pragmaColumns = [
      { name: 'id' },
      { name: 'birth_year' },
      { name: 'settings' },
      { name: 'stats' },
      { name: 'public_code' }
    ];

    const fakeStorage = {
      getDatabase() {
        return {
          prepare(sql: string) {
            expect(sql).toBe('PRAGMA table_info(students)');
            return {
              all() {
                return pragmaColumns;
              }
            };
          },
          exec(sql: string) {
            execCalls.push(sql);
          }
        };
      }
    };

    const migration = new StudentImportBatchesMigration(fakeStorage as never);
    await migration.up();

    expect(execCalls.join('\n')).toContain('ALTER TABLE students ADD COLUMN date_of_birth TEXT');
    expect(execCalls.join('\n')).toContain('ALTER TABLE students ADD COLUMN legacy_dob_missing INTEGER NOT NULL DEFAULT 0');
    expect(execCalls.join('\n')).toContain('UPDATE students');
    expect(execCalls.join('\n')).toContain('CREATE TABLE IF NOT EXISTS sport_student_profiles');
    expect(execCalls.join('\n')).toContain('CREATE TABLE IF NOT EXISTS import_batches');
    expect(execCalls.join('\n')).toContain('CREATE TABLE IF NOT EXISTS import_batch_items');
    expect(execCalls.join('\n')).toContain('CREATE INDEX IF NOT EXISTS idx_import_batch_items_batch');
  });
});
