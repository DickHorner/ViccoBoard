/**
 * Save SportZens Class Use Case
 */

import { SportZens } from '@viccoboard/core';
import { SportZensClassRepository } from '../repositories/sportzens-class.repository.js';

export class SaveSportZensClassUseCase {
  constructor(private repository: SportZensClassRepository) {}

  async execute(entity: SportZens.SportZensClass): Promise<SportZens.SportZensClass> {
    return this.repository.save(entity);
  }
}
