import type { ClassGroup, ImportBatch, ImportBatchItem, Student } from '@viccoboard/core';
import {
  ImportBatchItemRepository,
  ImportBatchRepository,
  StudentCsvImportUseCase,
  StudentRepository,
  type ClassGroupGateway
} from '../../src/index.js';

class InMemoryStudentRepository {
  constructor(private students: Student[] = []) {}

  async findByClassGroup(classGroupId: string): Promise<Student[]> {
    return this.students.filter((student) => student.classGroupId === classGroupId);
  }

  async findExactIdentityMatch(input: {
    firstName: string;
    lastName: string;
    classGroupId: string;
    dateOfBirth: string;
  }): Promise<Student | null> {
    const firstName = input.firstName.trim().toLowerCase();
    const lastName = input.lastName.trim().toLowerCase();
    return this.students.find((student) =>
      student.classGroupId === input.classGroupId &&
      student.dateOfBirth === input.dateOfBirth &&
      student.firstName.trim().toLowerCase() === firstName &&
      student.lastName.trim().toLowerCase() === lastName
    ) ?? null;
  }

  async findByEmail(email: string): Promise<Student[]> {
    const normalizedEmail = email.trim().toLowerCase();
    return this.students.filter((student) =>
      student.contactInfo?.email?.trim().toLowerCase() === normalizedEmail
    );
  }

  async create(input: Omit<Student, 'id' | 'createdAt' | 'lastModified'>): Promise<Student> {
    const student: Student = {
      id: `student-${this.students.length + 1}`,
      ...input,
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      lastModified: new Date('2026-04-10T12:00:00.000Z')
    };
    this.students.push(student);
    return student;
  }

  async delete(id: string): Promise<boolean> {
    const before = this.students.length;
    this.students = this.students.filter((student) => student.id !== id);
    return this.students.length < before;
  }

  getAll(): Student[] {
    return [...this.students];
  }
}

class InMemoryClassGroupGateway implements ClassGroupGateway {
  constructor(private classGroups: ClassGroup[] = []) {}

  async findBySchoolYear(schoolYear: string): Promise<ClassGroup[]> {
    return this.classGroups.filter((classGroup) => classGroup.schoolYear === schoolYear);
  }

  async create(input: Omit<ClassGroup, 'id' | 'createdAt' | 'lastModified'>): Promise<ClassGroup> {
    const classGroup: ClassGroup = {
      id: `class-${this.classGroups.length + 1}`,
      ...input,
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      lastModified: new Date('2026-04-10T12:00:00.000Z')
    };
    this.classGroups.push(classGroup);
    return classGroup;
  }

  async delete(id: string): Promise<boolean> {
    const before = this.classGroups.length;
    this.classGroups = this.classGroups.filter((classGroup) => classGroup.id !== id);
    return this.classGroups.length < before;
  }

  getAll(): ClassGroup[] {
    return [...this.classGroups];
  }
}

class InMemoryImportBatchRepository {
  private batches: ImportBatch[] = [];

  async create(input: Omit<ImportBatch, 'id' | 'createdAt' | 'lastModified'>): Promise<ImportBatch> {
    const batch: ImportBatch = {
      id: `batch-${this.batches.length + 1}`,
      ...input,
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      lastModified: new Date('2026-04-10T12:00:00.000Z')
    };
    this.batches.push(batch);
    return batch;
  }

  async findBySourceType(sourceType: 'demo' | 'live'): Promise<ImportBatch[]> {
    return this.batches.filter((batch) => batch.sourceType === sourceType);
  }

  async delete(id: string): Promise<boolean> {
    const before = this.batches.length;
    this.batches = this.batches.filter((batch) => batch.id !== id);
    return this.batches.length < before;
  }

  getAll(): ImportBatch[] {
    return [...this.batches];
  }
}

class InMemoryImportBatchItemRepository {
  private items: ImportBatchItem[] = [];

  async create(input: Omit<ImportBatchItem, 'id' | 'createdAt' | 'lastModified'>): Promise<ImportBatchItem> {
    const item: ImportBatchItem = {
      id: `item-${this.items.length + 1}`,
      ...input,
      createdAt: new Date('2026-04-10T12:00:00.000Z'),
      lastModified: new Date('2026-04-10T12:00:00.000Z')
    };
    this.items.push(item);
    return item;
  }

  async findByBatchId(batchId: string): Promise<ImportBatchItem[]> {
    return this.items.filter((item) => item.batchId === batchId);
  }

  async delete(id: string): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    return this.items.length < before;
  }

  getAll(): ImportBatchItem[] {
    return [...this.items];
  }
}

function createUseCase(options?: {
  students?: Student[];
  classGroups?: ClassGroup[];
}) {
  const studentRepository = new InMemoryStudentRepository(options?.students);
  const classGroupGateway = new InMemoryClassGroupGateway(options?.classGroups);
  const importBatchRepository = new InMemoryImportBatchRepository();
  const importBatchItemRepository = new InMemoryImportBatchItemRepository();

  const useCase = new StudentCsvImportUseCase(
    studentRepository as unknown as StudentRepository,
    classGroupGateway,
    importBatchRepository as unknown as ImportBatchRepository,
    importBatchItemRepository as unknown as ImportBatchItemRepository
  );

  return {
    useCase,
    studentRepository,
    classGroupGateway,
    importBatchRepository,
    importBatchItemRepository
  };
}

function buildClassGroup(id: string, name: string, schoolYear = '2025/2026'): ClassGroup {
  return {
    id,
    name,
    schoolYear,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastModified: new Date('2026-01-01T00:00:00.000Z')
  };
}

function buildStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: 'student-existing',
    firstName: 'Anna',
    lastName: 'Muster',
    classGroupId: 'class-7a',
    dateOfBirth: '2012-03-14',
    gender: 'f',
    contactInfo: {
      email: 'anna.muster@vvb-gym.de'
    },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastModified: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides
  };
}

describe('StudentCsvImportUseCase', () => {
  test('builds a valid preview for m/f students and reuses class groups', async () => {
    const { useCase } = createUseCase({
      classGroups: [buildClassGroup('class-7a', '7a')]
    });

    const preview = await useCase.preview([
      {
        fileName: 'students.csv',
        content: [
          'Vorname,Nachname,Klasse,Teilklasse,Geburtsdatum,Geschlecht,E-Mail',
          'Anna,Muster,7,a,2012-03-14,f,anna.muster@vvb-gym.de',
          'Ben,Beispiel,7,a,2012-08-20,m,ben.beispiel@vvb-gym.de'
        ].join('\n')
      }
    ], 'live', 'Testimport');

    expect(preview.summary).toEqual({
      read: 2,
      valid: 2,
      imported: 2,
      skipped: 0,
      conflicts: 0,
      errors: 0
    });
    expect(preview.candidates.map((candidate) => candidate.gender)).toEqual(['f', 'm']);
    expect(preview.candidates.every((candidate) => candidate.classGroupId === 'class-7a')).toBe(true);
  });

  test('marks invalid date, invalid gender and invalid email rows as errors', async () => {
    const { useCase } = createUseCase();

    const preview = await useCase.preview([
      {
        fileName: 'students.csv',
        content: [
          'Vorname,Nachname,Klasse,Teilklasse,Geburtsdatum,Geschlecht,E-Mail',
          'Anna,Muster,7,a,2012-02-31,x,not-an-email'
        ].join('\n')
      }
    ], 'live', 'Invalid rows');

    expect(preview.summary.errors).toBe(3);
    expect(preview.summary.imported).toBe(0);
    expect(preview.candidates[0]?.status).toBe('invalid');
    expect(preview.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['geburtsdatum', 'geschlecht', 'e-mail'])
    );
  });

  test('detects duplicate rows inside one import', async () => {
    const { useCase } = createUseCase();

    const preview = await useCase.preview([
      {
        fileName: 'students.csv',
        content: [
          'Vorname,Nachname,Klasse,Teilklasse,Geburtsdatum,Geschlecht,E-Mail',
          'Anna,Muster,7,a,2012-03-14,f,anna.muster@vvb-gym.de',
          'Anna,Muster,7,a,2012-03-14,f,anna.muster@vvb-gym.de'
        ].join('\n')
      }
    ], 'live', 'Duplicates');

    expect(preview.summary.errors).toBe(1);
    expect(preview.candidates[1]?.status).toBe('invalid');
    expect(preview.issues.some((issue) => issue.message.includes('Doppelte Zeile'))).toBe(true);
  });

  test('skips exact existing students and reports conflicting existing students', async () => {
    const { useCase } = createUseCase({
      classGroups: [buildClassGroup('class-7a', '7a')],
      students: [
        buildStudent(),
        buildStudent({
          id: 'student-conflict',
          firstName: 'Ben',
          lastName: 'Beispiel',
          dateOfBirth: '2012-08-20',
          gender: 'm',
          contactInfo: {
            email: 'ben.alt@vvb-gym.de'
          }
        })
      ]
    });

    const preview = await useCase.preview([
      {
        fileName: 'students.csv',
        content: [
          'Vorname,Nachname,Klasse,Teilklasse,Geburtsdatum,Geschlecht,E-Mail',
          'Anna,Muster,7,a,2012-03-14,f,anna.muster@vvb-gym.de',
          'Ben,Beispiel,7,a,2012-08-20,m,ben.neu@vvb-gym.de'
        ].join('\n')
      }
    ], 'live', 'Existing data');

    expect(preview.summary.skipped).toBe(1);
    expect(preview.summary.conflicts).toBe(1);
    expect(preview.candidates[0]?.status).toBe('skip_existing');
    expect(preview.candidates[1]?.status).toBe('conflict');
  });

  test('creates class groups and students, and tracks them in import batches', async () => {
    const {
      useCase,
      studentRepository,
      classGroupGateway,
      importBatchRepository,
      importBatchItemRepository
    } = createUseCase();

    const result = await useCase.execute([
      {
        fileName: 'students.csv',
        content: [
          'Vorname,Nachname,Klasse,Teilklasse,Geburtsdatum,Geschlecht,E-Mail',
          'Anna,Muster,7,a,2012-03-14,f,anna.muster@vvb-gym.de',
          'Ben,Beispiel,7,a,2012-08-20,m,ben.beispiel@vvb-gym.de'
        ].join('\n')
      }
    ], 'live', 'Execution');

    expect(result.batchId).toBe('batch-1');
    expect(studentRepository.getAll()).toHaveLength(2);
    expect(classGroupGateway.getAll()).toHaveLength(1);
    expect(importBatchRepository.getAll()).toHaveLength(1);
    expect(importBatchItemRepository.getAll().filter((item) => item.entityType === 'student' && item.action === 'created')).toHaveLength(2);
    expect(importBatchItemRepository.getAll().filter((item) => item.entityType === 'class_group' && item.action === 'created')).toHaveLength(1);
  });

  test('deletes only demo-imported students and removes empty demo class groups', async () => {
    const existingClass = buildClassGroup('class-live', '8b');
    const liveStudent = buildStudent({
      id: 'student-live',
      firstName: 'Lena',
      lastName: 'Live',
      classGroupId: existingClass.id,
      dateOfBirth: '2011-01-10',
      contactInfo: { email: 'lena.live@school.de' }
    });

    const {
      useCase,
      studentRepository,
      classGroupGateway,
      importBatchRepository
    } = createUseCase({
      classGroups: [existingClass],
      students: [liveStudent]
    });

    await useCase.execute([
      {
        fileName: 'demo.csv',
        content: [
          'Vorname,Nachname,Klasse,Teilklasse,Geburtsdatum,Geschlecht,E-Mail',
          'Anna,Muster,7,a,2012-03-14,f,anna.muster@vvb-gym.de'
        ].join('\n')
      }
    ], 'demo', 'Demo batch');

    await useCase.execute([
      {
        fileName: 'live.csv',
        content: [
          'Vorname,Nachname,Klasse,Teilklasse,Geburtsdatum,Geschlecht,E-Mail',
          'Bela,Echt,8,b,2011-09-18,m,bela.echt@school.de'
        ].join('\n')
      }
    ], 'live', 'Live batch');

    const deletion = await useCase.deleteDemoData();

    expect(deletion.deletedStudents).toBe(1);
    expect(studentRepository.getAll().map((student) => student.firstName).sort()).toEqual(['Bela', 'Lena']);
    expect(classGroupGateway.getAll().map((classGroup) => classGroup.name).sort()).toEqual(['8b']);
    expect(importBatchRepository.getAll().map((batch) => batch.sourceType)).toEqual(['live']);
  });
});
