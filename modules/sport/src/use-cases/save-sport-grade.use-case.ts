/**
 * Save Sport Grade Use Case
 */

import { SportSchema } from '@viccoboard/core';
import { SportGradeRepository } from '../repositories/sport-grade.repository.js';

export class SaveSportGradeUseCase {
  constructor(private repository: SportGradeRepository) {}

  async execute(entity: SportSchema.SportGrade): Promise<SportSchema.SportGrade> {
    return this.repository.save(entity);
  }
}
