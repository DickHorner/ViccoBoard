import { Sport, safeJsonParse, safeJsonStringify } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

const TEMPLATE_TYPE = 'sport-participation-rubric';

export interface ParticipationRubricTemplate {
  id: string;
  name: string;
  rubric: Sport.ParticipationRubricDefinition;
  createdAt: Date;
  lastModified: Date;
}

export class ParticipationRubricTemplateRepository {
  constructor(private readonly adapter: StorageAdapter) {}

  private mapToEntity(row: Record<string, any>): ParticipationRubricTemplate {
    const rubric = safeJsonParse<Sport.ParticipationRubricDefinition | null>(
      row.content, null, 'ParticipationRubricTemplate.content'
    );
    if (!rubric || typeof rubric.id !== 'string' || !Array.isArray(rubric.criteria)) {
      throw new Error('Mitarbeitsvorlage ist beschädigt.');
    }
    return {
      id: row.id,
      name: row.name,
      rubric,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  async findAll(): Promise<ParticipationRubricTemplate[]> {
    const rows = await this.adapter.getAll<Record<string, any>>('templates', { type: TEMPLATE_TYPE });
    return rows
      .map(row => this.mapToEntity(row))
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  async findById(id: string): Promise<ParticipationRubricTemplate | null> {
    const row = await this.adapter.getById<Record<string, any>>('templates', id);
    return row?.type === TEMPLATE_TYPE ? this.mapToEntity(row) : null;
  }

  async create(input: { name: string; rubric: Sport.ParticipationRubricDefinition }): Promise<ParticipationRubricTemplate> {
    const name = input.name.trim();
    if (!name || name.length > 100) {
      throw new Error('Bitte einen Vorlagennamen mit höchstens 100 Zeichen angeben.');
    }
    if ((await this.findAll()).some(template => template.rubric.id === input.rubric.id)) {
      throw new Error('Diese Raster-ID ist bereits als Vorlage gespeichert.');
    }
    const now = new Date();
    const id = crypto.randomUUID();
    await this.adapter.insert('templates', {
      id,
      name,
      type: TEMPLATE_TYPE,
      content: safeJsonStringify(input.rubric, 'ParticipationRubricTemplate.content'),
      created_at: now.toISOString(),
      last_modified: now.toISOString()
    });
    return { id, name, rubric: input.rubric, createdAt: now, lastModified: now };
  }

  async delete(id: string): Promise<void> {
    if (!(await this.findById(id))) throw new Error('Mitarbeitsvorlage wurde nicht gefunden.');
    await this.adapter.delete('templates', id);
  }
}
