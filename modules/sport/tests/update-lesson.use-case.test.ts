import { UpdateLessonUseCase } from '../src/use-cases/update-lesson.use-case.js';
import type { Lesson } from '@viccoboard/core';

const makeLesson = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 'lesson-1',
  classGroupId: 'class-1',
  date: new Date('2026-09-01T00:00:00.000Z'),
  startTime: '08:00',
  durationMinutes: 45,
  lessonParts: [],
  attendance: [],
  createdAt: new Date(),
  lastModified: new Date(),
  ...overrides
});

class MockLessonRepository {
  private lessons: Lesson[] = [];

  seed(lesson: Lesson) {
    this.lessons.push(lesson);
    return this;
  }

  async findById(id: string): Promise<Lesson | null> {
    return this.lessons.find(l => l.id === id) ?? null;
  }

  async findByClassGroup(classGroupId: string): Promise<Lesson[]> {
    return this.lessons.filter(l => l.classGroupId === classGroupId);
  }

  async update(id: string, updates: Partial<Lesson>): Promise<Lesson> {
    const idx = this.lessons.findIndex(l => l.id === id);
    if (idx === -1) throw new Error(`Entity with id ${id} not found`);
    this.lessons[idx] = { ...this.lessons[idx], ...updates, lastModified: new Date() };
    return this.lessons[idx];
  }
}

describe('UpdateLessonUseCase', () => {
  let repo: MockLessonRepository;
  let useCase: UpdateLessonUseCase;

  beforeEach(() => {
    repo = new MockLessonRepository();
    useCase = new UpdateLessonUseCase(repo as any);
  });

  test('updates title and room without overlap check', async () => {
    repo.seed(makeLesson());

    const updated = await useCase.execute({
      lessonId: 'lesson-1',
      title: 'Leichtathletik',
      room: 'Außenanlage'
    });

    expect(updated.title).toBe('Leichtathletik');
    expect(updated.room).toBe('Außenanlage');
    // Time fields unchanged
    expect(updated.startTime).toBe('08:00');
    expect(updated.durationMinutes).toBe(45);
  });

  test('trims whitespace from startTime before persisting', async () => {
    repo.seed(makeLesson());

    const updated = await useCase.execute({
      lessonId: 'lesson-1',
      startTime: '  09:30  '
    });

    expect(updated.startTime).toBe('09:30');
  });

  test('rejects invalid durationMinutes', async () => {
    repo.seed(makeLesson());

    await expect(
      useCase.execute({
        lessonId: 'lesson-1',
        durationMinutes: 60 as unknown as 45 | 90
      })
    ).rejects.toThrow('Duration must be 45 or 90 minutes');
  });

  test('rejects invalid startTime format', async () => {
    repo.seed(makeLesson());

    await expect(
      useCase.execute({ lessonId: 'lesson-1', startTime: '99:99' })
    ).rejects.toThrow('Start time must be in HH:MM format');
  });

  test('rejects startTime with invalid hour/minute ranges', async () => {
    repo.seed(makeLesson());

    await expect(
      useCase.execute({ lessonId: 'lesson-1', startTime: '25:00' })
    ).rejects.toThrow('Start time must be in HH:MM format');
  });

  test('allows update when slot does not overlap another lesson', async () => {
    const l1 = makeLesson({ id: 'lesson-1', startTime: '08:00', durationMinutes: 45 });
    const l2 = makeLesson({ id: 'lesson-2', startTime: '09:00', durationMinutes: 45 });
    repo.seed(l1).seed(l2);

    // Move l2 to 08:45 — first ends at 08:45, no overlap
    const updated = await useCase.execute({
      lessonId: 'lesson-2',
      startTime: '08:45'
    });

    expect(updated.startTime).toBe('08:45');
  });

  test('rejects update when updated slot overlaps another lesson', async () => {
    const l1 = makeLesson({ id: 'lesson-1', startTime: '08:00', durationMinutes: 90 });
    const l2 = makeLesson({ id: 'lesson-2', startTime: '10:00', durationMinutes: 45 });
    repo.seed(l1).seed(l2);

    // Moving l2 to 09:00 overlaps l1 (08:00–09:30)
    await expect(
      useCase.execute({ lessonId: 'lesson-2', startTime: '09:00' })
    ).rejects.toThrow('Lesson overlaps with an existing lesson for this class on this day');
  });

  test('does not consider the lesson itself when checking for overlaps (self-check guard)', async () => {
    repo.seed(makeLesson({ id: 'lesson-1', startTime: '08:00', durationMinutes: 45 }));

    // Re-sending the same startTime must not trigger self-overlap
    await expect(
      useCase.execute({ lessonId: 'lesson-1', startTime: '08:00', title: 'New title' })
    ).resolves.toBeDefined();
  });

  test('throws when lessonId does not exist', async () => {
    await expect(
      useCase.execute({ lessonId: 'ghost-id', startTime: '08:00' })
    ).rejects.toThrow('Lesson not found');
  });
});

