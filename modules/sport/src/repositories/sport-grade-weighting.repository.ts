/**
 * Sport GradeWeighting Repository
 * Stores a single weighting record in grade_weightings.
 */

import { SportSchema } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class SportGradeWeightingRepository {
  private readonly tableName = 'grade_weightings';
  private readonly defaultId = 'default';

  constructor(private adapter: StorageAdapter) {}

  async set(weighting: SportSchema.SportGradeWeighting): Promise<SportSchema.SportGradeWeighting> {
    const existing = await this.adapter.getById(this.tableName, this.defaultId);
    const row = this.mapToRow(weighting);

    if (existing) {
      await this.adapter.update(this.tableName, this.defaultId, row);
      return weighting;
    }

    await this.adapter.insert(this.tableName, { id: this.defaultId, ...row });
    return weighting;
  }

  async get(): Promise<SportSchema.SportGradeWeighting | null> {
    const row = await this.adapter.getById(this.tableName, this.defaultId);
    return row ? this.mapToEntity(row) : null;
  }

  private mapToEntity(row: Record<string, unknown>): SportSchema.SportGradeWeighting {
    return {
      attendance: row.attendance as number,
      grades: row.grades as number,
      remarks: row.remarks as number,
      wow: row.wow as number
    };
  }

  private mapToRow(entity: SportSchema.SportGradeWeighting): Record<string, unknown> {
    return {
      attendance: entity.attendance,
      grades: entity.grades,
      remarks: entity.remarks,
      wow: entity.wow
    };
  }
}
