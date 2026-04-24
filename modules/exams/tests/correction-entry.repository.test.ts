import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  ExamSchemaMigration,
  CorrectionSchemaMigration
} from '@viccoboard/storage/node';
import { CorrectionEntryRepository } from '../src/repositories/correction-entry.repository';
import { ExamRepository } from '../src/repositories/exam.repository';
import { Exams } from '@viccoboard/core';
import { v4 as uuidv4 } from 'uuid';

describe('CorrectionEntryRepository', () => {
  let storage: SQLiteStorage;
  let repository: CorrectionEntryRepository;
  let examRepository: ExamRepository;

  const gradingKey: Exams.GradingKey = {
    id: 'grading-1',
    name: 'Default',
    type: Exams.GradingKeyType.Percentage,
    totalPoints: 100,
    gradeBoundaries: [
      { grade: '1', minPercentage: 90, displayValue: '1' },
      { grade: '2', minPercentage: 80, displayValue: '2' }
    ],
    roundingRule: { type: 'nearest', decimalPlaces: 1 },
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
    storage.registerMigration(new CorrectionSchemaMigration(storage));
    await storage.migrate();

    repository = new CorrectionEntryRepository(storage.getAdapter());
    examRepository = new ExamRepository(storage.getAdapter());
  });

  afterEach(async () => {
    await storage.close();
  });

  test('creates and retrieves correction entry', async () => {
    const exam = await examRepository.create({
      title: 'Quiz',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'in-progress'
    });

    const candidateId = uuidv4();
    const now = new Date();

    const entry: Exams.CorrectionEntry = {
      id: uuidv4(),
      examId: exam.id,
      candidateId,
      taskScores: [
        {
          taskId: 'task-1',
          points: 45,
          maxPoints: 50,
          timestamp: now
        },
        {
          taskId: 'task-2',
          points: 35,
          maxPoints: 50,
          timestamp: now
        }
      ],
      totalPoints: 80,
      totalGrade: '2',
      percentageScore: 80,
      comments: [],
      supportTips: [],
      status: 'completed',
      correctedBy: 'teacher-1',
      correctedAt: now,
      lastModified: now
    };

    await repository.createEntry(entry);

    const found = await repository.findById(entry.id);
    expect(found).not.toBeNull();
    expect(found?.examId).toBe(exam.id);
    expect(found?.candidateId).toBe(candidateId);
    expect(found?.totalGrade).toBe('2');
    expect(found?.taskScores).toHaveLength(2);
  });

  test('finds corrections by exam', async () => {
    const exam = await examRepository.create({
      title: 'Midterm',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'in-progress'
    });

    const now = new Date();
    const candidate1 = uuidv4();
    const candidate2 = uuidv4();

    await repository.createEntry({
      id: uuidv4(),
      examId: exam.id,
      candidateId: candidate1,
      taskScores: [
        {
          taskId: 'task-1',
          points: 75,
          maxPoints: 100,
          timestamp: now
        }
      ],
      totalPoints: 75,
      totalGrade: '2',
      percentageScore: 75,
      comments: [],
      supportTips: [],
      status: 'completed',
      correctedBy: 'teacher-1',
      correctedAt: now,
      lastModified: now
    });

    await repository.createEntry({
      id: uuidv4(),
      examId: exam.id,
      candidateId: candidate2,
      taskScores: [
        {
          taskId: 'task-1',
          points: 60,
          maxPoints: 100,
          timestamp: now
        }
      ],
      totalPoints: 60,
      totalGrade: '4',
      percentageScore: 60,
      comments: [],
      supportTips: [],
      status: 'completed',
      correctedBy: 'teacher-1',
      correctedAt: now,
      lastModified: now
    });

    const byExam = await repository.findByExam(exam.id);
    expect(byExam).toHaveLength(2);
    expect(byExam.map(e => e.candidateId).sort()).toEqual([candidate1, candidate2].sort());
  });

  test('finds corrections by candidate', async () => {
    const exam1 = await examRepository.create({
      title: 'Quiz 1',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'completed'
    });

    const exam2 = await examRepository.create({
      title: 'Quiz 2',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'completed'
    });

    const candidateId = uuidv4();
    const now = new Date();

    await repository.createEntry({
      id: uuidv4(),
      examId: exam1.id,
      candidateId,
      taskScores: [
        {
          taskId: 'task-1',
          points: 80,
          maxPoints: 100,
          timestamp: now
        }
      ],
      totalPoints: 80,
      totalGrade: '2',
      percentageScore: 80,
      comments: [],
      supportTips: [],
      status: 'completed',
      correctedBy: 'teacher-1',
      correctedAt: now,
      lastModified: now
    });

    await repository.createEntry({
      id: uuidv4(),
      examId: exam2.id,
      candidateId,
      taskScores: [
        {
          taskId: 'task-1',
          points: 90,
          maxPoints: 100,
          timestamp: now
        }
      ],
      totalPoints: 90,
      totalGrade: '1',
      percentageScore: 90,
      comments: [],
      supportTips: [],
      status: 'completed',
      correctedBy: 'teacher-1',
      correctedAt: now,
      lastModified: now
    });

    const byCandidate = await repository.findByCandidate(candidateId);
    expect(byCandidate).toHaveLength(2);
    expect(byCandidate.map(e => e.examId).sort()).toEqual([exam1.id, exam2.id].sort());
  });

  test('finds correction by exam and candidate', async () => {
    const exam = await examRepository.create({
      title: 'Final',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'completed'
    });

    const candidateId = uuidv4();
    const now = new Date();

    const created = await repository.create({
      examId: exam.id,
      candidateId,
      taskScores: [
        {
          taskId: 'task-1',
          points: 95,
          maxPoints: 100,
          timestamp: now
        }
      ],
      totalPoints: 95,
      totalGrade: '1',
      percentageScore: 95,
      comments: [],
      supportTips: [],
      status: 'completed',
      correctedBy: 'teacher-1',
      correctedAt: now
    });

    const found = await repository.findByExamAndCandidate(exam.id, candidateId);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.totalGrade).toBe('1');
  });

  test('returns null when exam-candidate pair not found', async () => {
    const exam = await examRepository.create({
      title: 'Missing',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'draft'
    });

    const found = await repository.findByExamAndCandidate(exam.id, uuidv4());
    expect(found).toBeNull();
  });
});
