/**
 * Save SportZens Table Use Case
 */

import { SportZens } from '@viccoboard/core';
import { SportZensTableRepository } from '../repositories/sportzens-table.repository.js';

export class SaveSportZensTableUseCase {
  constructor(private repository: SportZensTableRepository) {}

  async execute(entity: SportZens.SportZensTable): Promise<SportZens.SportZensTable> {
    return this.repository.save(entity);
  }
}
