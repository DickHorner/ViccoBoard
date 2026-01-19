/**
 * Create Grade Category Use Case
 * Creates a new grading category for a class
 */

import { v4 as uuidv4 } from 'uuid';
import { GradeCategory, GradeCategoryType, GradeCategoryConfig } from '@viccoboard/core';
import type { GradeCategoryRepository } from '../repositories/grade-category.repository';

export interface CreateGradeCategoryInput {
  classGroupId: string;
  name: string;
  description?: string;
  type: GradeCategoryType;
  weight: number;
  configuration: GradeCategoryConfig;
}

export class CreateGradeCategoryUseCase {
  constructor(
    private gradeCategoryRepository: GradeCategoryRepository
  ) {}

  async execute(input: CreateGradeCategoryInput): Promise<GradeCategory> {
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

    const now = new Date();

    // Create grade category
    const category: GradeCategory = {
      id: uuidv4(),
      classGroupId: input.classGroupId,
      name: input.name.trim(),
      description: input.description,
      type: input.type,
      weight: input.weight,
      configuration: input.configuration,
      createdAt: now,
      lastModified: now
    };

    // Save to repository
    await this.gradeCategoryRepository.create(category);

    return category;
  }
}
