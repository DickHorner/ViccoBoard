import { SQLiteStorage, InitialSchemaMigration, GradingSchemaMigration, ExamSchemaMigration } from '@viccoboard/storage/node';
import { PDFDocument } from 'pdf-lib';
import { ExamRepository } from '../src/repositories/exam.repository';
import { CorrectionEntryRepository } from '../src/repositories/correction-entry.repository';
import {
  CorrectionSheetTemplateRepository
} from '../src/repositories/correction-sheet-template.repository';
import {
  CorrectionSheetPresetRepository,
  createDefaultCorrectionSheetPreset
} from '../src/repositories/correction-sheet-preset.repository';
import { GetCorrectionSheetPresetUseCase } from '../src/use-cases/get-correction-sheet-preset.use-case';
import { BuildCorrectionSheetProjectionUseCase } from '../src/use-cases/build-correction-sheet-projection.use-case';
import { ExportCorrectionSheetsPdfUseCase } from '../src/use-cases/export-correction-sheets-pdf.use-case';

describe('CorrectionSheetTemplateRepository', () => {
  let storage: SQLiteStorage;
  let templates: CorrectionSheetTemplateRepository;

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new ExamSchemaMigration(storage));
    await storage.migrate();
    templates = new CorrectionSheetTemplateRepository(storage.getAdapter(), new ExamRepository(storage.getAdapter()));
  });

  afterEach(async () => {
    await storage.close();
  });

  it('creates, updates, lists and deletes reusable layouts without an exam', async () => {
    const preset = createDefaultCorrectionSheetPreset('');
    preset.name = 'Klausur Rückmeldung';
    preset.headerText = 'Rückmeldung zum Lernstand';
    const saved = await templates.create(preset);

    expect(saved.id).toBeTruthy();
    expect(saved.preset.examId).toBe('');
    expect(saved.preset.headerText).toBe('Rückmeldung zum Lernstand');

    const reopened = new CorrectionSheetTemplateRepository(storage.getAdapter(), new ExamRepository(storage.getAdapter()));
    expect(await reopened.findAll()).toEqual([
      expect.objectContaining({ id: saved.id, name: 'Klausur Rückmeldung' })
    ]);

    const renamed = await templates.update(saved.id, {
      ...preset,
      examId: 'should-not-be-persisted',
      name: 'Überarbeitete Vorlage',
      showTaskComments: false
    });
    expect(renamed.name).toBe('Überarbeitete Vorlage');
    expect((await reopened.findById(saved.id))?.preset).toEqual(expect.objectContaining({
      id: `correction-sheet-preset:template:${saved.id}`,
      examId: '',
      showTaskComments: false
    }));

    await templates.delete(saved.id);
    expect(await reopened.findById(saved.id)).toBeNull();
  });

  it('isolates sheet layouts from other records in the generic templates table', async () => {
    const id = crypto.randomUUID();
    await storage.getAdapter().insert('templates', {
      id,
      name: 'Andere Vorlage',
      type: 'other',
      content: '{}',
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString()
    });

    expect(await templates.findById(id)).toBeNull();
    expect(await templates.findAll()).toEqual([]);
    await expect(templates.delete(id)).rejects.toThrow('nicht gefunden');
    await expect(templates.update(id, createDefaultCorrectionSheetPreset(''))).rejects.toThrow('nicht gefunden');
    expect(await storage.getAdapter().getById('templates', id)).toBeTruthy();
  });

  it('rejects blank template names and corrupt template content', async () => {
    await expect(templates.create({
      ...createDefaultCorrectionSheetPreset(''),
      name: '   '
    })).rejects.toThrow('Vorlagennamen');

    const id = crypto.randomUUID();
    await storage.getAdapter().insert('templates', {
      id,
      name: 'Defekt',
      type: 'correction-sheet',
      content: 'null',
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString()
    });
    await expect(templates.findById(id)).rejects.toThrow('beschädigt');
  });

  it('renders a standalone PDF preview without creating an exam', async () => {
    const examRepository = new ExamRepository(storage.getAdapter());
    const presetRepository = new CorrectionSheetPresetRepository(examRepository, new CorrectionSheetTemplateRepository(storage.getAdapter(), examRepository));
    const getPreset = new GetCorrectionSheetPresetUseCase(presetRepository);
    const corrections = new CorrectionEntryRepository(storage.getAdapter());
    const builder = new BuildCorrectionSheetProjectionUseCase(examRepository, corrections, getPreset);
    const exporter = new ExportCorrectionSheetsPdfUseCase(examRepository, builder, corrections);

    const preset = {
      ...createDefaultCorrectionSheetPreset(''),
      name: 'Neutrale Vorlage',
      headerText: 'Hinweise zur Rückmeldung'
    };
    const document = await exporter.previewStandaloneDesignPdf(preset);
    const pdf = await PDFDocument.load(document.bytes);

    expect(pdf.getPageCount()).toBe(1);
    expect(document.candidateCount).toBe(1);
    expect(document.fileName).toContain('neutrale-vorlage');
    await expect(exporter.previewStandaloneDesignPdf({
      ...preset, examId: 'exam-1'
    })).rejects.toThrow('keiner Prüfung');
  });
});
