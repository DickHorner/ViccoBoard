/**
 * Delete Grade Category Use Case
 * Deletes a grading category and optionally reports affected performance entries.
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

type DeleteGradeCategoryExecuteInput = DeleteGradeCategoryInput | string;

export class DeleteGradeCategoryUseCase {
  constructor(
    private gradeCategoryRepository: GradeCategoryRepository,
    private performanceEntryRepository?: PerformanceEntryRepository
  ) {}

  async execute(input: DeleteGradeCategoryExecuteInput): Promise<DeleteGradeCategoryResult> {
    const id = typeof input === 'string' ? input : input.id;
    if (!id) {
      throw new Error('Category ID is required');
    }

    const existing = await this.gradeCategoryRepository.findById(id);
    if (!existing) {
      throw new Error(`Category with id ${id} not found`);
    }

    const orphanedEntryCount = this.performanceEntryRepository
      ? await this.performanceEntryRepository.count({ category_id: id })
      : 0;

    const deleted = await this.gradeCategoryRepository.delete(id);

    return { deleted, orphanedEntryCount };
  }
}
