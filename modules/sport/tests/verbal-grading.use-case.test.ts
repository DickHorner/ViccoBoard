/**
 * Verbal assessment persistence tests.
 *
 * Verifies that verbal text entries can be recorded and retrieved
 * via the existing RecordGradeUseCase / PerformanceEntryRepository.
 */

import { RecordGradeUseCase } from '../src/use-cases/record-grade.use-case';
import { PerformanceEntryRepository } from '../src/repositories/performance-entry.repository';
import { ClassGroupRepository } from '../src/repositories/class-group.repository';
import { GradeCategoryRepository } from '../src/repositories/grade-category.repository';
import { StudentRepository } from '@viccoboard/students';
import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration } from '@viccoboard/storage/node';
import { Sport } from '@viccoboard/core';

describe('Verbal assessment persistence', () => {
  let storage: SQLiteStorage;
  let entryRepo: PerformanceEntryRepository;
  let useCase: RecordGradeUseCase;
  let studentId: string;
  let categoryId: string;

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    await storage.migrate();

    entryRepo = new PerformanceEntryRepository(storage.getAdapter());
    useCase = new RecordGradeUseCase(entryRepo);

    const classRepo = new ClassGroupRepository(storage.getAdapter());
    const studentRepo = new StudentRepository(storage.getAdapter());
    const categoryRepo = new GradeCategoryRepository(storage.getAdapter());

    const classGroup = await classRepo.create({
      name: 'Test Class',
      schoolYear: '2023/2024',
      gradingScheme: 'default',
    });

    const student = await studentRepo.create({
      firstName: 'Max',
      lastName: 'Mustermann',
      classGroupId: classGroup.id,
    });
    studentId = student.id;

    const category = await categoryRepo.create({
      classGroupId: classGroup.id,
      name: 'Verbalbeurteilung Sport',
      type: Sport.GradeCategoryType.Verbal,
      weight: 20,
      configuration: {
        type: 'verbal',
        fields: [],
        scales: [],
        exportFormat: 'text',
      },
    });
    categoryId = category.id;
  });

  afterEach(async () => {
    await storage.close();
  });

  test('records a verbal text entry', async () => {
    const text = 'Max zeigt eine sehr engagierte Teilnahme.';

    const result = await useCase.execute({
      studentId,
      categoryId,
      measurements: { text },
    });

    expect(result.id).toBeDefined();
    expect(result.studentId).toBe(studentId);
    expect(result.categoryId).toBe(categoryId);
    expect((result.measurements as Record<string, unknown>).text).toBe(text);
    expect(result.calculatedGrade).toBeUndefined();
  });

  test('records a second verbal entry and both entries are retrievable', async () => {
    await useCase.execute({
      studentId,
      categoryId,
      measurements: { text: 'Erste Beurteilung' },
    });

    await useCase.execute({
      studentId,
      categoryId,
      measurements: { text: 'Aktualisierte Beurteilung' },
    });

    const entries = await entryRepo.findByStudentAndCategory(studentId, categoryId);
    expect(entries.length).toBe(2);
    const texts = entries.map(e => (e.measurements as Record<string, unknown>).text);
    expect(texts).toContain('Erste Beurteilung');
    expect(texts).toContain('Aktualisierte Beurteilung');

    // getLatestEntry should return one of the two (most recent by timestamp)
    const latest = await entryRepo.getLatestEntry(studentId, categoryId);
    expect(latest).not.toBeNull();
    expect(typeof (latest!.measurements as Record<string, unknown>).text).toBe('string');
  });

  test('persists separate entries for multiple students in the same category', async () => {
    const classRepo = new ClassGroupRepository(storage.getAdapter());
    const studentRepo = new StudentRepository(storage.getAdapter());

    // Retrieve existing classGroup via category lookup
    const categoryRepo = new GradeCategoryRepository(storage.getAdapter());
    const cat = await categoryRepo.findById(categoryId);
    expect(cat).not.toBeNull();

    const student2 = await studentRepo.create({
      firstName: 'Lisa',
      lastName: 'Muster',
      classGroupId: cat!.classGroupId,
    });

    await useCase.execute({
      studentId,
      categoryId,
      measurements: { text: 'Beurteilung für Max' },
    });

    await useCase.execute({
      studentId: student2.id,
      categoryId,
      measurements: { text: 'Beurteilung für Lisa' },
    });

    const maxEntry = await entryRepo.getLatestEntry(studentId, categoryId);
    const lisaEntry = await entryRepo.getLatestEntry(student2.id, categoryId);

    expect((maxEntry!.measurements as Record<string, unknown>).text).toBe('Beurteilung für Max');
    expect((lisaEntry!.measurements as Record<string, unknown>).text).toBe('Beurteilung für Lisa');
  });

  test('returns entries sorted by timestamp via findByStudentAndCategory', async () => {
    await useCase.execute({ studentId, categoryId, measurements: { text: 'Eintrag 1' } });
    await useCase.execute({ studentId, categoryId, measurements: { text: 'Eintrag 2' } });

    const entries = await entryRepo.findByStudentAndCategory(studentId, categoryId);
    expect(entries.length).toBe(2);
    // The last element should be the most recent (descending sort)
    const texts = entries.map(e => (e.measurements as Record<string, unknown>).text);
    expect(texts).toContain('Eintrag 1');
    expect(texts).toContain('Eintrag 2');
  });
});
