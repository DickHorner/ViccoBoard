/**
 * Save SportZens Grade Use Case
 */

import { SportZens } from '@viccoboard/core';
import { SportZensGradeRepository } from '../repositories/sportzens-grade.repository.js';

export class SaveSportZensGradeUseCase {
  constructor(private repository: SportZensGradeRepository) {}

  async execute(entity: SportZens.SportZensGrade): Promise<SportZens.SportZensGrade> {
    return this.repository.save(entity);
  }
}
