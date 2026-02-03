/**
 * Create Grade Category Use Case
 * Creates a new grading category for a class
 */

import { Sport } from '@viccoboard/core';
import type { GradeCategoryRepository } from '../repositories/grade-category.repository';

export interface CreateGradeCategoryInput {
  classGroupId: string;
  name: string;
  description?: string;
  type: Sport.GradeCategoryType;
  weight: number;
  configuration: Sport.GradeCategoryConfig;
}

export class CreateGradeCategoryUseCase {
  constructor(
    private gradeCategoryRepository: GradeCategoryRepository
  ) {}

  async execute(input: CreateGradeCategoryInput): Promise<Sport.GradeCategory> {
    // Validate input
    if (!input.classGroupId) {
      throw new Error('Class Group ID is required');
    }
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Category name is required');
    }
    if (!input.type) {
      throw new Error('Category type is required');
    }
    if (input.weight < 0 || input.weight > 100) {
      throw new Error('Weight must be between 0 and 100');
    }
    if (!input.configuration) {
      throw new Error('Category configuration is required');
    }

    // Save to repository (repository assigns id and timestamps)
    return this.gradeCategoryRepository.create({
      classGroupId: input.classGroupId,
      name: input.name.trim(),
      description: input.description,
      type: input.type,
      weight: input.weight,
      configuration: input.configuration
    });
  }
}
