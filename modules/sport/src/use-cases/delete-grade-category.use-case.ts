/**
 * Delete Grade Category Use Case
 * Removes a grading category
 */

import type { GradeCategoryRepository } from '../repositories/grade-category.repository.js';

export class DeleteGradeCategoryUseCase {
  constructor(
    private gradeCategoryRepository: GradeCategoryRepository
  ) {}

  async execute(id: string): Promise<void> {
    if (!id) {
      throw new Error('Category ID is required');
    }
    await this.gradeCategoryRepository.delete(id);
  }
}
