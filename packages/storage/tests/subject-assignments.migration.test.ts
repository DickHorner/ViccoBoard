import 'fake-indexeddb/auto';
import {
  InitialSchemaMigration,
  SQLiteStorage,
  SubjectAssignmentsMigration
} from '../src/node';
import { IndexedDBStorage } from '../src/indexeddb.storage';
import { IndexedDBInitialSchemaMigration } from '../src/migrations/indexeddb/001_initial_schema';
import { IndexedDBPlanningBlocksMigration } from '../src/migrations/indexeddb/024_planning_blocks';
import { IndexedDBSubjectAssignmentsMigration } from '../src/migrations/indexeddb/027_subject_assignments';

describe('subject assignment migrations', () => {
  it('migrates SQLite class profiles into subjects and lesson assignments', async () => {
    const storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    await storage.migrate();

    const now = new Date().toISOString();
    storage.getDatabase().prepare(`
      INSERT INTO class_groups (
        id, name, school_year, subject_profile, created_at, last_modified
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run('class-1', '9a', '2026/2027', JSON.stringify('sport'), now, now);

    storage.getDatabase().prepare(`
      INSERT INTO lessons (
        id, class_group_id, date, start_time, duration_minutes, created_at, last_modified
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('lesson-1', 'class-1', '2026-09-01T08:00:00.000Z', '08:00', 45, now, now);

    storage.registerMigration(new SubjectAssignmentsMigration(storage));
    await storage.migrate();

    const subject = storage.getDatabase()
      .prepare('SELECT id, name, workspace_profile FROM subjects WHERE id = ?')
      .get('subject:legacy:sport') as {
        id: string;
        name: string;
        workspace_profile: string;
      };
    const lesson = storage.getDatabase()
      .prepare('SELECT subject_id FROM lessons WHERE id = ?')
      .get('lesson-1') as { subject_id: string };
    const classColumns = storage.getDatabase()
      .prepare('PRAGMA table_info(class_groups)')
      .all() as Array<{ name: string }>;

    expect(subject).toEqual({
      id: 'subject:legacy:sport',
      name: 'Sport',
      workspace_profile: 'sport'
    });
    expect(lesson.subject_id).toBe(subject.id);
    expect(classColumns.map((column) => column.name)).not.toContain('subject_profile');

    await storage.close();
  });

  it('migrates IndexedDB lessons and planning blocks to the same subject', async () => {
    const databaseName = 'viccoboard-subject-assignment-test';

    const oldStorage = new IndexedDBStorage({ databaseName });
    oldStorage.registerMigration(new IndexedDBInitialSchemaMigration());
    oldStorage.registerMigration(new IndexedDBPlanningBlocksMigration());
    await oldStorage.initialize('');

    const oldAdapter = oldStorage.getAdapter();
    await oldAdapter.insert('class_groups', {
      id: 'class-1',
      name: '9a',
      school_year: '2026/2027',
      subject_profile: JSON.stringify('sport'),
      created_at: '2026-09-01T08:00:00.000Z',
      last_modified: '2026-09-01T08:00:00.000Z'
    });
    await oldAdapter.insert('lessons', {
      id: 'lesson-1',
      class_group_id: 'class-1',
      date: '2026-09-01T08:00:00.000Z',
      start_time: '08:00',
      duration_minutes: 45,
      created_at: '2026-09-01T08:00:00.000Z',
      last_modified: '2026-09-01T08:00:00.000Z'
    });
    await oldAdapter.insert('planning_blocks', {
      id: 'block-1',
      class_group_id: 'class-1',
      title: 'Basketball',
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      created_at: '2026-09-01T08:00:00.000Z',
      last_modified: '2026-09-01T08:00:00.000Z'
    });
    await oldStorage.close();

    const migratedStorage = new IndexedDBStorage({ databaseName });
    migratedStorage.registerMigration(new IndexedDBInitialSchemaMigration());
    migratedStorage.registerMigration(new IndexedDBPlanningBlocksMigration());
    migratedStorage.registerMigration(new IndexedDBSubjectAssignmentsMigration());
    await migratedStorage.initialize('');

    const adapter = migratedStorage.getAdapter();
    const subject = await adapter.getById<Record<string, unknown>>('subjects', 'subject:legacy:sport');
    const lesson = await adapter.getById<Record<string, unknown>>('lessons', 'lesson-1');
    const block = await adapter.getById<Record<string, unknown>>('planning_blocks', 'block-1');
    const classGroup = await adapter.getById<Record<string, unknown>>('class_groups', 'class-1');

    expect(subject?.name).toBe('Sport');
    expect(subject?.workspace_profile).toBe('sport');
    expect(lesson?.subject_id).toBe('subject:legacy:sport');
    expect(block?.subject_id).toBe('subject:legacy:sport');
    expect(classGroup?.subject_profile).toBeUndefined();

    await migratedStorage.close();
    indexedDB.deleteDatabase(databaseName);
  });
});
