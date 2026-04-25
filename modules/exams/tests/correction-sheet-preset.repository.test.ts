import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  ExamSchemaMigration,
  KbrFeedbackWorkflowMigration
} from '@viccoboard/storage/node';
const uuidv4 = () => crypto.randomUUID();
import { Exams } from '@viccoboard/core';
import { ExamRepository } from '../src/repositories/exam.repository';
import {
  CorrectionSheetPresetRepository,
  createDefaultCorrectionSheetPreset
} from '../src/repositories/correction-sheet-preset.repository';
import { GetCorrectionSheetPresetUseCase } from '../src/use-cases/get-correction-sheet-preset.use-case';
import { SaveCorrectionSheetPresetUseCase } from '../src/use-cases/save-correction-sheet-preset.use-case';

describe('CorrectionSheetPresetRepository', () => {
  let storage: SQLiteStorage;
  let examRepository: ExamRepository;
  let presetRepository: CorrectionSheetPresetRepository;
  let getPresetUseCase: GetCorrectionSheetPresetUseCase;
  let savePresetUseCase: SaveCorrectionSheetPresetUseCase;

  beforeEach(async () => {
    storage = new SQLiteStorage({
      databasePath: ':memory:',
      memory: true
    });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new ExamSchemaMigration(storage));
    storage.registerMigration(new KbrFeedbackWorkflowMigration(storage));
    await storage.migrate();

    examRepository = new ExamRepository(storage.getAdapter());
    presetRepository = new CorrectionSheetPresetRepository(examRepository);
    getPresetUseCase = new GetCorrectionSheetPresetUseCase(presetRepository);
    savePresetUseCase = new SaveCorrectionSheetPresetUseCase(presetRepository);
  });

  afterEach(async () => {
    await storage.close();
  });

  async function createExam(): Promise<Exams.Exam> {
    return examRepository.create({
      title: 'KBR Builder Flow',
      description: 'Persist builder and preset state',
      date: new Date('2026-03-14T00:00:00.000Z'),
      mode: Exams.ExamMode.Simple,
      structure: {
        parts: [],
        tasks: [
          {
            id: 'task-1',
            level: 1,
            order: 1,
            title: 'Aufgabe 1',
            points: 12,
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
        totalPoints: 12
      },
      gradingKey: {
        id: 'grading-1',
        name: 'Default',
        type: Exams.GradingKeyType.Points,
        totalPoints: 12,
        gradeBoundaries: [],
        roundingRule: { type: 'nearest', decimalPlaces: 1 },
        errorPointsToGrade: false,
        customizable: true,
        modifiedAfterCorrection: false
      },
      printPresets: [],
      candidates: [
        {
          id: uuidv4(),
          examId: 'draft',
          firstName: 'Lea',
          lastName: 'Meyer'
        }
      ],
      status: 'draft'
    });
  }

  test('returns a default preset when no preset has been saved yet', async () => {
    const exam = await createExam();

    const preset = await getPresetUseCase.execute(exam.id);

    expect(preset).toEqual(expect.objectContaining({
      id: `correction-sheet-preset:${exam.id}`,
      examId: exam.id,
      name: 'Rückmeldebogen',
      layoutMode: 'standard',
      showTaskComments: true,
      showGeneralComment: true
    }));
  });

  test('persists and reloads builder preset state through the exam as source of truth', async () => {
    const exam = await createExam();

    const savedPreset = await savePresetUseCase.execute({
      ...createDefaultCorrectionSheetPreset(exam.id),
      examId: exam.id,
      layoutMode: 'compact',
      showSignatureArea: true,
      showTaskComments: false,
      headerText: 'Bitte Rückmeldung sorgfältig lesen.',
      footerText: 'Unterschrift der Lehrkraft folgt im Unterricht.'
    });

    const reloadedExam = await examRepository.findById(exam.id);
    const reloadedPreset = await presetRepository.findByExamId(exam.id);

    expect(reloadedExam?.date?.toISOString()).toBe('2026-03-14T00:00:00.000Z');
    expect(reloadedExam?.printPresets).toHaveLength(1);
    expect(reloadedExam?.printPresets[0]?.metadata?.kind).toBe('correction-sheet-preset');
    expect(reloadedPreset).toEqual(expect.objectContaining({
      id: savedPreset.id,
      examId: exam.id,
      layoutMode: 'compact',
      showSignatureArea: true,
      showTaskComments: false,
      headerText: 'Bitte Rückmeldung sorgfältig lesen.',
      footerText: 'Unterschrift der Lehrkraft folgt im Unterricht.'
    }));
  });
});
