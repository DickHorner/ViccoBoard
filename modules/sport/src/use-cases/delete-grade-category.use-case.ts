/**
 * Delete Grade Category Use Case
 * Deletes a grading category and optionally orphan-checks performance entries
 */

import type { GradeCategoryRepository } from '../repositories/grade-category.repository.js';
import type { PerformanceEntryRepository } from '../repositories/performance-entry.repository.js';

export interface DeleteGradeCategoryInput {
  id: string;
}

export interface DeleteGradeCategoryResult {
  deleted: boolean;
  orphanedEntryCount: number;
}

export class DeleteGradeCategoryUseCase {
  constructor(
    private gradeCategoryRepository: GradeCategoryRepository,
    private performanceEntryRepository: PerformanceEntryRepository
  ) {}

  async execute(input: DeleteGradeCategoryInput): Promise<DeleteGradeCategoryResult> {
    if (!input.id) {
      throw new Error('Category ID is required');
    }

    const existing = await this.gradeCategoryRepository.findById(input.id);
    if (!existing) {
      throw new Error(`Category with id ${input.id} not found`);
    }

    // Count existing performance entries that reference this category
    const orphanedEntryCount = await this.performanceEntryRepository.count({
      category_id: input.id
    });

    const deleted = await this.gradeCategoryRepository.delete(input.id);

    return { deleted, orphanedEntryCount };
  }
}
