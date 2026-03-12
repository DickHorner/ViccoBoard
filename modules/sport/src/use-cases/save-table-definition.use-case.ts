/**
 * Save Table Definition Use Case
 * Creates or updates a table definition (grading table)
 */

import { Sport } from '@viccoboard/core';
import type { TableDefinitionRepository } from '../repositories/table-definition.repository.js';

export interface SaveTableDefinitionInput {
  id?: string;
  name: string;
  type: Sport.TableDefinition['type'];
  description?: string;
  source: Sport.TableDefinition['source'];
  dimensions: Sport.TableDimension[];
  mappingRules: Sport.MappingRule[];
  entries: Sport.TableEntry[];
}

export class SaveTableDefinitionUseCase {
  constructor(
    private tableDefinitionRepository: TableDefinitionRepository
  ) {}

  async execute(input: SaveTableDefinitionInput): Promise<Sport.TableDefinition> {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Table name is required');
    }
    if (!input.type) {
      throw new Error('Table type is required');
    }

    if (input.id) {
      return this.tableDefinitionRepository.update(input.id, {
        name: input.name.trim(),
        type: input.type,
        description: input.description,
        source: input.source,
        dimensions: input.dimensions,
        mappingRules: input.mappingRules,
        entries: input.entries
      });
    }

    return this.tableDefinitionRepository.create({
      name: input.name.trim(),
      type: input.type,
      description: input.description,
      source: input.source,
      dimensions: input.dimensions,
      mappingRules: input.mappingRules,
      entries: input.entries
    });
  }
}
