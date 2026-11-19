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
import { CorrectionSheetTemplateRepository } from '../src/repositories/correction-sheet-template.repository';

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
    presetRepository = new CorrectionSheetPresetRepository(examRepository, new CorrectionSheetTemplateRepository(storage.getAdapter(), examRepository));
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
  test('applies an independent layout to an exam without modifying the library template', async () => {
    const exam = await createExam();
    const library = new CorrectionSheetTemplateRepository(storage.getAdapter(), examRepository);
    const template = await library.create({
      ...createDefaultCorrectionSheetPreset(''),
      name: 'Allgemeine Rückmeldung',
      headerText: 'Hinweise zur Bearbeitung',
      showTaskComments: false
    });

    await savePresetUseCase.execute({
      ...template.preset,
      id: `correction-sheet-preset:${exam.id}`,
      examId: exam.id
    });

    const linked = await presetRepository.findByExamId(exam.id);
    const unchanged = await library.findById(template.id);
    expect(linked).toEqual(expect.objectContaining({
      examId: exam.id,
      headerText: 'Hinweise zur Bearbeitung',
      showTaskComments: false
    }));
    expect(unchanged?.preset.examId).toBe('');
    expect(unchanged?.id).toBe(template.id);
  });

  test('reuses the latest master layout for old exams without rewriting the exams', async () => {
    const firstExam = await createExam();
    const secondExam = await createExam();
    const library = new CorrectionSheetTemplateRepository(storage.getAdapter(), examRepository);
    const master = await library.create({
      ...createDefaultCorrectionSheetPreset(''),
      name: 'Gemeinsame Gestaltung',
      headerText: 'Fassung 1',
      showSignatureArea: true,
      showSignatureDate: true,
      signaturePositionX: 10,
      signaturePositionY: 20
    });

    for (const exam of [firstExam, secondExam]) {
      await savePresetUseCase.execute({
        ...master.preset,
        examId: exam.id,
        templateId: master.id
      });
    }

    const savedFirst = await examRepository.findById(firstExam.id);
    expect(savedFirst?.printPresets[0].metadata).toEqual({
      kind: 'correction-sheet-preset',
      correctionSheetTemplateId: master.id
    });

    await library.update(master.id, {
      ...master.preset,
      headerText: 'Fassung 2',
      showSignatureDate: false,
      signaturePositionX: 75,
      signaturePositionY: 60
    });

    for (const exam of [firstExam, secondExam]) {
      expect(await getPresetUseCase.execute(exam.id)).toEqual(expect.objectContaining({
        examId: exam.id,
        templateId: master.id,
        headerText: 'Fassung 2',
        showSignatureDate: false,
        signaturePositionX: 75,
        signaturePositionY: 60
      }));
    }
    expect((await examRepository.findById(firstExam.id))?.printPresets).toEqual(savedFirst?.printPresets);
    await expect(library.delete(master.id)).rejects.toThrow('verwendet');

    const detached = await getPresetUseCase.execute(firstExam.id);
    await savePresetUseCase.execute({ ...detached, templateId: undefined });
    expect((await getPresetUseCase.execute(firstExam.id)).templateId).toBeUndefined();
    await expect(library.delete(master.id)).rejects.toThrow('verwendet');

    const secondDetached = await getPresetUseCase.execute(secondExam.id);
    await savePresetUseCase.execute({ ...secondDetached, templateId: undefined });
    await library.delete(master.id);
    expect((await getPresetUseCase.execute(firstExam.id)).headerText).toBe('Fassung 2');
  });

});
