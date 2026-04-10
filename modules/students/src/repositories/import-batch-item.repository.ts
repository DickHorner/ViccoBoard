import { AdapterRepository } from '@viccoboard/storage';
import type { ImportBatchItem } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class ImportBatchItemRepository extends AdapterRepository<ImportBatchItem> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'import_batch_items');
  }

  mapToEntity(row: Record<string, unknown>): ImportBatchItem {
    return {
      id: row.id as string,
      batchId: row.batch_id as string,
      entityType: row.entity_type as 'student' | 'class_group',
      entityId: row.entity_id as string,
      action: row.action as 'created' | 'reused' | 'skipped' | 'conflict',
      payload: row.payload ? JSON.parse(row.payload as string) as Record<string, unknown> : undefined,
      createdAt: new Date(row.created_at as string),
      lastModified: new Date(row.last_modified as string)
    };
  }

  mapToRow(entity: Partial<ImportBatchItem>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.batchId !== undefined) row.batch_id = entity.batchId;
    if (entity.entityType !== undefined) row.entity_type = entity.entityType;
    if (entity.entityId !== undefined) row.entity_id = entity.entityId;
    if (entity.action !== undefined) row.action = entity.action;
    if (entity.payload !== undefined) row.payload = JSON.stringify(entity.payload);
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  async findByBatchId(batchId: string): Promise<ImportBatchItem[]> {
    return this.find({ batch_id: batchId });
  }

  async findByEntity(entityType: 'student' | 'class_group', entityId: string): Promise<ImportBatchItem[]> {
    return this.find({ entity_type: entityType, entity_id: entityId });
  }
}
