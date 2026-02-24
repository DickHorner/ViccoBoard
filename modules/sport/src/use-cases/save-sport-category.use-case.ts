/**
 * Save SportZens Category Use Case
 */

import { SportZens } from '@viccoboard/core';
import { SportZensCategoryRepository } from '../repositories/sportzens-category.repository.js';

export class SaveSportZensCategoryUseCase {
  constructor(private repository: SportZensCategoryRepository) {}

  async execute(entity: SportZens.SportZensCategory): Promise<SportZens.SportZensCategory> {
    return this.repository.save(entity);
  }
}
