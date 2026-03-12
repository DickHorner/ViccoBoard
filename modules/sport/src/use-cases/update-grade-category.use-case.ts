/**
 * Update Grade Category Use Case
 * Updates an existing grading category
 */

import { Sport } from '@viccoboard/core';
import type { GradeCategoryRepository } from '../repositories/grade-category.repository.js';

export interface UpdateGradeCategoryInput {
  id: string;
  name?: string;
  description?: string;
  weight?: number;
  configuration?: Sport.GradeCategoryConfig;
}

export class UpdateGradeCategoryUseCase {
  constructor(
    private gradeCategoryRepository: GradeCategoryRepository
  ) {}

  async execute(input: UpdateGradeCategoryInput): Promise<Sport.GradeCategory> {
    if (!input.id) {
      throw new Error('Category ID is required');
    }
    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
    if (input.weight !== undefined && (input.weight < 0 || input.weight > 100)) {
      throw new Error('Weight must be between 0 and 100');
    }

    const update: Partial<Sport.GradeCategory> = {};
    if (input.name !== undefined) update.name = input.name.trim();
    if (input.description !== undefined) update.description = input.description;
    if (input.weight !== undefined) update.weight = input.weight;
    if (input.configuration !== undefined) update.configuration = input.configuration;

    return this.gradeCategoryRepository.update(input.id, update);
  }
}
