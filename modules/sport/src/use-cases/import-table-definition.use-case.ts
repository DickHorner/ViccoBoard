/**
 * Import Table Definition Use Case
 *
 * Orchestrates CSV parsing, validation, and persistence of a sport table definition.
 * The actual CSV parsing/validation is delegated to TableImportService.
 */

import type { Sport } from '@viccoboard/core';
import type { TableDefinitionRepository } from '../repositories/table-definition.repository.js';
import { TableImportService } from '../services/table-import.service.js';

export interface ImportTableDefinitionInput {
  /** Human-readable name for the new table */
  name: string;
  /** Raw CSV text */
  csvContent: string;
  /** Optional description */
  description?: string;
}

export interface ImportTableDefinitionResult {
  success: boolean;
  errors?: string[];
  definition?: Sport.TableDefinition;
}

export class ImportTableDefinitionUseCase {
  private importService = new TableImportService();

  constructor(private repository: TableDefinitionRepository) {}

  async execute(input: ImportTableDefinitionInput): Promise<ImportTableDefinitionResult> {
    const parseResult = this.importService.parseCsv(
      input.name,
      input.csvContent,
      input.description
    );

    if (!parseResult.valid || !parseResult.definition) {
      return {
        success: false,
        errors: parseResult.errors.map((e) =>
          e.row !== undefined ? `Row ${e.row}: ${e.message}` : e.message
        )
      };
    }

    const saved = await this.repository.create(parseResult.definition);

    return { success: true, definition: saved };
  }
}
