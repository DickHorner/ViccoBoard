/**
 * Add Status Use Case
 * Business logic for adding a new status option to a catalog
 */

import { StatusCatalog, StatusOption } from '@viccoboard/core';
import { StatusCatalogRepository } from '../repositories/status-catalog.repository.js';

export interface AddStatusInput {
  catalogId: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  icon?: string;
}

export class AddStatusUseCase {
  constructor(private statusCatalogRepo: StatusCatalogRepository) {}

  async execute(input: AddStatusInput): Promise<StatusOption> {
    // Validate input
    this.validateInput(input);

    // Verify catalog exists
    const catalog = await this.statusCatalogRepo.findById(input.catalogId);
    if (!catalog) {
      throw new Error(`Catalog with ID "${input.catalogId}" not found`);
    }

    // Check for duplicate code
    const duplicateCode = catalog.statuses.some(
      s => s.code.toLowerCase() === input.code.toLowerCase()
    );
    if (duplicateCode) {
      throw new Error(
        `Status code "${input.code}" already exists in this catalog`
      );
    }

    // Add the status
    const updatedCatalog = await this.statusCatalogRepo.addStatus(
      input.catalogId,
      {
        name: input.name,
        code: input.code,
        description: input.description,
        color: input.color,
        icon: input.icon,
        active: true,
        order: catalog.statuses.length
      }
    );

    // Return the newly added status
    return updatedCatalog.statuses[updatedCatalog.statuses.length - 1];
  }

  private validateInput(input: AddStatusInput): void {
    if (!input.catalogId || input.catalogId.trim().length === 0) {
      throw new Error('Catalog ID is required');
    }

    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Status name is required');
    }

    if (!input.code || input.code.trim().length === 0) {
      throw new Error('Status code is required');
    }

    if (input.code.length > 10) {
      throw new Error('Status code must be 10 characters or less');
    }

    if (input.name.length > 50) {
      throw new Error('Status name must be 50 characters or less');
    }
  }
}
