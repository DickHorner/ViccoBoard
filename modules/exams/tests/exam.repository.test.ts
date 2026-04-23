import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  ExamSchemaMigration
} from '@viccoboard/storage/node';
import { ExamRepository } from '../src/repositories/exam.repository';
import { Exams } from '@viccoboard/core';


describe('ExamRepository', () => {
  let storage: SQLiteStorage;
  let repository: ExamRepository;

  const gradingKey: Exams.GradingKey = {
    id: 'grading-1',
    name: 'Default',
    type: Exams.GradingKeyType.Percentage,
    totalPoints: 100,
    gradeBoundaries: [],
    roundingRule: { type: 'none', decimalPlaces: 0 },
    errorPointsToGrade: false,
    customizable: true,
    modifiedAfterCorrection: false
  };

  const structure: Exams.ExamStructure = {
    parts: [],
    tasks: [],
    allowsComments: false,
    allowsSupportTips: false,
    totalPoints: 100
  };

  beforeEach(async () => {
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new ExamSchemaMigration(storage));
    await storage.migrate();

    repository = new ExamRepository(storage.getAdapter());
  });

  afterEach(async () => {
    await storage.close();
  });

  test('creates and reads an exam', async () => {
    const classId = crypto.randomUUID();
    const now = new Date().toISOString();
    await storage.getAdapter().insert('class_groups', {
      id: classId,
      name: 'Class 10A',
      school_year: '2025/2026',
      grading_scheme: 'default',
      created_at: now,
      last_modified: now
    });

    const created = await repository.create({
      title: 'Midterm',
      description: 'Algebra',
      classGroupId: classId,
      assessmentFormat: 'test',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      candidateGroups: [],
      status: 'draft'
    });

    const found = await repository.findById(created.id);
    expect(found).not.toBeNull();
    expect(found?.title).toBe('Midterm');
    expect(found?.assessmentFormat).toBe('test');
  });

  test('filters by class group and status', async () => {
    const classId = crypto.randomUUID();
    const now = new Date().toISOString();
    await storage.getAdapter().insert('class_groups', {
      id: classId,
      name: 'Class 10B',
      school_year: '2025/2026',
      grading_scheme: 'default',
      created_at: now,
      last_modified: now
    });

    await repository.create({
      title: 'Quiz',
      assessmentFormat: 'gruppenarbeit',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      candidateGroups: [
        {
          id: 'group-1',
          name: 'Gruppe Blau',
          memberCandidateIds: ['candidate-1']
        }
      ],
      status: 'draft',
      classGroupId: classId
    });

    await repository.create({
      title: 'Final',
      assessmentFormat: 'facharbeit',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      candidateGroups: [],
      status: 'completed'
    });

    const byClass = await repository.findByClassGroup(classId);
    expect(byClass).toHaveLength(1);

    const byStatus = await repository.findByStatus('completed');
    expect(byStatus).toHaveLength(1);
    expect(byStatus[0].title).toBe('Final');
    expect(byClass[0].candidateGroups[0]?.name).toBe('Gruppe Blau');
  });
});
