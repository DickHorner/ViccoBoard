import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  ExamSchemaMigration,
  CorrectionSchemaMigration
} from '@viccoboard/storage/node';
import { CorrectionEntryRepository } from '../src/repositories/correction-entry.repository';
import { ExamRepository } from '../src/repositories/exam.repository';
import { RecordCorrectionUseCase } from '../src/use-cases/record-correction.use-case-v2';
import { Exams } from '@viccoboard/core';

describe('RecordCorrectionUseCase', () => {
  let storage: SQLiteStorage;
  let correctionRepo: CorrectionEntryRepository;
  let examRepo: ExamRepository;
  let useCase: RecordCorrectionUseCase;

  const gradingKey: Exams.GradingKey = {
    id: 'grading-1',
    name: 'German 1-6',
    type: Exams.GradingKeyType.Percentage,
    totalPoints: 100,
    gradeBoundaries: [
      { grade: '1', minPercentage: 87.5, maxPercentage: 100, displayValue: '1' },
      { grade: '2', minPercentage: 75, maxPercentage: 87.5, displayValue: '2' },
      { grade: '3', minPercentage: 62.5, maxPercentage: 75, displayValue: '3' },
      { grade: '4', minPercentage: 50, maxPercentage: 62.5, displayValue: '4' },
      { grade: '5', minPercentage: 25, maxPercentage: 50, displayValue: '5' },
      { grade: '6', minPercentage: 0, maxPercentage: 25, displayValue: '6' }
    ],
    roundingRule: { type: 'nearest', decimalPlaces: 1 },
    errorPointsToGrade: false,
    customizable: true,
    modifiedAfterCorrection: false
  };

  const structure: Exams.ExamStructure = {
    parts: [],
    tasks: [],
    allowsComments: true,
    allowsSupportTips: true,
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

    correctionRepo = new CorrectionEntryRepository(storage.getAdapter());
    examRepo = new ExamRepository(storage.getAdapter());
    useCase = new RecordCorrectionUseCase(correctionRepo, examRepo);
  });

  afterEach(async () => {
    await storage.close();
  });

  test('records a new correction as in-progress (partial entry)', async () => {
    const exam = await examRepo.create({
      title: 'Partial Test',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'in-progress'
    });

    const candidateId = 'candidate-1';
    const result = await useCase.execute({
      examId: exam.id,
      candidateId,
      taskScores: [
        { taskId: 'task-1', points: 40, maxPoints: 50, timestamp: new Date() }
      ]
    });

    expect(result.examId).toBe(exam.id);
    expect(result.candidateId).toBe(candidateId);
    expect(result.status).toBe('in-progress');
    expect(result.totalPoints).toBe(40);
    expect(result.taskScores).toHaveLength(1);
    expect(result.correctedAt).toBeUndefined();

    // Verify persisted
    const persisted = await correctionRepo.findByExamAndCandidate(exam.id, candidateId);
    expect(persisted).not.toBeNull();
    expect(persisted?.totalPoints).toBe(40);
  });

  test('finalizes correction and sets status to completed', async () => {
    const exam = await examRepo.create({
      title: 'Final Exam',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'in-progress'
    });

    const candidateId = 'candidate-2';
    const result = await useCase.execute({
      examId: exam.id,
      candidateId,
      taskScores: [
        { taskId: 'task-1', points: 90, maxPoints: 100, timestamp: new Date() }
      ],
      finalizeCorrection: true
    });

    expect(result.status).toBe('completed');
    expect(result.correctedAt).toBeInstanceOf(Date);
    expect(result.totalPoints).toBe(90);
  });

  test('calculates grade correctly from grading key', async () => {
    const exam = await examRepo.create({
      title: 'Grade Calc Exam',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'in-progress'
    });

    // 80 out of 100 = 80% → grade '2' (75-87.5)
    const result = await useCase.execute({
      examId: exam.id,
      candidateId: 'candidate-3',
      taskScores: [
        { taskId: 'task-1', points: 80, maxPoints: 100, timestamp: new Date() }
      ],
      finalizeCorrection: true
    });

    expect(result.totalPoints).toBe(80);
    expect(result.percentageScore).toBeCloseTo(80, 1);
    expect(result.totalGrade).toBe('2');
  });

  test('calculates totals from multiple task scores', async () => {
    const exam = await examRepo.create({
      title: 'Multi-Task Exam',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'in-progress'
    });

    const result = await useCase.execute({
      examId: exam.id,
      candidateId: 'candidate-4',
      taskScores: [
        { taskId: 'task-1', points: 25, maxPoints: 40, timestamp: new Date() },
        { taskId: 'task-2', points: 30, maxPoints: 35, timestamp: new Date() },
        { taskId: 'task-3', points: 20, maxPoints: 25, timestamp: new Date() }
      ],
      finalizeCorrection: true
    });

    expect(result.totalPoints).toBe(75);
    expect(result.percentageScore).toBeCloseTo(75, 1);
    expect(result.totalGrade).toBe('2');
  });

  test('updates existing correction entry on second call', async () => {
    const exam = await examRepo.create({
      title: 'Update Exam',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'in-progress'
    });

    const candidateId = 'candidate-5';

    // First partial entry
    await useCase.execute({
      examId: exam.id,
      candidateId,
      taskScores: [
        { taskId: 'task-1', points: 30, maxPoints: 50, timestamp: new Date() }
      ]
    });

    // Update with more task scores and finalize
    const updated = await useCase.execute({
      examId: exam.id,
      candidateId,
      taskScores: [
        { taskId: 'task-1', points: 45, maxPoints: 50, timestamp: new Date() },
        { taskId: 'task-2', points: 40, maxPoints: 50, timestamp: new Date() }
      ],
      finalizeCorrection: true
    });

    expect(updated.totalPoints).toBe(85);
    expect(updated.status).toBe('completed');

    // Only one entry should exist for this exam+candidate
    const all = await correctionRepo.findByExam(exam.id);
    expect(all).toHaveLength(1);
  });

  test('attaches comments to correction', async () => {
    const exam = await examRepo.create({
      title: 'Comment Exam',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'in-progress'
    });

    const result = await useCase.execute({
      examId: exam.id,
      candidateId: 'candidate-6',
      taskScores: [
        { taskId: 'task-1', points: 70, maxPoints: 100, timestamp: new Date() }
      ],
      comments: [
        { taskId: 'task-1', text: 'Good work on part 1', level: 'task', printable: true, availableAfterReturn: false },
        { taskId: 'task-1', text: 'Needs improvement on methodology', level: 'task', printable: true, availableAfterReturn: false }
      ]
    });

    expect(result.comments).toHaveLength(2);
    expect(result.comments[0].text).toBe('Good work on part 1');
    expect(result.comments[0].id).toBeDefined();
    expect(result.comments[0].timestamp).toBeInstanceOf(Date);
  });

  test('assigns support tips to correction', async () => {
    const exam = await examRepo.create({
      title: 'Support Tips Exam',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'in-progress'
    });

    const result = await useCase.execute({
      examId: exam.id,
      candidateId: 'candidate-7',
      taskScores: [
        { taskId: 'task-1', points: 55, maxPoints: 100, timestamp: new Date() }
      ],
      supportTips: [
        { supportTipId: 'tip-1', notes: 'Needs extra practice' }
      ]
    });

    expect(result.supportTips).toHaveLength(1);
    expect(result.supportTips[0].supportTipId).toBe('tip-1');
    expect(result.supportTips[0].assignedAt).toBeInstanceOf(Date);
  });

  test('throws when exam does not exist', async () => {
    await expect(
      useCase.execute({
        examId: 'non-existent-exam',
        candidateId: 'candidate-8',
        taskScores: [
          { taskId: 'task-1', points: 50, maxPoints: 100, timestamp: new Date() }
        ]
      })
    ).rejects.toThrow('non-existent-exam');
  });

  test('supports zero task scores (empty partial correction)', async () => {
    const exam = await examRepo.create({
      title: 'Empty Correction Exam',
      mode: Exams.ExamMode.Simple,
      structure,
      gradingKey,
      printPresets: [],
      candidates: [],
      status: 'in-progress'
    });

    const result = await useCase.execute({
      examId: exam.id,
      candidateId: 'candidate-9'
    });

    expect(result.totalPoints).toBe(0);
    expect(result.status).toBe('in-progress');
    expect(result.taskScores).toHaveLength(0);
  });
});
