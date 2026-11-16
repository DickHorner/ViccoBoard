import 'fake-indexeddb/auto';
import { IndexedDBStorage } from '../src/indexeddb.storage';
import { IndexedDBStudentProfileAndRosterMigration } from '../src/migrations/indexeddb/030_student_profile_and_roster';

describe('student profile and roster migration', () => {
  test('repairs existing browser databases missing long-term notes', async () => {
    const databaseName = 'viccoboard-student-profile-migration-test';

    const oldDatabase = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(databaseName, 29);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('students', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    oldDatabase.close();

    const storage = new IndexedDBStorage({ databaseName });
    storage.registerMigration(new IndexedDBStudentProfileAndRosterMigration());
    await storage.initialize('');

    expect(storage.getDatabase().version).toBe(30);
    expect(storage.getDatabase().objectStoreNames.contains('students')).toBe(true);
    expect(storage.getDatabase().objectStoreNames.contains('student_long_term_notes')).toBe(true);

    await storage.getAdapter().insert('student_long_term_notes', {
      id: 'note-1', student_id: 'student-1', school_year: '2026/2027'
    });
    const note = await storage.getAdapter().getById('student_long_term_notes', 'note-1');
    expect(note).toMatchObject({ student_id: 'student-1' });

    await storage.close();
    indexedDB.deleteDatabase(databaseName);
  });
});
