/**
 * Save Sport GradeWeighting Use Case
 */

import { SportSchema } from '@viccoboard/core';
import { SportGradeWeightingRepository } from '../repositories/sport-grade-weighting.repository.js';

export class SaveSportGradeWeightingUseCase {
  constructor(private repository: SportGradeWeightingRepository) {}

  async execute(weighting: SportSchema.SportGradeWeighting): Promise<SportSchema.SportGradeWeighting> {
    return this.repository.set(weighting);
  }
}
