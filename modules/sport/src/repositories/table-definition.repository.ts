/**
 * TableDefinition Repository
 * Handles persistence of grading table definitions
 */

import { AdapterRepository } from '@viccoboard/storage';
import { Sport } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class TableDefinitionRepository extends AdapterRepository<Sport.TableDefinition> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'table_definitions');
  }

  mapToEntity(row: any): Sport.TableDefinition {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description ?? undefined,
      source: row.source,
      dimensions: row.dimensions ? JSON.parse(row.dimensions) : [],
      mappingRules: row.mapping_rules ? JSON.parse(row.mapping_rules) : [],
      entries: row.entries ? JSON.parse(row.entries) : [],
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  mapToRow(entity: Partial<Sport.TableDefinition>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.name !== undefined) row.name = entity.name;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.source !== undefined) row.source = entity.source;
    if (entity.dimensions !== undefined) row.dimensions = JSON.stringify(entity.dimensions);
    if (entity.mappingRules !== undefined) row.mapping_rules = JSON.stringify(entity.mappingRules);
    if (entity.entries !== undefined) row.entries = JSON.stringify(entity.entries);
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  async findBySource(source: Sport.TableDefinition['source']): Promise<Sport.TableDefinition[]> {
    return this.find({ source });
  }
}
