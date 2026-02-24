/**
 * Save Sport Table Use Case
 */

import { SportSchema } from '@viccoboard/core';
import { SportTableRepository } from '../repositories/sport-table.repository.js';

export class SaveSportTableUseCase {
  constructor(private repository: SportTableRepository) {}

  async execute(entity: SportSchema.SportTable): Promise<SportSchema.SportTable> {
    return this.repository.save(entity);
  }
}
