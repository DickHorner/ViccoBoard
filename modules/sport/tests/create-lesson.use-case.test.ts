import { CreateLessonUseCase } from '../src/use-cases/create-lesson.use-case';
import { ClassGroupRepository } from '../src/repositories/class-group.repository';
import { LessonRepository } from '../src/repositories/lesson.repository';
import { SQLiteStorage, InitialSchemaMigration } from '@viccoboard/storage/node';

describe('CreateLessonUseCase', () => {
  let storage: SQLiteStorage;
  let lessonRepository: LessonRepository;
  let useCase: CreateLessonUseCase;
  let classGroupId: string;

  beforeEach(async () => {
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    await storage.migrate();

    lessonRepository = new LessonRepository(storage.getAdapter());
    useCase = new CreateLessonUseCase(lessonRepository);

    const classGroupRepository = new ClassGroupRepository(storage.getAdapter());
    const classGroup = await classGroupRepository.create({
      name: '5a',
      schoolYear: '2025/2026',
      gradingScheme: 'default'
    });

    classGroupId = classGroup.id;
  });

  afterEach(async () => {
    await storage.close();
  });

  test('creates a valid lesson with startTime and durationMinutes', async () => {
    const lesson = await useCase.execute({
      classGroupId,
      date: new Date('2026-09-01T00:00:00.000Z'),
      startTime: '08:00',
      durationMinutes: 45,
      title: 'Sprinttraining',
      room: 'Halle 1'
    });

    expect(lesson.id).toBeDefined();
    expect(lesson.startTime).toBe('08:00');
    expect(lesson.durationMinutes).toBe(45);
    expect(lesson.title).toBe('Sprinttraining');
    expect(lesson.room).toBe('Halle 1');
  });

  test('rejects an invalid duration', async () => {
    await expect(
      useCase.execute({
        classGroupId,
        date: new Date('2026-09-01T00:00:00.000Z'),
        startTime: '08:00',
        durationMinutes: 60 as unknown as 45 | 90
      })
    ).rejects.toThrow('Duration must be 45 or 90 minutes');
  });

  test('rejects missing startTime', async () => {
    await expect(
      useCase.execute({
        classGroupId,
        date: new Date('2026-09-01T00:00:00.000Z'),
        startTime: '',
        durationMinutes: 45
      })
    ).rejects.toThrow('Start time is required');
  });

  test('rejects overlapping lessons for same class on same day', async () => {
    await useCase.execute({
      classGroupId,
      date: new Date('2026-09-01T00:00:00.000Z'),
      startTime: '08:00',
      durationMinutes: 90
    });

    await expect(
      useCase.execute({
        classGroupId,
        date: new Date('2026-09-01T00:00:00.000Z'),
        startTime: '08:30',
        durationMinutes: 45
      })
    ).rejects.toThrow('Lesson overlaps with an existing lesson for this class on this day');
  });

  test('allows non-overlapping lessons for same class on same day', async () => {
    await useCase.execute({
      classGroupId,
      date: new Date('2026-09-01T00:00:00.000Z'),
      startTime: '08:00',
      durationMinutes: 45
    });

    const secondLesson = await useCase.execute({
      classGroupId,
      date: new Date('2026-09-01T00:00:00.000Z'),
      startTime: '08:45',
      durationMinutes: 45
    });

    expect(secondLesson.id).toBeDefined();
    expect(secondLesson.startTime).toBe('08:45');
  });
});
