/**
 * Delete Table Definition Use Case
 * Removes a table definition
 */

import type { TableDefinitionRepository } from '../repositories/table-definition.repository.js';

export class DeleteTableDefinitionUseCase {
  constructor(
    private tableDefinitionRepository: TableDefinitionRepository
  ) {}

  async execute(id: string): Promise<void> {
    if (!id) {
      throw new Error('Table Definition ID is required');
    }
    await this.tableDefinitionRepository.delete(id);
  }
}
