import { AdapterRepository } from '@viccoboard/storage';
import type { ImportBatch } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class ImportBatchRepository extends AdapterRepository<ImportBatch> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'import_batches');
  }

  mapToEntity(row: Record<string, unknown>): ImportBatch {
    return {
      id: row.id as string,
      sourceType: row.source_type as 'demo' | 'live',
      importType: row.import_type as 'student_csv',
      label: row.label as string,
      summary: {
        read: Number(row.summary_read ?? 0),
        valid: Number(row.summary_valid ?? 0),
        imported: Number(row.summary_imported ?? 0),
        skipped: Number(row.summary_skipped ?? 0),
        conflicts: Number(row.summary_conflicts ?? 0),
        errors: Number(row.summary_errors ?? 0)
      },
      metadata: row.metadata ? JSON.parse(row.metadata as string) as Record<string, unknown> : undefined,
      createdAt: new Date(row.created_at as string),
      lastModified: new Date(row.last_modified as string)
    };
  }

  mapToRow(entity: Partial<ImportBatch>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.sourceType !== undefined) row.source_type = entity.sourceType;
    if (entity.importType !== undefined) row.import_type = entity.importType;
    if (entity.label !== undefined) row.label = entity.label;
    if (entity.summary !== undefined) {
      row.summary_read = entity.summary.read;
      row.summary_valid = entity.summary.valid;
      row.summary_imported = entity.summary.imported;
      row.summary_skipped = entity.summary.skipped;
      row.summary_conflicts = entity.summary.conflicts;
      row.summary_errors = entity.summary.errors;
    }
    if (entity.metadata !== undefined) row.metadata = JSON.stringify(entity.metadata);
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  async findBySourceType(sourceType: 'demo' | 'live'): Promise<ImportBatch[]> {
    return this.find({ source_type: sourceType });
  }
}
