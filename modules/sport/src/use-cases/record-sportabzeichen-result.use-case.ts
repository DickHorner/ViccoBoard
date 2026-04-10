/**
 * Record Sportabzeichen Result Use Case
 * Records a Sportabzeichen (Sports badge) test result for a student with age-based performance evaluation
 */

import { Sport} from '@viccoboard/core';
import type { SportabzeichenResultRepository } from '../repositories/sportabzeichen-result.repository.js';
import type { SportabzeichenStandardRepository } from '../repositories/sportabzeichen-standard.repository.js';
import { SportabzeichenService } from '../services/sportabzeichen.service.js';

export interface RecordSportabzeichenResultInput {
  studentId: string;
  disciplineId: string;
  dateOfBirth: string;
  gender: Sport.SportabzeichenGender;
  performanceValue: number;
  unit: string;
  testDate?: Date;
}

export class RecordSportabzeichenResultUseCase {
  private SportabzeichenService: SportabzeichenService;

  constructor(
    private SportabzeichenResultRepository: SportabzeichenResultRepository,
    private SportabzeichenStandardRepository: SportabzeichenStandardRepository
  ) {
    this.SportabzeichenService = new SportabzeichenService();
  }

  async execute(input: RecordSportabzeichenResultInput): Promise<Sport.SportabzeichenResult> {
    // Validate input
    if (!input.studentId) {
      throw new Error('Student ID is required');
    }
    if (!input.disciplineId) {
      throw new Error('Discipline ID is required');
    }
    if (!input.dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(input.dateOfBirth)) {
      throw new Error('Valid date of birth is required');
    }
    if (!input.gender) {
      throw new Error('Gender is required');
    }
    if (input.performanceValue === undefined || input.performanceValue === null) {
      throw new Error('Performance value is required');
    }
    if (!input.unit) {
      throw new Error('Performance unit is required');
    }

    // Fetch all applicable standards for this discipline
    const allStandards = await this.SportabzeichenStandardRepository.findByDiscipline(input.disciplineId);

    // Build result using service
    const resultData = this.SportabzeichenService.buildResult({
      studentId: input.studentId,
      disciplineId: input.disciplineId,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      performanceValue: input.performanceValue,
      unit: input.unit,
      testDate: input.testDate,
      standards: allStandards
    });

    // Save to repository (id, createdAt, lastModified will be auto-generated)
    const result = await this.SportabzeichenResultRepository.create(resultData);

    return result;
  }
}
