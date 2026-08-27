import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  ExamSchemaMigration,
  CorrectionSchemaMigration
} from '@viccoboard/storage/node';
import { Exams } from '@viccoboard/core';
import { CorrectionEntryRepository } from '../src/repositories/correction-entry.repository';
import { ExamRepository } from '../src/repositories/exam.repository';
import { ExamAnalysisService } from '../src/services/exam-analysis.service';
import { ApplyPointAdjustmentsUseCase } from '../src/use-cases/apply-point-adjustments.use-case';
import { RecordCorrectionUseCase } from '../src/use-cases/record-correction.use-case-v2';

describe('ApplyPointAdjustmentsUseCase Integration Tests (#326)', () => {
  let storage: SQLiteStorage;
  let examRepo: ExamRepository;
  let correctionRepo: CorrectionEntryRepository;
  let recordCorrectionUseCase: RecordCorrectionUseCase;
  let applyPointAdjustmentsUseCase: ApplyPointAdjustmentsUseCase;

  const gradingKey: Exams.GradingKey = {
    id: 'grading-key-1',
    name: 'German 1-6',
    type: Exams.GradingKeyType.Percentage,
    totalPoints: 50,
    gradeBoundaries: [
      { grade: '1', minPercentage: 90, maxPercentage: 101, displayValue: '1' },
      { grade: '2', minPercentage: 75, maxPercentage: 90, displayValue: '2' },
      { grade: '3', minPercentage: 60, maxPercentage: 75, displayValue: '3' },
      { grade: '4', minPercentage: 45, maxPercentage: 60, displayValue: '4' },
      { grade: '5', minPercentage: 20, maxPercentage: 45, displayValue: '5' },
      { grade: '6', minPercentage: 0, maxPercentage: 20, displayValue: '6' }
    ],
    roundingRule: { type: 'nearest', decimalPlaces: 1 },
    errorPointsToGrade: false,
    customizable: true,
    modifiedAfterCorrection: false
  };

  function createTask(id: string, title: string, points: number, order: number): Exams.TaskNode {
    return {
      id,
      level: 1,
      order,
      title,
      points,
      isChoice: false,
      criteria: [],
      allowComments: true,
      allowSupportTips: true,
      commentBoxEnabled: true,
      subtasks: []
    };
  }

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

    examRepo = new ExamRepository(storage.getAdapter());
    correctionRepo = new CorrectionEntryRepository(storage.getAdapter());
    recordCorrectionUseCase = new RecordCorrectionUseCase(correctionRepo, examRepo);
    applyPointAdjustmentsUseCase = new ApplyPointAdjustmentsUseCase(examRepo, correctionRepo);
  });

  afterEach(async () => {
    await storage.close();
  });

  it('applies suggested point adjustments and persists recalculated corrections', async () => {
    const exam = await examRepo.create({
      title: 'Analysis Adjustment Test',
      assessmentFormat: 'test',
      mode: Exams.ExamMode.Simple,
      structure: {
        parts: [],
        tasks: [
          createTask('task-a', 'Analysis', 10, 1),
          createTask('task-b', 'Transfer', 40, 2)
        ],
        allowsComments: true,
        allowsSupportTips: true,
        totalPoints: 50
      },
      gradingKey,
      printPresets: [],
      candidates: [
        { id: 'candidate-1', examId: 'temp', firstName: 'Ada', lastName: 'Lovelace' }
      ],
      candidateGroups: [],
      status: 'in-progress'
    });

    const initialCorrection = await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'candidate-1',
      taskScores: [
        {
          taskId: 'task-a',
          points: 10,
          maxPoints: 10,
          criterionScores: [{ criterionId: 'criterion-a', points: 8, maxPoints: 8 }],
          timestamp: new Date()
        },
        {
          taskId: 'task-b',
          points: 4,
          maxPoints: 40,
          timestamp: new Date()
        }
      ]
    });

    const suggestion = ExamAnalysisService.suggestPointAdjustments(exam, [initialCorrection], 0.6);
    expect(suggestion.adjustments.map(({ taskId, suggestedPoints }) => ({ taskId, suggestedPoints }))).toEqual([
      { taskId: 'task-a', suggestedPoints: 13 },
      { taskId: 'task-b', suggestedPoints: 37 }
    ]);

    await applyPointAdjustmentsUseCase.execute({
      examId: exam.id,
      adjustments: suggestion.adjustments.map(({ taskId, suggestedPoints }) => ({ taskId, suggestedPoints }))
    });

    const reloadedExam = await examRepo.findById(exam.id);
    expect(reloadedExam?.structure.totalPoints).toBe(50);
    expect(reloadedExam?.gradingKey.totalPoints).toBe(50);
    expect(reloadedExam?.structure.tasks.find((task) => task.id === 'task-a')?.points).toBe(13);
    expect(reloadedExam?.structure.tasks.find((task) => task.id === 'task-b')?.points).toBe(37);

    const reloadedCorrection = await correctionRepo.findByExamAndCandidate(exam.id, 'candidate-1');
    const taskAScore = reloadedCorrection?.taskScores.find((score) => score.taskId === 'task-a');
    const taskBScore = reloadedCorrection?.taskScores.find((score) => score.taskId === 'task-b');

    expect(taskAScore?.points).toBe(13);
    expect(taskAScore?.maxPoints).toBe(13);
    expect(taskAScore?.criterionScores?.[0]).toEqual({
      criterionId: 'criterion-a',
      points: 10.4,
      maxPoints: 10.4
    });
    expect(taskBScore?.points).toBeCloseTo(3.7);
    expect(taskBScore?.maxPoints).toBe(37);
    expect(reloadedCorrection?.totalPoints).toBeCloseTo(16.7);
    expect(reloadedCorrection?.percentageScore).toBeCloseTo(33.4);
    expect(reloadedCorrection?.totalGrade).toBe('5');
  });

  it('rejects adjustments for tasks outside the correction-relevant structure', async () => {
    const exam = await examRepo.create({
      title: 'Invalid Adjustment Test',
      assessmentFormat: 'test',
      mode: Exams.ExamMode.Simple,
      structure: {
        parts: [],
        tasks: [createTask('task-a', 'Analysis', 20, 1)],
        allowsComments: true,
        allowsSupportTips: true,
        totalPoints: 20
      },
      gradingKey: { ...gradingKey, totalPoints: 20 },
      printPresets: [],
      candidates: [],
      candidateGroups: [],
      status: 'in-progress'
    });

    await expect(applyPointAdjustmentsUseCase.execute({
      examId: exam.id,
      adjustments: [{ taskId: 'missing-task', suggestedPoints: 10 }]
    })).rejects.toThrow('Task missing-task is not adjustable');
  });
});
