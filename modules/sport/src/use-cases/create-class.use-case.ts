/**
 * Create Class Use Case
 * Business logic for creating a new class/course group
 */

import { ClassGroup } from '@viccoboard/core';
import { ClassGroupRepository } from '../repositories/class-group.repository.js';

export interface CreateClassInput {
  name: string;
  schoolYear: string;
  state?: string;
  gradingScheme?: string;
}

export class CreateClassUseCase {
  constructor(private classGroupRepo: ClassGroupRepository) {}

  async execute(input: CreateClassInput): Promise<ClassGroup> {
    // Validation
    this.validate(input);

    // Check for duplicates
    const existing = await this.classGroupRepo.findBySchoolYear(input.schoolYear);
    const duplicate = existing.find(c => 
      c.name.toLowerCase() === input.name.toLowerCase()
    );
    
    if (duplicate) {
      throw new Error(`Class "${input.name}" already exists for ${input.schoolYear}`);
    }

    // Create the class
    const classGroup = await this.classGroupRepo.create({
      name: input.name,
      schoolYear: input.schoolYear,
      state: input.state,
      gradingScheme: input.gradingScheme || 'default'
    });

    return classGroup;
  }

  private validate(input: CreateClassInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Class name is required');
    }

    if (!input.schoolYear || input.schoolYear.trim().length === 0) {
      throw new Error('School year is required');
    }

    // Validate school year format (e.g., "2023/2024")
    const yearPattern = /^\d{4}\/\d{4}$/;
    if (!yearPattern.test(input.schoolYear)) {
      throw new Error('School year must be in format YYYY/YYYY (e.g., "2023/2024")');
    }
  }
}
