import type { ClassGroup, Student, StudentCalendarEntry } from '@viccoboard/core';
import {
  IservAbsenceImportUseCase,
  StudentCalendarEntryRepository,
  StudentRepository,
  type IservClassGroupGateway
} from '../../src/index.js';

class InMemoryStudentRepository {
  constructor(private students: Student[]) {}

  async findAll(): Promise<Student[]> {
    return [...this.students];
  }
}

class InMemoryClassGroupGateway implements IservClassGroupGateway {
  constructor(private classGroups: ClassGroup[]) {}

  async findAll(): Promise<ClassGroup[]> {
    return [...this.classGroups];
  }
}

class InMemoryCalendarRepository {
  private entries: StudentCalendarEntry[] = [];

  async findAll(): Promise<StudentCalendarEntry[]> {
    return [...this.entries];
  }

  async create(
    input: Omit<StudentCalendarEntry, 'id' | 'createdAt' | 'lastModified'>
  ): Promise<StudentCalendarEntry> {
    const entry: StudentCalendarEntry = {
      id: `calendar-${this.entries.length + 1}`,
      ...input,
      createdAt: new Date('2026-09-14T12:00:00.000Z'),
      lastModified: new Date('2026-09-14T12:00:00.000Z')
    };
    this.entries.push(entry);
    return entry;
  }

  getAll(): StudentCalendarEntry[] {
    return [...this.entries];
  }
}

function buildClassGroup(): ClassGroup {
  return {
    id: 'class-7a',
    name: '7a',
    schoolYear: '2026/2027',
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    lastModified: new Date('2026-08-01T00:00:00.000Z')
  };
}

function buildStudent(): Student {
  return {
    id: 'student-anna',
    firstName: 'Anna',
    lastName: 'Muster',
    dateOfBirth: '14.03.2012',
    classGroupId: 'class-7a',
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    lastModified: new Date('2026-08-01T00:00:00.000Z')
  };
}

function createUseCase(options?: { students?: Student[]; classGroups?: ClassGroup[] }) {
  const calendarRepository = new InMemoryCalendarRepository();
  const useCase = new IservAbsenceImportUseCase(
    new InMemoryStudentRepository(options?.students ?? [buildStudent()]) as unknown as StudentRepository,
    new InMemoryClassGroupGateway(options?.classGroups ?? [buildClassGroup()]),
    calendarRepository as unknown as StudentCalendarEntryRepository
  );

  return { useCase, calendarRepository };
}

const detailCsv = [
  'Datum;Zeitraum;Verp. Unterricht;Fehltage;Fehlstunden;Fehlminuten;Status',
  '14.09.2026;1.-2. Stunde;2;1;2;0;entschuldigt'
].join('\n');

const summaryCsv = [
  'Schüler;Klasse;Fehltage;Fehlstunden;Fehlminuten',
  'Anna Muster;7a;1;2;0'
].join('\n');

describe('IservAbsenceImportUseCase', () => {
  test('imports detail rows and ignores the aggregate summary CSV', async () => {
    const { useCase, calendarRepository } = createUseCase();
    const files = [
      { path: 'Export/7a/Muster_Anna_4711/Schüler Abwesenheiten.csv', content: detailCsv },
      { path: 'Export/7a/Muster_Anna_4711/Fehlzeiten_Summe.csv', content: summaryCsv }
    ];

    const preview = await useCase.preview(files);

    expect(preview.summary).toEqual({
      files: 2,
      detailFiles: 1,
      rows: 1,
      ready: 1,
      skipped: 0,
      conflicts: 0,
      errors: 0
    });
    expect(preview.candidates[0]).toMatchObject({
      studentId: 'student-anna',
      startDate: '2026-09-14',
      endDate: '2026-09-14',
      period: '1.-2. Stunde',
      compulsoryLessons: '2',
      missedDays: 1,
      missedHours: 2,
      missedMinutes: 0,
      statusText: 'entschuldigt',
      status: 'ready'
    });

    const result = await useCase.execute(files);
    expect(result.imported).toBe(1);
    expect(calendarRepository.getAll()).toHaveLength(1);
    expect(calendarRepository.getAll()[0]).toMatchObject({
      studentId: 'student-anna',
      type: 'absence',
      source: 'iserv'
    });
  });

  test('deduplicates a repeated IServ import', async () => {
    const { useCase } = createUseCase();
    const files = [
      { path: 'Export/7a/Muster_Anna_4711/Schüler Abwesenheiten.csv', content: detailCsv }
    ];

    await useCase.execute(files);
    const secondPreview = await useCase.preview(files);

    expect(secondPreview.summary.ready).toBe(0);
    expect(secondPreview.summary.skipped).toBe(1);
    expect(secondPreview.candidates[0]?.status).toBe('skip_existing');
  });

  test('reports an ambiguous import boundary instead of guessing a student', async () => {
    const { useCase } = createUseCase({ students: [] });
    const preview = await useCase.preview([
      { path: 'Export/7a/Muster_Anna_4711/Schüler Abwesenheiten.csv', content: detailCsv }
    ]);

    expect(preview.summary.ready).toBe(0);
    expect(preview.summary.conflicts).toBe(1);
    expect(preview.issues[0]?.severity).toBe('conflict');
  });
});
