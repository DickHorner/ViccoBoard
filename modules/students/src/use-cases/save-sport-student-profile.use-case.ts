import type { SportStudentProfile } from '@viccoboard/core';
import { SportStudentProfileRepository } from '../repositories/sport-student-profile.repository.js';

export class SaveSportStudentProfileUseCase {
  constructor(private repository: SportStudentProfileRepository) {}

  async execute(
    entity: Omit<SportStudentProfile, 'id' | 'createdAt' | 'lastModified' | 'moduleKey'> & { id?: string }
  ): Promise<SportStudentProfile> {
    if (entity.id) {
      return this.repository.update(entity.id, {
        ...entity,
        moduleKey: 'sport'
      } as Partial<SportStudentProfile>);
    }

    return this.repository.create({
      ...entity,
      moduleKey: 'sport'
    });
  }
}
