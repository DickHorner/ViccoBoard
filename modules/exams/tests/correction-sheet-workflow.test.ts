import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  ExamSchemaMigration,
  CorrectionSchemaMigration,
  KbrFeedbackWorkflowMigration
} from '@viccoboard/storage/node';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { Exams } from '@viccoboard/core';
import { ExamRepository } from '../src/repositories/exam.repository';
import { CorrectionEntryRepository } from '../src/repositories/correction-entry.repository';
import {
  CorrectionSheetPresetRepository,
  createDefaultCorrectionSheetPreset
} from '../src/repositories/correction-sheet-preset.repository';
import { RecordCorrectionUseCase } from '../src/use-cases/record-correction.use-case-v2';
import { GetCorrectionSheetPresetUseCase } from '../src/use-cases/get-correction-sheet-preset.use-case';
import { SaveCorrectionSheetPresetUseCase } from '../src/use-cases/save-correction-sheet-preset.use-case';
import { BuildCorrectionSheetProjectionUseCase } from '../src/use-cases/build-correction-sheet-projection.use-case';
import { ExportCorrectionSheetsPdfUseCase } from '../src/use-cases/export-correction-sheets-pdf.use-case';

describe('KBR correction sheet workflow', () => {
  let storage: SQLiteStorage;
  let examRepository: ExamRepository;
  let correctionRepository: CorrectionEntryRepository;
  let presetRepository: CorrectionSheetPresetRepository;
  let recordCorrectionUseCase: RecordCorrectionUseCase;
  let getPresetUseCase: GetCorrectionSheetPresetUseCase;
  let savePresetUseCase: SaveCorrectionSheetPresetUseCase;
  let buildProjectionUseCase: BuildCorrectionSheetProjectionUseCase;
  let exportSheetsUseCase: ExportCorrectionSheetsPdfUseCase;

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
    storage.registerMigration(new KbrFeedbackWorkflowMigration(storage));
    await storage.migrate();

    examRepository = new ExamRepository(storage.getAdapter());
    correctionRepository = new CorrectionEntryRepository(storage.getAdapter());
    presetRepository = new CorrectionSheetPresetRepository(examRepository);
    recordCorrectionUseCase = new RecordCorrectionUseCase(correctionRepository, examRepository);
    getPresetUseCase = new GetCorrectionSheetPresetUseCase(presetRepository);
    savePresetUseCase = new SaveCorrectionSheetPresetUseCase(presetRepository);
    buildProjectionUseCase = new BuildCorrectionSheetProjectionUseCase(
      examRepository,
      correctionRepository,
      getPresetUseCase
    );
    exportSheetsUseCase = new ExportCorrectionSheetsPdfUseCase(
      examRepository,
      buildProjectionUseCase,
      correctionRepository
    );
  });

  afterEach(async () => {
    await storage.close();
  });

  async function createExam(): Promise<Exams.Exam> {
    return examRepository.create({
      title: 'Deutsch Klassenarbeit',
      date: new Date('2026-02-20T00:00:00.000Z'),
      mode: Exams.ExamMode.Simple,
      structure: {
        parts: [
          {
            id: 'part-a',
            name: 'Teil A',
            taskIds: ['task-1', 'task-2'],
            calculateSubScore: true,
            scoreType: 'points',
            printable: true,
            order: 1
          }
        ],
        tasks: [
          {
            id: 'task-1',
            level: 1,
            order: 1,
            title: 'Inhaltsangabe',
            points: 10,
            bonusPoints: 0,
            isChoice: false,
            criteria: [],
            allowComments: true,
            allowSupportTips: false,
            commentBoxEnabled: true,
            subtasks: []
          },
          {
            id: 'task-2',
            level: 1,
            order: 2,
            title: 'Sprachanalyse',
            points: 15,
            bonusPoints: 0,
            isChoice: false,
            criteria: [],
            allowComments: true,
            allowSupportTips: false,
            commentBoxEnabled: true,
            subtasks: []
          }
        ],
        allowsComments: true,
        allowsSupportTips: false,
        totalPoints: 25
      },
      gradingKey: {
        id: 'grading-1',
        name: 'KBR',
        type: Exams.GradingKeyType.Percentage,
        totalPoints: 25,
        gradeBoundaries: [
          { grade: '1', minPercentage: 87.5, maxPercentage: 100, displayValue: '1' },
          { grade: '2', minPercentage: 75, maxPercentage: 87.49, displayValue: '2' },
          { grade: '3', minPercentage: 62.5, maxPercentage: 74.99, displayValue: '3' },
          { grade: '4', minPercentage: 50, maxPercentage: 62.49, displayValue: '4' },
          { grade: '5', minPercentage: 25, maxPercentage: 49.99, displayValue: '5' },
          { grade: '6', minPercentage: 0, maxPercentage: 24.99, displayValue: '6' }
        ],
        roundingRule: { type: 'nearest', decimalPlaces: 1 },
        errorPointsToGrade: false,
        customizable: true,
        modifiedAfterCorrection: false
      },
      printPresets: [],
      candidates: [
        { id: 'cand-1', examId: 'draft', firstName: 'Lea', lastName: 'Meyer' },
        { id: 'cand-2', examId: 'draft', firstName: 'Noah', lastName: 'Schmidt' }
      ],
      status: 'in-progress'
    });
  }

  test('saves and reloads correction data for a candidate workflow', async () => {
    const exam = await createExam();

    await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'cand-1',
      taskScores: [
        { taskId: 'task-1', points: 8, maxPoints: 10, comment: 'Struktur klar', timestamp: new Date() },
        { taskId: 'task-2', points: 10, maxPoints: 15, comment: 'Belege ausbauen', timestamp: new Date() }
      ],
      comments: [
        {
          level: 'exam',
          text: 'Gute Grundlage, bei den Belegen noch präziser werden.',
          printable: true,
          availableAfterReturn: true
        }
      ]
    });

    const saved = await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'cand-1',
      taskScores: [
        { taskId: 'task-1', points: 9, maxPoints: 10, comment: 'Struktur sehr klar', timestamp: new Date() },
        { taskId: 'task-2', points: 11, maxPoints: 15, comment: 'Argumente nachvollziehbar', timestamp: new Date() }
      ],
      comments: [
        {
          level: 'exam',
          text: 'Saubere Überarbeitung mit nachvollziehbarer Argumentation.',
          printable: true,
          availableAfterReturn: true
        }
      ],
      finalizeCorrection: true
    });

    const reloaded = await correctionRepository.findByExamAndCandidate(exam.id, 'cand-1');

    expect(saved.status).toBe('completed');
    expect(reloaded?.totalPoints).toBe(20);
    expect(reloaded?.totalGrade).toBe('2');
    expect(reloaded?.taskScores.map((score) => score.comment)).toEqual([
      'Struktur sehr klar',
      'Argumente nachvollziehbar'
    ]);
    expect(reloaded?.comments).toHaveLength(1);
    expect(reloaded?.comments[0]?.text).toBe('Saubere Überarbeitung mit nachvollziehbarer Argumentation.');
  });

  test('builds a printable projection from exam, correction and preset', async () => {
    const exam = await createExam();

    await savePresetUseCase.execute({
      ...createDefaultCorrectionSheetPreset(exam.id),
      examId: exam.id,
      layoutMode: 'compact',
      headerText: 'Bitte lesen Sie die Rückmeldung aufmerksam.',
      footerText: 'Rückfragen im nächsten Unterricht.',
      showSignatureArea: true
    });

    await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'cand-1',
      taskScores: [
        { taskId: 'task-1', points: 9, maxPoints: 10, comment: 'Sehr strukturiert', timestamp: new Date() },
        { taskId: 'task-2', points: 12, maxPoints: 15, comment: 'Gute Textbelege', timestamp: new Date() }
      ],
      comments: [
        {
          level: 'exam',
          text: 'Insgesamt eine überzeugende Leistung.',
          printable: true,
          availableAfterReturn: true
        }
      ],
      finalizeCorrection: true
    });

    const projection = await buildProjectionUseCase.execute(exam.id, 'cand-1');

    expect(projection).toEqual(expect.objectContaining({
      examId: exam.id,
      examTitle: 'Deutsch Klassenarbeit',
      candidateId: 'cand-1',
      candidateName: 'Lea Meyer',
      maxPoints: 25,
      totalPoints: 21,
      grade: '2',
      layoutMode: 'compact',
      headerText: 'Bitte lesen Sie die Rückmeldung aufmerksam.',
      footerText: 'Rückfragen im nächsten Unterricht.',
      showSignatureArea: true
    }));
    expect(projection.taskRows).toEqual([
      expect.objectContaining({
        taskId: 'task-1',
        label: 'Inhaltsangabe',
        maxPoints: 10,
        awardedPoints: 9,
        comment: 'Sehr strukturiert',
        partLabel: 'Teil A'
      }),
      expect.objectContaining({
        taskId: 'task-2',
        label: 'Sprachanalyse',
        maxPoints: 15,
        awardedPoints: 12,
        comment: 'Gute Textbelege',
        partLabel: 'Teil A'
      })
    ]);
  });

  test('exports single and combined correction-sheet PDFs for the happy path', async () => {
    const exam = await createExam();

    await savePresetUseCase.execute({
      ...createDefaultCorrectionSheetPreset(exam.id),
      examId: exam.id,
      layoutMode: 'standard',
      headerText: 'KBR Rückmeldebogen',
      footerText: 'Elternunterschrift optional'
    });

    await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'cand-1',
      taskScores: [
        { taskId: 'task-1', points: 9, maxPoints: 10, comment: 'Strukturiert', timestamp: new Date() },
        { taskId: 'task-2', points: 12, maxPoints: 15, comment: 'Differenziert', timestamp: new Date() }
      ],
      comments: [
        {
          level: 'exam',
          text: 'Sehr solide Arbeit.',
          printable: true,
          availableAfterReturn: true
        }
      ],
      finalizeCorrection: true
    });

    await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'cand-2',
      taskScores: [
        { taskId: 'task-1', points: 7, maxPoints: 10, comment: 'Einordnung stimmt', timestamp: new Date() },
        { taskId: 'task-2', points: 9, maxPoints: 15, comment: 'Mehr Belege nötig', timestamp: new Date() }
      ],
      comments: [
        {
          level: 'exam',
          text: 'Gedanklich nachvollziehbar, sprachlich noch ausbaufähig.',
          printable: true,
          availableAfterReturn: true
        }
      ],
      finalizeCorrection: true
    });

    const singlePdf = await exportSheetsUseCase.exportCurrentCandidatePdf(exam.id, 'cand-1');
    const allPdf = await exportSheetsUseCase.exportAllCandidatesPdf(exam.id);

    const singleDocument = await PDFDocument.load(singlePdf.bytes);
    const allDocument = await PDFDocument.load(allPdf.bytes);

    expect(singlePdf.fileName).toContain('rueckmeldebogen');
    expect(singlePdf.candidateCount).toBe(1);
    expect(singleDocument.getPageCount()).toBe(1);

    expect(allPdf.fileName).toContain('rueckmeldeboegen');
    expect(allPdf.candidateCount).toBe(2);
    expect(allDocument.getPageCount()).toBe(2);
  });

  test('single export is blocked when correction is in-progress', async () => {
    const exam = await createExam();

    await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'cand-1',
      taskScores: [
        { taskId: 'task-1', points: 5, maxPoints: 10, comment: '', timestamp: new Date() },
        { taskId: 'task-2', points: 8, maxPoints: 15, comment: '', timestamp: new Date() }
      ],
      comments: [],
      finalizeCorrection: false
    });

    await expect(
      exportSheetsUseCase.exportCurrentCandidatePdf(exam.id, 'cand-1')
    ).rejects.toThrow(/noch nicht abgeschlossen/);
  });

  test('single export is blocked when no correction exists', async () => {
    const exam = await createExam();

    await expect(
      exportSheetsUseCase.exportCurrentCandidatePdf(exam.id, 'cand-1')
    ).rejects.toThrow(/Keine Korrektur/);
  });

  test('bulk export only includes completed corrections in mixed exam', async () => {
    const exam = await createExam();

    await savePresetUseCase.execute({
      ...createDefaultCorrectionSheetPreset(exam.id),
      examId: exam.id
    });

    // cand-1: completed
    await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'cand-1',
      taskScores: [
        { taskId: 'task-1', points: 9, maxPoints: 10, comment: 'Gut', timestamp: new Date() },
        { taskId: 'task-2', points: 13, maxPoints: 15, comment: 'Sehr gut', timestamp: new Date() }
      ],
      comments: [],
      finalizeCorrection: true
    });

    // cand-2: in-progress, not finalized
    await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'cand-2',
      taskScores: [
        { taskId: 'task-1', points: 4, maxPoints: 10, comment: '', timestamp: new Date() },
        { taskId: 'task-2', points: 6, maxPoints: 15, comment: '', timestamp: new Date() }
      ],
      comments: [],
      finalizeCorrection: false
    });

    const allPdf = await exportSheetsUseCase.exportAllCandidatesPdf(exam.id);
    const allDocument = await PDFDocument.load(allPdf.bytes);

    // Only cand-1 (completed) must appear
    expect(allPdf.candidateCount).toBe(1);
    expect(allDocument.getPageCount()).toBe(1);
  });

  test('bulk export throws when no completed corrections exist', async () => {
    const exam = await createExam();

    // Both candidates have in-progress corrections
    await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'cand-1',
      taskScores: [
        { taskId: 'task-1', points: 5, maxPoints: 10, comment: '', timestamp: new Date() },
        { taskId: 'task-2', points: 7, maxPoints: 15, comment: '', timestamp: new Date() }
      ],
      comments: [],
      finalizeCorrection: false
    });

    await expect(
      exportSheetsUseCase.exportAllCandidatesPdf(exam.id)
    ).rejects.toThrow(/mindestens eine abgeschlossene Korrektur/);
  });

  test('bulk export throws when no corrections exist at all', async () => {
    const exam = await createExam();

    await expect(
      exportSheetsUseCase.exportAllCandidatesPdf(exam.id)
    ).rejects.toThrow(/mindestens eine abgeschlossene Korrektur/);
  });

  test('projection use case rejects non-completed correction by default', async () => {
    const exam = await createExam();

    await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'cand-1',
      taskScores: [
        { taskId: 'task-1', points: 5, maxPoints: 10, comment: '', timestamp: new Date() },
        { taskId: 'task-2', points: 7, maxPoints: 15, comment: '', timestamp: new Date() }
      ],
      comments: [],
      finalizeCorrection: false
    });

    await expect(
      buildProjectionUseCase.execute(exam.id, 'cand-1')
    ).rejects.toThrow(/noch nicht abgeschlossen/);
  });

  test('projection use case allows non-completed correction with allowIncomplete option', async () => {
    const exam = await createExam();

    await recordCorrectionUseCase.execute({
      examId: exam.id,
      candidateId: 'cand-1',
      taskScores: [
        { taskId: 'task-1', points: 5, maxPoints: 10, comment: '', timestamp: new Date() },
        { taskId: 'task-2', points: 7, maxPoints: 15, comment: '', timestamp: new Date() }
      ],
      comments: [],
      finalizeCorrection: false
    });

    const projection = await buildProjectionUseCase.execute(exam.id, 'cand-1', { allowIncomplete: true });
    expect(projection.candidateId).toBe('cand-1');
    expect(projection.totalPoints).toBe(12);
  });
});
