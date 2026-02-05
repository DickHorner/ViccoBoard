/**
 * Shuttle Run Config Repository
 * Handles persistence of Shuttle Run configuration tables
 */

import { AdapterRepository, safeJsonParse, safeJsonStringify } from '@viccoboard/storage';
import { Sport } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class ShuttleRunConfigRepository extends AdapterRepository<Sport.ShuttleRunConfig> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'shuttle_run_configs');
  }

  mapToEntity(row: any): Sport.ShuttleRunConfig {
    return {
      id: row.id,
      name: row.name,
      levels: safeJsonParse(row.levels, [], 'ShuttleRunConfig.levels'),
      audioSignalsEnabled: !!row.audio_signals_enabled,
      source: row.source || 'default',
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  mapToRow(entity: Partial<Sport.ShuttleRunConfig>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.name !== undefined) row.name = entity.name;
    if (entity.levels !== undefined) row.levels = safeJsonStringify(entity.levels, 'ShuttleRunConfig.levels');
    if (entity.audioSignalsEnabled !== undefined) {
      row.audio_signals_enabled = entity.audioSignalsEnabled ? 1 : 0;
    }
    if (entity.source !== undefined) row.source = entity.source;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  async findBySource(source: Sport.ShuttleRunConfig['source']): Promise<Sport.ShuttleRunConfig[]> {
    return this.find({ source });
  }
}
