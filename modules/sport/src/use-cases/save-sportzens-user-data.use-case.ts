/**
 * Save SportZens UserData Use Case
 */

import { SportZens } from '@viccoboard/core';
import { SportZensUserDataRepository } from '../repositories/sportzens-user-data.repository.js';

export class SaveSportZensUserDataUseCase {
  constructor(private repository: SportZensUserDataRepository) {}

  async execute(entity: SportZens.SportZensUserData): Promise<SportZens.SportZensUserData> {
    return this.repository.save(entity);
  }
}
