import {
  GradingSchemaMigration,
  InitialSchemaMigration,
  SQLiteStorage,
  ToolSessionsSchemaMigration
} from '@viccoboard/storage/node';
import { Sport } from '@viccoboard/core';

import { ClassGroupRepository } from '../src/repositories/class-group.repository';
import { GradeCategoryRepository } from '../src/repositories/grade-category.repository';
import { PerformanceEntryRepository } from '../src/repositories/performance-entry.repository';
import { StudentRepository } from '../src/repositories/student.repository';
import { ToolSessionRepository } from '../src/repositories/tool-session.repository';
import { SaveSportExamSessionUseCase } from '../src/use-cases/save-sport-exam-session.use-case';

describe('SaveSportExamSessionUseCase', () => {
  let storage: SQLiteStorage;
  let performanceRepository: PerformanceEntryRepository;
  let toolSessionRepository: ToolSessionRepository;
  let useCase: SaveSportExamSessionUseCase;
  let classGroupId: string;
  let categoryId: string;
  let student1Id: string;
  let student2Id: string;

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new ToolSessionsSchemaMigration(storage));
    await storage.migrate();

    const adapter = storage.getAdapter();
    performanceRepository = new PerformanceEntryRepository(adapter);
    toolSessionRepository = new ToolSessionRepository(adapter);
    useCase = new SaveSportExamSessionUseCase(toolSessionRepository, performanceRepository);

    const classGroup = await new ClassGroupRepository(adapter).create({
      name: '9a',
      schoolYear: '2026/2027',
      gradingScheme: 'default'
    });
    classGroupId = classGroup.id;

    const category = await new GradeCategoryRepository(adapter).create({
      classGroupId,
      name: 'Korbwürfe',
      type: Sport.GradeCategoryType.Performance,
      weight: 20,
      configuration: {
        type: 'performance',
        measurementType: 'number',
        measurementLabel: 'Treffer',
        sport: 'Basketball',
        discipline: 'Korbwürfe',
        normalization: 'raw'
      }
    });
    categoryId = category.id;

    const studentRepository = new StudentRepository(adapter);
    student1Id = (await studentRepository.create({
      classGroupId,
      firstName: 'Ada',
      lastName: 'Lovelace',
      dateOfBirth: '2011-01-01',
      gender: 'f'
    })).id;
    student2Id = (await studentRepository.create({
      classGroupId,
      firstName: 'Alan',
      lastName: 'Turing',
      dateOfBirth: '2011-02-01',
      gender: 'm'
    })).id;
  });

  afterEach(async () => {
    await storage.close();
  });

  test('creates one sport-exam session and performance entries for participants', async () => {
    const session = await useCase.execute({
      classGroupId,
      categoryId,
      tableId: 'master-table',
      examDate: '2026-11-12',
      announced: true,
      sport: 'Basketball',
      discipline: 'Korbwürfe',
      measurementType: 'number',
      normalization: 'raw',
      unit: 'Treffer',
      entries: [
        {
          studentId: student1Id,
          state: 'ready',
          rawValue: '15',
          value: 15,
          calculatedGrade: 1
        },
        {
          studentId: student2Id,
          state: 'absent',
          attendanceSource: 'calendar'
        }
      ]
    });

    expect(session.toolType).toBe('sport-exam');
    expect(session.classGroupId).toBe(classGroupId);

    const metadata = session.sessionMetadata as Record<string, any>;
    expect(metadata.entryCount).toBe(1);
    expect(metadata.studentStates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          studentId: student2Id,
          state: 'absent',
          requiresAttest: true
        })
      ])
    );

    const entries = await performanceRepository.findByCategory(categoryId);
    expect(entries).toHaveLength(1);
    expect(entries[0].studentId).toBe(student1Id);
    expect(Number(entries[0].calculatedGrade)).toBe(1);
    expect(entries[0].metadata?.sessionId).toBe(session.id);
  });

  test('persists criteria scores and summary for a criteria-based sport exam', async () => {
    const session = await useCase.execute({
      classGroupId,
      categoryId,
      assessmentType: 'criteria',
      examDate: '2026-11-12',
      announced: true,
      entries: [
        {
          studentId: student1Id,
          state: 'ready',
          criterionScores: {
            anticipation: 3,
            passing: 2,
            communication: 3
          },
          criteriaTotalPoints: 8,
          criteriaMaxPoints: 9,
          criteriaPercentage: 88.89,
          calculatedGrade: 2
        }
      ]
    });

    const entries = await performanceRepository.findByCategory(categoryId);
    expect(entries).toHaveLength(1);
    expect(entries[0].measurements.criteria).toEqual({
      anticipation: 3,
      passing: 2,
      communication: 3
    });
    expect(entries[0].measurements.totalPoints).toBe(8);
    expect(entries[0].measurements.maxPoints).toBe(9);
    expect(Number(entries[0].calculatedGrade)).toBe(2);
    expect((session.sessionMetadata as Record<string, unknown>).assessmentType).toBe('criteria');
  });

  test('stores missing sports kit as grade 6 without a fabricated measurement', async () => {
    await useCase.execute({
      classGroupId,
      categoryId,
      examDate: '2026-11-12',
      announced: true,
      measurementType: 'number',
      normalization: 'raw',
      entries: [
        {
          studentId: student1Id,
          state: 'missing-kit'
        }
      ]
    });

    const entries = await performanceRepository.findByCategory(categoryId);
    expect(entries).toHaveLength(1);
    expect(Number(entries[0].calculatedGrade)).toBe(6);
    expect(entries[0].measurements).toEqual({ state: 'missing-kit' });
  });

  test('does not require an attest for an unannounced absence', async () => {
    const session = await useCase.execute({
      classGroupId,
      categoryId,
      examDate: '2026-11-12',
      announced: false,
      measurementType: 'number',
      normalization: 'raw',
      entries: [
        {
          studentId: student1Id,
          state: 'absent'
        }
      ]
    });

    const metadata = session.sessionMetadata as Record<string, any>;
    expect(metadata.studentStates[0].requiresAttest).toBe(false);
    expect(metadata.entryCount).toBe(0);
  });

  test('rejects duplicate students', async () => {
    await expect(useCase.execute({
      classGroupId,
      categoryId,
      examDate: '2026-11-12',
      announced: false,
      measurementType: 'number',
      normalization: 'raw',
      entries: [
        { studentId: student1Id, state: 'absent' },
        { studentId: student1Id, state: 'passive' }
      ]
    })).rejects.toThrow('Duplicate student entry');
  });
});
