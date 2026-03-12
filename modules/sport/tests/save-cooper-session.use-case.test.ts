/**
 * SaveCooperSessionUseCase tests
 *
 * Covers the happy path, sport-type mismatch, entries-with-no-distance,
 * and session metadata persistence.
 */

import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  CooperTestSchemaMigration,
  ToolSessionsSchemaMigration
} from '@viccoboard/storage/node';
import { SaveCooperSessionUseCase } from '../src/use-cases/save-cooper-session.use-case';
import { CooperTestConfigRepository } from '../src/repositories/cooper-test-config.repository';
import { PerformanceEntryRepository } from '../src/repositories/performance-entry.repository';
import { ToolSessionRepository } from '../src/repositories/tool-session.repository';
import { GradeCategoryRepository } from '../src/repositories/grade-category.repository';
import { ClassGroupRepository } from '../src/repositories/class-group.repository';
import { StudentRepository } from '../src/repositories/student.repository';
import { LessonRepository } from '../src/repositories/lesson.repository';
import { CreateLessonUseCase } from '../src/use-cases/create-lesson.use-case';
import { Sport } from '@viccoboard/core';

describe('SaveCooperSessionUseCase', () => {
  let storage: SQLiteStorage;
  let useCase: SaveCooperSessionUseCase;
  let configRepository: CooperTestConfigRepository;
  let performanceRepository: PerformanceEntryRepository;
  let toolSessionRepository: ToolSessionRepository;
  let classGroupRepository: ClassGroupRepository;
  let categoryRepository: GradeCategoryRepository;
  let studentRepository: StudentRepository;
  let createLessonUseCase: CreateLessonUseCase;

  // test data IDs
  let classGroupId: string;
  let categoryId: string;
  let runningConfigId: string;
  let student1Id: string;
  let student2Id: string;

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new CooperTestSchemaMigration(storage));
    storage.registerMigration(new ToolSessionsSchemaMigration(storage));
    await storage.migrate();

    const adapter = storage.getAdapter();
    configRepository = new CooperTestConfigRepository(adapter);
    performanceRepository = new PerformanceEntryRepository(adapter);
    toolSessionRepository = new ToolSessionRepository(adapter);
    classGroupRepository = new ClassGroupRepository(adapter);
    categoryRepository = new GradeCategoryRepository(adapter);
    studentRepository = new StudentRepository(adapter);
    createLessonUseCase = new CreateLessonUseCase(new LessonRepository(adapter));

    useCase = new SaveCooperSessionUseCase(
      toolSessionRepository,
      performanceRepository,
      configRepository
    );

    // Seed common fixtures
    const classGroup = await classGroupRepository.create({
      name: '5a',
      schoolYear: '2024/2025',
      gradingScheme: 'default'
    });
    classGroupId = classGroup.id;

    const category = await categoryRepository.create({
      classGroupId,
      name: 'Cooper Test',
      type: Sport.GradeCategoryType.Cooper,
      weight: 1,
      configuration: {
        type: 'cooper',
        SportType: 'running',
        distanceUnit: 'meters',
        autoEvaluation: true
      } as Sport.CooperGradingConfig
    });
    categoryId = category.id;

    const runningConfig = await configRepository.create({
      name: 'Cooper Running 400m',
      SportType: 'running',
      distanceUnit: 'meters',
      lapLengthMeters: 400,
      source: 'default'
    });
    runningConfigId = runningConfig.id;

    const s1 = await studentRepository.create({
      classGroupId,
      firstName: 'Anna',
      lastName: 'Müller',
      gender: 'female',
      birthYear: 2009
    });
    student1Id = s1.id;

    const s2 = await studentRepository.create({
      classGroupId,
      firstName: 'Ben',
      lastName: 'Schmidt',
      gender: 'male',
      birthYear: 2009
    });
    student2Id = s2.id;
  });

  afterEach(async () => {
    await storage.close();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Happy path
  // ──────────────────────────────────────────────────────────────────────────

  test('creates a ToolSession with toolType cooper-test', async () => {
    const session = await useCase.execute({
      classGroupId,
      categoryId,
      SportType: 'running',
      configId: runningConfigId,
      lapLengthMeters: 400,
      entries: [
        { studentId: student1Id, rounds: 8, lapLengthMeters: 400, extraMeters: 50, distanceMeters: 3250 },
        { studentId: student2Id, rounds: 10, lapLengthMeters: 400, extraMeters: 0, distanceMeters: 4000 }
      ]
    });

    expect(session.toolType).toBe('cooper-test');
    expect(session.classGroupId).toBe(classGroupId);
    expect(session.endedAt).toBeDefined();
  });

  test('session metadata contains categoryId, SportType, configId and entryCount', async () => {
    const session = await useCase.execute({
      classGroupId,
      categoryId,
      SportType: 'running',
      configId: runningConfigId,
      lapLengthMeters: 400,
      entries: [
        { studentId: student1Id, rounds: 8, lapLengthMeters: 400, extraMeters: 0, distanceMeters: 3200 }
      ]
    });

    const meta = session.sessionMetadata as Record<string, unknown>;
    expect(meta.categoryId).toBe(categoryId);
    expect(meta.SportType).toBe('running');
    expect(meta.configId).toBe(runningConfigId);
    expect(meta.entryCount).toBe(1);
    expect(Array.isArray(meta.entryIds)).toBe(true);
    expect((meta.entryIds as string[]).length).toBe(1);
  });

  test('persists a PerformanceEntry per active student with sessionId in metadata', async () => {
    const session = await useCase.execute({
      classGroupId,
      categoryId,
      SportType: 'running',
      configId: runningConfigId,
      lapLengthMeters: 400,
      entries: [
        { studentId: student1Id, rounds: 8, lapLengthMeters: 400, extraMeters: 50, distanceMeters: 3250, calculatedGrade: '2' },
        { studentId: student2Id, rounds: 10, lapLengthMeters: 400, extraMeters: 0, distanceMeters: 4000, calculatedGrade: '1' }
      ]
    });

    const allEntries = await performanceRepository.findByCategory(categoryId);
    expect(allEntries.length).toBe(2);

    const s1Entry = allEntries.find((e) => e.studentId === student1Id);
    expect(s1Entry).toBeDefined();
    expect(s1Entry?.calculatedGrade).toBe('2');
    expect((s1Entry?.metadata as Record<string, unknown>)?.sessionId).toBe(session.id);
    expect(s1Entry?.measurements.distanceMeters).toBe(3250);
  });

  test('saves session with optional tableId', async () => {
    const session = await useCase.execute({
      classGroupId,
      categoryId,
      SportType: 'running',
      configId: runningConfigId,
      tableId: 'table-123',
      lapLengthMeters: 400,
      entries: [
        { studentId: student1Id, rounds: 8, lapLengthMeters: 400, extraMeters: 0, distanceMeters: 3200 }
      ]
    });

    const meta = session.sessionMetadata as Record<string, unknown>;
    expect(meta.tableId).toBe('table-123');
  });

  test('saves session with optional lessonId', async () => {
    // Create a real lesson to satisfy the FK constraint
    const lesson = await createLessonUseCase.execute({
      classGroupId,
      date: new Date()
    });

    const session = await useCase.execute({
      classGroupId,
      lessonId: lesson.id,
      categoryId,
      SportType: 'running',
      configId: runningConfigId,
      lapLengthMeters: 400,
      entries: [
        { studentId: student1Id, rounds: 8, lapLengthMeters: 400, extraMeters: 0, distanceMeters: 3200 }
      ]
    });

    expect(session.lessonId).toBe(lesson.id);
  });

  test('skips entries with distanceMeters <= 0', async () => {
    const session = await useCase.execute({
      classGroupId,
      categoryId,
      SportType: 'running',
      configId: runningConfigId,
      lapLengthMeters: 400,
      entries: [
        // active participant
        { studentId: student1Id, rounds: 8, lapLengthMeters: 400, extraMeters: 0, distanceMeters: 3200 },
        // absent / no data
        { studentId: student2Id, rounds: 0, lapLengthMeters: 400, extraMeters: 0, distanceMeters: 0 }
      ]
    });

    const meta = session.sessionMetadata as Record<string, unknown>;
    expect(meta.entryCount).toBe(1);

    const allEntries = await performanceRepository.findByCategory(categoryId);
    expect(allEntries.length).toBe(1);
    expect(allEntries[0].studentId).toBe(student1Id);
  });

  test('session is retrievable via toolSessionRepository.findByClassGroup', async () => {
    await useCase.execute({
      classGroupId,
      categoryId,
      SportType: 'running',
      configId: runningConfigId,
      lapLengthMeters: 400,
      entries: [
        { studentId: student1Id, rounds: 8, lapLengthMeters: 400, extraMeters: 0, distanceMeters: 3200 }
      ]
    });

    const sessions = await toolSessionRepository.findByClassGroup(classGroupId);
    const cooperSessions = sessions.filter((s) => s.toolType === 'cooper-test');
    expect(cooperSessions.length).toBe(1);
  });

  test('two sessions for the same class are both retrievable', async () => {
    const commonInput = {
      classGroupId,
      categoryId,
      SportType: 'running' as const,
      configId: runningConfigId,
      lapLengthMeters: 400,
      entries: [
        { studentId: student1Id, rounds: 8, lapLengthMeters: 400, extraMeters: 0, distanceMeters: 3200 }
      ]
    };

    await useCase.execute(commonInput);
    await useCase.execute(commonInput);

    const sessions = await toolSessionRepository.findByClassGroup(classGroupId);
    expect(sessions.filter((s) => s.toolType === 'cooper-test').length).toBe(2);
  });

  test('swimming config session saves correctly', async () => {
    const swimmingConfig = await configRepository.create({
      name: 'Cooper Swimming 25m',
      SportType: 'swimming',
      distanceUnit: 'meters',
      lapLengthMeters: 25,
      source: 'default'
    });

    const session = await useCase.execute({
      classGroupId,
      categoryId,
      SportType: 'swimming',
      configId: swimmingConfig.id,
      lapLengthMeters: 25,
      entries: [
        { studentId: student1Id, rounds: 16, lapLengthMeters: 25, extraMeters: 0, distanceMeters: 400 }
      ]
    });

    const meta = session.sessionMetadata as Record<string, unknown>;
    expect(meta.SportType).toBe('swimming');
    expect(meta.lapLengthMeters).toBe(25);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Validation
  // ──────────────────────────────────────────────────────────────────────────

  test('throws when classGroupId is missing', async () => {
    await expect(
      useCase.execute({
        classGroupId: '',
        categoryId,
        SportType: 'running',
        configId: runningConfigId,
        lapLengthMeters: 400,
        entries: [{ studentId: student1Id, rounds: 8, lapLengthMeters: 400, distanceMeters: 3200 }]
      })
    ).rejects.toThrow('classGroupId is required');
  });

  test('throws when configId is missing', async () => {
    await expect(
      useCase.execute({
        classGroupId,
        categoryId,
        SportType: 'running',
        configId: '',
        lapLengthMeters: 400,
        entries: [{ studentId: student1Id, rounds: 8, lapLengthMeters: 400, distanceMeters: 3200 }]
      })
    ).rejects.toThrow('configId is required');
  });

  test('throws when config does not exist', async () => {
    await expect(
      useCase.execute({
        classGroupId,
        categoryId,
        SportType: 'running',
        configId: 'non-existent-id',
        lapLengthMeters: 400,
        entries: [{ studentId: student1Id, rounds: 8, lapLengthMeters: 400, distanceMeters: 3200 }]
      })
    ).rejects.toThrow('Cooper Test Config not found');
  });

  test('throws when sport type does not match config', async () => {
    await expect(
      useCase.execute({
        classGroupId,
        categoryId,
        SportType: 'swimming',         // running config but swimming SportType
        configId: runningConfigId,
        lapLengthMeters: 400,
        entries: [{ studentId: student1Id, rounds: 8, lapLengthMeters: 400, distanceMeters: 3200 }]
      })
    ).rejects.toThrow('Sport type mismatch');
  });

  test('throws when all entries have distanceMeters <= 0', async () => {
    await expect(
      useCase.execute({
        classGroupId,
        categoryId,
        SportType: 'running',
        configId: runningConfigId,
        lapLengthMeters: 400,
        entries: [
          { studentId: student1Id, rounds: 0, lapLengthMeters: 400, distanceMeters: 0 },
          { studentId: student2Id, rounds: 0, lapLengthMeters: 400, distanceMeters: 0 }
        ]
      })
    ).rejects.toThrow('No entries with distance > 0');
  });

  test('throws when entries array is empty', async () => {
    await expect(
      useCase.execute({
        classGroupId,
        categoryId,
        SportType: 'running',
        configId: runningConfigId,
        lapLengthMeters: 400,
        entries: []
      })
    ).rejects.toThrow('entries must not be empty');
  });
});
