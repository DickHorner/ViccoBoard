/**
 * Save Sport Class Use Case
 */

import { SportSchema } from '@viccoboard/core';
import { SportClassRepository } from '../repositories/sport-class.repository.js';

export class SaveSportClassUseCase {
  constructor(private repository: SportClassRepository) {}

  async execute(entity: SportSchema.SportClass): Promise<SportSchema.SportClass> {
    return this.repository.save(entity);
  }
}
