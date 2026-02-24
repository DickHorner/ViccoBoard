/**
 * Save Sport Student Use Case
 */

import { SportSchema } from '@viccoboard/core';
import { SportStudentRepository } from '../repositories/sport-student.repository.js';

export class SaveSportStudentUseCase {
  constructor(private repository: SportStudentRepository) {}

  async execute(entity: SportSchema.SportStudent): Promise<SportSchema.SportStudent> {
    return this.repository.save(entity);
  }
}
