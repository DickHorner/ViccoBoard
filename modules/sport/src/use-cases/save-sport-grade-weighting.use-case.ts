/**
 * Save SportZens GradeWeighting Use Case
 */

import { SportZens } from '@viccoboard/core';
import { SportZensGradeWeightingRepository } from '../repositories/sportzens-grade-weighting.repository.js';

export class SaveSportZensGradeWeightingUseCase {
  constructor(private repository: SportZensGradeWeightingRepository) {}

  async execute(weighting: SportZens.SportZensGradeWeighting): Promise<SportZens.SportZensGradeWeighting> {
    return this.repository.set(weighting);
  }
}
