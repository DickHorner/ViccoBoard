/**
 * Save SportZens Student Use Case
 */

import { SportZens } from '@viccoboard/core';
import { SportZensStudentRepository } from '../repositories/sportzens-student.repository.js';

export class SaveSportZensStudentUseCase {
  constructor(private repository: SportZensStudentRepository) {}

  async execute(entity: SportZens.SportZensStudent): Promise<SportZens.SportZensStudent> {
    return this.repository.save(entity);
  }
}
