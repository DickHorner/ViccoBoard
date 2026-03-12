/**
 * Update Grade Category Use Case
 * Updates an existing grading category for a class
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

    const existing = await this.gradeCategoryRepository.findById(input.id);
    if (!existing) {
      throw new Error(`Category with id ${input.id} not found`);
    }

    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }

    if (input.weight !== undefined && (input.weight < 0 || input.weight > 100)) {
      throw new Error('Weight must be between 0 and 100');
    }

    const updates: Partial<Sport.GradeCategory> = {};
    if (input.name !== undefined) updates.name = input.name.trim();
    if (input.description !== undefined) updates.description = input.description;
    if (input.weight !== undefined) updates.weight = input.weight;
    if (input.configuration !== undefined) updates.configuration = input.configuration;

    return this.gradeCategoryRepository.update(input.id, updates);
  }
}
