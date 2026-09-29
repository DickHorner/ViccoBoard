import type { Subject, SubjectWorkspaceProfile } from '@viccoboard/core';
import { AdapterRepository } from '@viccoboard/storage';
import type { StorageAdapter } from '@viccoboard/storage';

export class SubjectRepository extends AdapterRepository<Subject> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'subjects');
  }

  mapToEntity(row: any): Subject {
    return {
      id: row.id,
      name: row.name,
      workspaceProfile: row.workspace_profile as SubjectWorkspaceProfile,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  mapToRow(entity: Partial<Subject>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.name !== undefined) row.name = entity.name;
    if (entity.workspaceProfile !== undefined) row.workspace_profile = entity.workspaceProfile;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  async create(
    entity: Omit<Subject, 'id' | 'createdAt' | 'lastModified'>
  ): Promise<Subject> {
    this.assertValid(entity);
    const existing = await this.findAll();
    const normalizedName = entity.name.trim().toLocaleLowerCase('de-DE');

    if (existing.some((subject) => subject.name.trim().toLocaleLowerCase('de-DE') === normalizedName)) {
      throw new Error('Subject name already exists');
    }

    return super.create({
      ...entity,
      name: entity.name.trim()
    });
  }

  private assertValid(subject: Pick<Subject, 'name' | 'workspaceProfile'>): void {
    if (!subject.name.trim()) {
      throw new Error('Subject name is required');
    }

    if (!['generic', 'sport', 'kbr'].includes(subject.workspaceProfile)) {
      throw new Error('Invalid subject workspace profile');
    }
  }
}
