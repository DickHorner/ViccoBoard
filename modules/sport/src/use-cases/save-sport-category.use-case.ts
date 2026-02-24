/**
 * Save Sport Category Use Case
 */

import { SportSchema } from '@viccoboard/core';
import { SportCategoryRepository } from '../repositories/sport-category.repository.js';

export class SaveSportCategoryUseCase {
  constructor(private repository: SportCategoryRepository) {}

  async execute(entity: SportSchema.SportCategory): Promise<SportSchema.SportCategory> {
    return this.repository.save(entity);
  }
}
