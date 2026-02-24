/**
 * Sportabzeichen Standard Repository
 * Handles persistence of age-based Sportabzeichen standards
 */

import { AdapterRepository } from '@viccoboard/storage';
import { Sport} from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class SportabzeichenStandardRepository extends AdapterRepository<Sport.SportabzeichenStandard> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'Sportabzeichen_standards');
  }

  /**
   * Map database row to SportabzeichenStandard entity
   */
  mapToEntity(row: any): Sport.SportabzeichenStandard {
    return {
      id: row.id,
      disciplineId: row.discipline_id,
      gender: row.gender,
      ageMin: row.age_min,
      ageMax: row.age_max,
      level: row.level,
      comparison: row.comparison,
      threshold: row.threshold,
      unit: row.unit,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  /**
   * Map SportabzeichenStandard entity to database row
   */
  mapToRow(entity: Partial<Sport.SportabzeichenStandard>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.disciplineId !== undefined) row.discipline_id = entity.disciplineId;
    if (entity.gender !== undefined) row.gender = entity.gender;
    if (entity.ageMin !== undefined) row.age_min = entity.ageMin;
    if (entity.ageMax !== undefined) row.age_max = entity.ageMax;
    if (entity.level !== undefined) row.level = entity.level;
    if (entity.comparison !== undefined) row.comparison = entity.comparison;
    if (entity.threshold !== undefined) row.threshold = entity.threshold;
    if (entity.unit !== undefined) row.unit = entity.unit;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  /**
   * Finds all Sportabzeichen standards for a given discipline.
   *
   * Use this to load all age- and level-specific standards that apply to
   * a particular discipline, for example when evaluating results or
   * displaying available thresholds in the UI.
   *
   * @param disciplineId - The identifier of the discipline to filter standards by.
   * @returns All Sportabzeichen standards associated with the given discipline.
   */

  async findByDiscipline(disciplineId: string): Promise<Sport.SportabzeichenStandard[]> {
    return this.find({ discipline_id: disciplineId });
  }
}
