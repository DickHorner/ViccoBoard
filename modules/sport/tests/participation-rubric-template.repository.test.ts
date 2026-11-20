import { SQLiteStorage, InitialSchemaMigration } from '@viccoboard/storage/node';
import type { Sport } from '@viccoboard/core';
import { ParticipationRubricTemplateRepository } from '../src/repositories/participation-rubric-template.repository';

describe('ParticipationRubricTemplateRepository', () => {
  let storage: SQLiteStorage;
  let templates: ParticipationRubricTemplateRepository;

  const rubric: Sport.ParticipationRubricDefinition = {
    id: 'local-rubric-v1',
    criteria: [{
      id: 'criterion-1',
      label: 'Testkriterium',
      description: 'Beschreibung',
      levels: [
        { value: 0, description: 'Noch nicht' },
        { value: 1, description: 'Erreicht' }
      ]
    }],
    bonusPoints: 0,
    bonusLabel: '',
    gradeThresholds: [{ minPoints: 1, grade: 1 }],
    fallbackGrade: 5,
    refusalGrade: 6
  };

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    await storage.migrate();
    templates = new ParticipationRubricTemplateRepository(storage.getAdapter());
  });

  afterEach(async () => {
    await storage.close();
  });

  it('saves a class-independent rubric and reloads it through another repository instance', async () => {
    const saved = await templates.create({ name: 'Meine Vorlage', rubric });
    const reopened = new ParticipationRubricTemplateRepository(storage.getAdapter());
    expect(await reopened.findById(saved.id)).toEqual(expect.objectContaining({
      id: saved.id,
      name: 'Meine Vorlage',
      rubric
    }));
    const row = await storage.getAdapter().getById<Record<string, any>>('templates', saved.id);
    expect(row).toEqual(expect.objectContaining({ type: 'sport-participation-rubric' }));
    expect(row).not.toHaveProperty('class_group_id');
    expect(await reopened.findAll()).toHaveLength(1);
  });

  it('does not overwrite an imported template with the same rubric ID', async () => {
    await templates.create({ name: 'Erste', rubric });
    await expect(templates.create({ name: 'Zweite', rubric })).rejects.toThrow('bereits');
    expect(await templates.findAll()).toHaveLength(1);
  });

  it('isolates templates from other template types and leaves assigned snapshots untouched', async () => {
    const saved = await templates.create({ name: 'Meine Vorlage', rubric });
    const snapshot = structuredClone(saved.rubric);
    await storage.getAdapter().insert('templates', {
      id: crypto.randomUUID(),
      name: 'Andere Vorlage',
      type: 'correction-sheet',
      content: '{}',
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString()
    });
    expect(await templates.findAll()).toHaveLength(1);
    await templates.delete(saved.id);
    expect(await templates.findById(saved.id)).toBeNull();
    expect(snapshot).toEqual(rubric);
  });

  it('rejects blank names and refuses deleting foreign template IDs', async () => {
    await expect(templates.create({ name: '  ', rubric })).rejects.toThrow('Vorlagennamen');
    await expect(templates.delete('does-not-exist')).rejects.toThrow('nicht gefunden');
  });
});
