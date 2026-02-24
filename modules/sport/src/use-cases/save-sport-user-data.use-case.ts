/**
 * Save Sport UserData Use Case
 */

import { SportSchema } from '@viccoboard/core';
import { SportUserDataRepository } from '../repositories/sport-user-data.repository.js';

export class SaveSportUserDataUseCase {
  constructor(private repository: SportUserDataRepository) {}

  async execute(entity: SportSchema.SportUserData): Promise<SportSchema.SportUserData> {
    return this.repository.save(entity);
  }
}
