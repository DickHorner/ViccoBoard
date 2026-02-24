/**
 * Save Sport NewDayData Use Case
 */

import { SportSchema } from '@viccoboard/core';
import { SportNewDayDataRepository } from '../repositories/sport-new-day-data.repository.js';

export class SaveSportNewDayDataUseCase {
  constructor(private repository: SportNewDayDataRepository) {}

  async execute(entry: SportSchema.SportNewDayData): Promise<SportSchema.SportNewDayData> {
    return this.repository.save(entry);
  }
}
