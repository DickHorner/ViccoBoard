/**
 * Save SportZens NewDayData Use Case
 */

import { SportZens } from '@viccoboard/core';
import { SportZensNewDayDataRepository } from '../repositories/sportzens-new-day-data.repository.js';

export class SaveSportZensNewDayDataUseCase {
  constructor(private repository: SportZensNewDayDataRepository) {}

  async execute(entry: SportZens.SportZensNewDayData): Promise<SportZens.SportZensNewDayData> {
    return this.repository.save(entry);
  }
}
