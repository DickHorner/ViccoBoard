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
import { UpdateGradingKeyUseCase } from '../src/use-cases/update-grading-key.use-case';
import { GradingKeyService } from '../src/services/grading-key.service';
import { Exams } from '@viccoboard/core';

describe('UpdateGradingKeyUseCase Integration Tests (#324)', () => {
  let storage: SQLiteStorage;
  let correctionRepo: CorrectionEntryRepository;
  let examRepo: ExamRepository;
  let recordCorrectionUseCase: RecordCorrectionUseCase;
  let updateGradingKeyUseCase: UpdateGradingKeyUseCase;

  const initialGradingKey: Exams.GradingKey = {
    id: 'grading-key-1',
    name: 'German 1-6 Initial',
    type: Exams.GradingKeyType.Percentage,
    totalPoints: 100,
    gradeBoundaries: [
      { grade: '1', minPercentage: 90, maxPercentage: 100, displayValue: '1' },
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
    updateGradingKeyUseCase = new UpdateGradingKeyUseCase(examRepo, correctionRepo);
  });

  afterEach(async () => {
    await storage.close();
  });

  it('should update grading key post-correction and recalculate affected grades persistently without data loss', async () => {
    // 1. Create initial exam
    const exam = await examRepo.create({
      title: 'Mathe Test',
      assessmentFormat: 'test',
      mode: Exams.ExamMode.Simple,
      structure: { parts: [], tasks: [], allowsComments: true, allowsSupportTips: true, totalPoints: 100 },
      gradingKey: initialGradingKey,
      printPresets: [],
      candidates: [
        { id: 'c1', examId: 'temp', firstName: 'Alice', lastName: 'Schmidt' },
        { id: 'c2', examId: 'temp', firstName: 'Bob', lastName: 'Müller' }
      ],
      candidateGroups: [],
      status: 'in-progress'
    });

    // 2. Record initial corrections
    // Candidate 1 gets 88 points -> Under initial key (90% for 1, 75% for 2) this is Grade 2
    // Candidate 2 gets 55 points -> Under initial key (45% for 4, 60% for 3) this is Grade 4
    const correction1 = await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'c1',
      taskScores: [{ taskId: 't1', points: 88, maxPoints: 100, timestamp: new Date() }]
    });
    const correction2 = await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'c2',
      taskScores: [{ taskId: 't1', points: 55, maxPoints: 100, timestamp: new Date() }]
    });

    expect(correction1.totalGrade).toBe('2');
    expect(correction2.totalGrade).toBe('4');

    // 3. Lower the boundary for Grade 1 from 90% to 85%
    const newBoundaries: Exams.GradeBoundary[] = [
      { grade: '1', minPercentage: 85, maxPercentage: 100, displayValue: '1' },
      { grade: '2', minPercentage: 75, maxPercentage: 85, displayValue: '2' },
      { grade: '3', minPercentage: 60, maxPercentage: 75, displayValue: '3' },
      { grade: '4', minPercentage: 45, maxPercentage: 60, displayValue: '4' },
      { grade: '5', minPercentage: 20, maxPercentage: 45, displayValue: '5' },
      { grade: '6', minPercentage: 0, maxPercentage: 20, displayValue: '6' }
    ];

    const updateResult = await updateGradingKeyUseCase.execute({
      examId: exam.id,
      newGradingKey: { gradeBoundaries: newBoundaries },
      reason: 'Notengrenze für 1 gesenkt'
    });

    expect(updateResult.affectedCorrectionsCount).toBe(1);
    expect(updateResult.affectedGrades).toEqual([
      { candidateId: 'c1', oldGrade: '2', newGrade: '1' }
    ]);
    expect(updateResult.exam.gradingKey.modifiedAfterCorrection).toBe(true);
    expect(updateResult.exam.gradingKey.history?.length).toBe(1);

    // 4. Verify DB reload of corrections
    const reloadedCorrection1 = await correctionRepo.findByExamAndCandidate(exam.id, 'c1');
    const reloadedCorrection2 = await correctionRepo.findByExamAndCandidate(exam.id, 'c2');

    expect(reloadedCorrection1?.totalGrade).toBe('1');
    expect(reloadedCorrection1?.totalPoints).toBe(88); // Original score preserved!
    expect(reloadedCorrection2?.totalGrade).toBe('4');
    expect(reloadedCorrection2?.totalPoints).toBe(55); // Original score preserved!

    // 5. Verify DB reload of exam and history persistence
    const reloadedExam = await examRepo.findById(exam.id);
    expect(reloadedExam?.gradingKey.modifiedAfterCorrection).toBe(true);
    expect(reloadedExam?.gradingKey.history?.length).toBe(1);
    expect(reloadedExam?.gradingKey.history?.[0].reason).toBe('Notengrenze für 1 gesenkt');
  });

  it('should support reverting to a previous grading key revision persistently', async () => {
    // 1. Create exam & corrections
    const exam = await examRepo.create({
      title: 'Physik Test',
      assessmentFormat: 'test',
      mode: Exams.ExamMode.Simple,
      structure: { parts: [], tasks: [], allowsComments: true, allowsSupportTips: true, totalPoints: 100 },
      gradingKey: initialGradingKey,
      printPresets: [],
      candidates: [{ id: 'c1', examId: 'temp', firstName: 'Clara', lastName: 'Weber' }],
      candidateGroups: [],
      status: 'in-progress'
    });

    await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'c1',
      taskScores: [{ taskId: 't1', points: 88, maxPoints: 100, timestamp: new Date() }]
    });

    // 2. Modify key (88pts -> Grade 1)
    const modifiedBoundaries: Exams.GradeBoundary[] = [
      { grade: '1', minPercentage: 85, maxPercentage: 100, displayValue: '1' },
      { grade: '2', minPercentage: 75, maxPercentage: 85, displayValue: '2' },
      { grade: '3', minPercentage: 0, maxPercentage: 75, displayValue: '3' }
    ];

    await updateGradingKeyUseCase.execute({
      examId: exam.id,
      newGradingKey: { gradeBoundaries: modifiedBoundaries }
    });

    let correction = await correctionRepo.findByExamAndCandidate(exam.id, 'c1');
    expect(correction?.totalGrade).toBe('1');

    // 3. Revert back to previous key
    const revertResult = await updateGradingKeyUseCase.revert(exam.id, 'Zurückgesetzt');

    expect(revertResult.affectedCorrectionsCount).toBe(1);
    expect(revertResult.affectedGrades).toEqual([
      { candidateId: 'c1', oldGrade: '1', newGrade: '2' }
    ]);

    // 4. Verify candidate grade reverted in DB
    correction = await correctionRepo.findByExamAndCandidate(exam.id, 'c1');
    expect(correction?.totalGrade).toBe('2');

    // 5. Verify exam history has revert log
    const reloadedExam = await examRepo.findById(exam.id);
    expect(reloadedExam?.gradingKey.history?.length).toBe(2);
    expect(reloadedExam?.gradingKey.history?.[1].reason).toBe('Zurückgesetzt');
  });

  it('should process error-points mode correctly in real correction workflow', async () => {
    const errorPointsKey: Exams.GradingKey = {
      id: 'error-key-1',
      name: 'Diktat Fehlerpunkte',
      type: Exams.GradingKeyType.ErrorPoints,
      totalPoints: 100,
      gradeBoundaries: [
        { grade: '1', minPercentage: 90, maxPercentage: 100, displayValue: '1' },
        { grade: '2', minPercentage: 80, maxPercentage: 90, displayValue: '2' },
        { grade: '3', minPercentage: 70, maxPercentage: 80, displayValue: '3' },
        { grade: '4', minPercentage: 50, maxPercentage: 70, displayValue: '4' },
        { grade: '5', minPercentage: 20, maxPercentage: 50, displayValue: '5' },
        { grade: '6', minPercentage: 0, maxPercentage: 20, displayValue: '6' }
      ],
      roundingRule: { type: 'nearest', decimalPlaces: 1 },
      errorPointsToGrade: true,
      customizable: true,
      modifiedAfterCorrection: false
    };

    const exam = await examRepo.create({
      title: 'Deutsch Diktat',
      assessmentFormat: 'test',
      mode: Exams.ExamMode.Simple,
      structure: { parts: [], tasks: [], allowsComments: true, allowsSupportTips: true, totalPoints: 100 },
      gradingKey: errorPointsKey,
      printPresets: [],
      candidates: [{ id: 'c1', examId: 'temp', firstName: 'David', lastName: 'Kaiser' }],
      candidateGroups: [],
      status: 'in-progress'
    });

    // Student has 12 error points on 100 max points -> net score = 88 points (88%) -> Grade 2 (80-90%)
    const correction = await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'c1',
      taskScores: [{ taskId: 'diktat', points: 12, maxPoints: 100, timestamp: new Date() }]
    });

    expect(correction.percentageScore).toBe(88);
    expect(correction.totalGrade).toBe('2');

    // Reload from DB
    const reloaded = await correctionRepo.findByExamAndCandidate(exam.id, 'c1');
    expect(reloaded?.percentageScore).toBe(88);
    expect(reloaded?.totalGrade).toBe('2');
  });
});
