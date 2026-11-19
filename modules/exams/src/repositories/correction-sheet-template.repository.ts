import { Exams, safeJsonParse, safeJsonStringify } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';
import { createDefaultCorrectionSheetPreset } from './correction-sheet-preset.repository';
import type { ExamRepository } from './exam.repository';

const TEMPLATE_TYPE = 'correction-sheet';

export interface CorrectionSheetTemplate {
  id: string;
  name: string;
  preset: Exams.CorrectionSheetPreset;
  createdAt: Date;
  lastModified: Date;
}

/**
 * Reusable print layouts live in the existing generic templates store.
 * They do not belong to an exam and never contain an exam or candidate identity.
 */
export class CorrectionSheetTemplateRepository {
  constructor(
    private readonly adapter: StorageAdapter,
    private readonly examRepository: ExamRepository
  ) {}

  private mapToEntity(row: Record<string, any>): CorrectionSheetTemplate {
    const stored = safeJsonParse(
      row.content,
      {},
      'CorrectionSheetTemplate.content'
    ) as Partial<Exams.CorrectionSheetPreset>;
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
      throw new Error('Druckbogenvorlage ist beschädigt.');
    }

    return {
      id: row.id,
      name: row.name,
      preset: {
        ...createDefaultCorrectionSheetPreset(''),
        ...stored,
        id: `correction-sheet-preset:template:${row.id}`,
        examId: '',
        templateId: undefined,
        name: row.name,
        updatedAt: new Date(row.last_modified)
      },
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  private normalizedPreset(
    id: string,
    input: Exams.CorrectionSheetPreset,
    now: Date
  ): Exams.CorrectionSheetPreset {
    const name = input.name.trim();
    if (!name || name.length > 120) {
      throw new Error('Bitte einen Vorlagennamen mit höchstens 120 Zeichen angeben.');
    }
    return {
      ...input,
      id: `correction-sheet-preset:template:${id}`,
      examId: '',
      templateId: undefined,
      name,
      updatedAt: now
    };
  }

  async findAll(): Promise<CorrectionSheetTemplate[]> {
    const rows = await this.adapter.getAll<Record<string, any>>('templates', {
      type: TEMPLATE_TYPE
    });
    return rows
      .map(row => this.mapToEntity(row))
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  async findById(id: string): Promise<CorrectionSheetTemplate | null> {
    const row = await this.adapter.getById<Record<string, any>>('templates', id);
    return row?.type === TEMPLATE_TYPE ? this.mapToEntity(row) : null;
  }

  async create(input: Exams.CorrectionSheetPreset): Promise<CorrectionSheetTemplate> {
    const id = crypto.randomUUID();
    const now = new Date();
    const preset = this.normalizedPreset(id, input, now);

    await this.adapter.insert('templates', {
      id,
      name: preset.name,
      type: TEMPLATE_TYPE,
      content: safeJsonStringify(preset, 'CorrectionSheetTemplate.content'),
      created_at: now.toISOString(),
      last_modified: now.toISOString()
    });
    return { id, name: preset.name, preset, createdAt: now, lastModified: now };
  }

  async update(id: string, input: Exams.CorrectionSheetPreset): Promise<CorrectionSheetTemplate> {
    const current = await this.findById(id);
    if (!current) throw new Error('Die Druckbogenvorlage wurde nicht gefunden.');

    const now = new Date();
    const preset = this.normalizedPreset(id, input, now);
    await this.adapter.update('templates', id, {
      name: preset.name,
      content: safeJsonStringify(preset, 'CorrectionSheetTemplate.content'),
      last_modified: now.toISOString()
    });
    return {
      ...current,
      name: preset.name,
      preset,
      lastModified: now
    };
  }

  async delete(id: string): Promise<void> {
    if (!(await this.findById(id))) {
      throw new Error('Die Druckbogenvorlage wurde nicht gefunden.');
    }
    const exams = await this.examRepository.findAll();
    const linked = exams.some(exam => exam.printPresets.some(preset =>
      preset.metadata?.correctionSheetTemplateId === id
    ));
    if (linked) throw new Error('Diese Vorlage wird von Prüfungen verwendet und kann nicht gelöscht werden.');
    await this.adapter.delete('templates', id);
  }
}
