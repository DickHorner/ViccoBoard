/**
 * Reorder Status Use Case
 * Business logic for reordering status options in a catalog
 */

import { StatusCatalog, StatusOption } from '@viccoboard/core';
import { StatusCatalogRepository } from '../repositories/status-catalog.repository.js';

export interface ReorderStatusInput {
  catalogId: string;
  statusId: string;
  newOrder: number;
}

export class ReorderStatusUseCase {
  constructor(private statusCatalogRepo: StatusCatalogRepository) {}

  async execute(input: ReorderStatusInput): Promise<StatusOption> {
    // Validate input
    this.validateInput(input);

    // Verify catalog exists
    const catalog = await this.statusCatalogRepo.findById(input.catalogId);
    if (!catalog) {
      throw new Error(`Catalog with ID "${input.catalogId}" not found`);
    }

    // Verify status exists
    const status = catalog.statuses.find(s => s.id === input.statusId);
    if (!status) {
      throw new Error(`Status with ID "${input.statusId}" not found`);
    }

    // Perform reorder
    const updatedCatalog = await this.statusCatalogRepo.reorderStatus(
      input.catalogId,
      input.statusId,
      input.newOrder
    );

    // Return the reordered status
    const reorderedStatus = updatedCatalog.statuses.find(
      s => s.id === input.statusId
    );
    if (!reorderedStatus) {
      throw new Error('Failed to retrieve reordered status');
    }

    return reorderedStatus;
  }

  private validateInput(input: ReorderStatusInput): void {
    if (!input.catalogId || input.catalogId.trim().length === 0) {
      throw new Error('Catalog ID is required');
    }

    if (!input.statusId || input.statusId.trim().length === 0) {
      throw new Error('Status ID is required');
    }

    if (input.newOrder < 0 || !Number.isInteger(input.newOrder)) {
      throw new Error('New order must be a non-negative integer');
    }
  }
}
