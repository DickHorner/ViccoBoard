/**
 * Save Multistop Session Use Case Tests
 * Verifies persistence logic for multi-stopwatch sessions
 */

import { SaveMultistopSessionUseCase } from '../src/use-cases/save-multistop-session.use-case.js';
import { Sport } from '@viccoboard/core';

class MockToolSessionRepository {
  private sessions: Sport.ToolSession[] = [];
  private nextId = 0;

  async create(input: {
    toolType: string;
    classGroupId?: string;
    lessonId?: string;
    sessionMetadata: Record<string, any>;
    startedAt?: Date;
    endedAt?: Date;
  }): Promise<Sport.ToolSession> {
    const now = new Date();
    const session: Sport.ToolSession = {
      id: `session-${++this.nextId}`,
      toolType: input.toolType,
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      sessionMetadata: input.sessionMetadata,
      startedAt: input.startedAt ?? now,
      endedAt: input.endedAt,
      createdAt: now,
      lastModified: now
    };
    this.sessions.push(session);
    return session;
  }

  async findByToolType(toolType: string): Promise<Sport.ToolSession[]> {
    return this.sessions.filter(s => s.toolType === toolType);
  }

  getSessions(): Sport.ToolSession[] {
    return [...this.sessions];
  }
}

describe('SaveMultistopSessionUseCase', () => {
  let useCase: SaveMultistopSessionUseCase;
  let toolSessionRepository: MockToolSessionRepository;

  beforeEach(() => {
    toolSessionRepository = new MockToolSessionRepository();
    useCase = new SaveMultistopSessionUseCase(toolSessionRepository as any);
  });

  test('saves a valid multistop session', async () => {
    const result = await useCase.execute({
      classGroupId: 'class-1',
      results: [
        { studentId: 's1', studentName: 'Alice', timeMs: 180000, laps: [] },
        { studentId: 's2', studentName: 'Bob', timeMs: 195500, laps: [] }
      ]
    });

    expect(result.id).toBeDefined();
    expect(result.toolType).toBe('multistop');
    expect(result.classGroupId).toBe('class-1');
    expect(result.sessionMetadata.results).toHaveLength(2);
    expect(result.sessionMetadata.results[0].timeMs).toBe(180000);
  });

  test('stores lessonId when provided', async () => {
    const result = await useCase.execute({
      classGroupId: 'class-1',
      lessonId: 'lesson-42',
      results: [{ studentId: 's1', studentName: 'Alice', timeMs: 90000, laps: [] }]
    });

    expect(result.lessonId).toBe('lesson-42');
  });

  test('stores laps in metadata', async () => {
    const laps = [30000, 60500, 90000];
    const result = await useCase.execute({
      classGroupId: 'class-1',
      results: [{ studentId: 's1', studentName: 'Alice', timeMs: 90000, laps }]
    });

    expect(result.sessionMetadata.results[0].laps).toEqual(laps);
  });

  test('stores capturedAt as ISO string in metadata', async () => {
    const capturedAt = new Date('2026-03-12T10:00:00.000Z');
    const result = await useCase.execute({
      classGroupId: 'class-1',
      results: [{ studentId: 's1', studentName: 'Alice', timeMs: 60000, laps: [] }],
      capturedAt
    });

    expect(result.sessionMetadata.capturedAt).toBe('2026-03-12T10:00:00.000Z');
  });

  test('rejects missing classGroupId', async () => {
    await expect(
      useCase.execute({
        classGroupId: '',
        results: [{ studentId: 's1', studentName: 'Alice', timeMs: 60000, laps: [] }]
      })
    ).rejects.toThrow('classGroupId is required');
  });

  test('rejects empty results array', async () => {
    await expect(
      useCase.execute({
        classGroupId: 'class-1',
        results: []
      })
    ).rejects.toThrow('non-empty array');
  });

  test('rejects result with missing studentId', async () => {
    await expect(
      useCase.execute({
        classGroupId: 'class-1',
        results: [{ studentId: '', studentName: 'Alice', timeMs: 60000, laps: [] }]
      })
    ).rejects.toThrow('studentId');
  });

  test('rejects negative timeMs', async () => {
    await expect(
      useCase.execute({
        classGroupId: 'class-1',
        results: [{ studentId: 's1', studentName: 'Alice', timeMs: -1, laps: [] }]
      })
    ).rejects.toThrow('Invalid timeMs');
  });

  test('persists to repository with toolType=multistop', async () => {
    await useCase.execute({
      classGroupId: 'class-1',
      results: [{ studentId: 's1', studentName: 'Alice', timeMs: 60000, laps: [] }]
    });

    const sessions = await toolSessionRepository.findByToolType('multistop');
    expect(sessions).toHaveLength(1);
  });
});
