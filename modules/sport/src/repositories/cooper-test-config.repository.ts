/**
 * Cooper Test Config Repository
 * Handles persistence of Cooper Test configuration tables
 */

import { AdapterRepository } from '@viccoboard/storage';
import { Sport } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class CooperTestConfigRepository extends AdapterRepository<Sport.CooperTestConfig> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'cooper_test_configs');
  }

  mapToEntity(row: any): Sport.CooperTestConfig {
    return {
      id: row.id,
      name: row.name,
      sportType: row.sport_type,
      distanceUnit: row.distance_unit,
      lapLengthMeters: row.lap_length_meters,
      gradingTableId: row.grading_table_id ?? undefined,
      source: row.source || 'default',
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  mapToRow(entity: Partial<Sport.CooperTestConfig>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.name !== undefined) row.name = entity.name;
    if (entity.sportType !== undefined) row.sport_type = entity.sportType;
    if (entity.distanceUnit !== undefined) row.distance_unit = entity.distanceUnit;
    if (entity.lapLengthMeters !== undefined) row.lap_length_meters = entity.lapLengthMeters;
    if (entity.gradingTableId !== undefined) row.grading_table_id = entity.gradingTableId;
    if (entity.source !== undefined) row.source = entity.source;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  async findBySportType(
    sportType: Sport.CooperTestConfig['sportType']
  ): Promise<Sport.CooperTestConfig[]> {
    return this.find({ sport_type: sportType });
  }
}
