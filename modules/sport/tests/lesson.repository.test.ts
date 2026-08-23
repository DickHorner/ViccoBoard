import { ClassGroupRepository } from '../src/repositories/class-group.repository';
import { LessonRepository } from '../src/repositories/lesson.repository';
import {
  InitialSchemaMigration,
  LessonRandomStudentHistoryMigration,
  SQLiteStorage
} from '@viccoboard/storage/node';

describe('LessonRepository', () => {
  let storage: SQLiteStorage;
  let lessonRepository: LessonRepository;
  let classGroupId: string;

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new LessonRandomStudentHistoryMigration(storage));
    await storage.migrate();

    lessonRepository = new LessonRepository(storage.getAdapter());

    const classGroupRepository = new ClassGroupRepository(storage.getAdapter());
    const classGroup = await classGroupRepository.create({
      name: '5a',
      schoolYear: '2026/2027',
      gradingScheme: 'default'
    });

    classGroupId = classGroup.id;
  });

  afterEach(async () => {
    await storage.close();
  });

  test('persists random student history across reload', async () => {
    const lesson = await lessonRepository.create({
      classGroupId,
      date: new Date('2026-09-01T08:00:00.000Z'),
      startTime: '08:00',
      durationMinutes: 45,
      lessonParts: [],
      randomStudentHistory: ['student-1'],
      attendance: []
    });

    await lessonRepository.update(lesson.id, {
      randomStudentHistory: ['student-1', 'student-2']
    });

    const reloaded = await lessonRepository.findById(lesson.id);

    expect(reloaded?.randomStudentHistory).toEqual(['student-1', 'student-2']);
  });
});
