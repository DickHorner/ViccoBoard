/**
 * Update Status Use Case
 * Business logic for updating an existing status option
 */

import { StatusCatalog, StatusOption } from '@viccoboard/core';
import { StatusCatalogRepository } from '../repositories/status-catalog.repository.js';

export interface UpdateStatusInput {
  catalogId: string;
  statusId: string;
  name?: string;
  code?: string;
  description?: string;
  color?: string;
  icon?: string;
  active?: boolean;
}

export class UpdateStatusUseCase {
  constructor(private statusCatalogRepo: StatusCatalogRepository) {}

  async execute(input: UpdateStatusInput): Promise<StatusOption> {
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

    // Check for duplicate code (excluding current status)
    if (input.code !== undefined) {
      const duplicateCode = catalog.statuses.some(
        s =>
          s.id !== input.statusId &&
          s.code.toLowerCase() === input.code!.toLowerCase()
      );
      if (duplicateCode) {
        throw new Error(
          `Status code "${input.code}" already exists in this catalog`
        );
      }
    }

    // Prepare updates
    const updates: Partial<Omit<StatusOption, 'id'>> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.code !== undefined) updates.code = input.code;
    if (input.description !== undefined) updates.description = input.description;
    if (input.color !== undefined) updates.color = input.color;
    if (input.icon !== undefined) updates.icon = input.icon;
    if (input.active !== undefined) updates.active = input.active;

    // Update the status
    const updatedCatalog = await this.statusCatalogRepo.updateStatus(
      input.catalogId,
      input.statusId,
      updates
    );

    // Return the updated status
    const updatedStatus = updatedCatalog.statuses.find(
      s => s.id === input.statusId
    );
    if (!updatedStatus) {
      throw new Error('Failed to retrieve updated status');
    }

    return updatedStatus;
  }

  private validateInput(input: UpdateStatusInput): void {
    if (!input.catalogId || input.catalogId.trim().length === 0) {
      throw new Error('Catalog ID is required');
    }

    if (!input.statusId || input.statusId.trim().length === 0) {
      throw new Error('Status ID is required');
    }

    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        throw new Error('Status name cannot be empty');
      }
      if (input.name.length > 50) {
        throw new Error('Status name must be 50 characters or less');
      }
    }

    if (input.code !== undefined) {
      if (input.code.trim().length === 0) {
        throw new Error('Status code cannot be empty');
      }
      if (input.code.length > 10) {
        throw new Error('Status code must be 10 characters or less');
      }
    }
  }
}
