/**
 * Record Sportabzeichen Result Use Case
 * Records a sportabzeichen (sports badge) test result for a student with age-based performance evaluation
 */

import { Sport } from '@viccoboard/core';
import type { SportabzeichenResultRepository } from '../repositories/sportabzeichen-result.repository.js';
import type { SportabzeichenStandardRepository } from '../repositories/sportabzeichen-standard.repository.js';
import { SportabzeichenService } from '../services/sportabzeichen.service.js';

export interface RecordSportabzeichenResultInput {
  studentId: string;
  disciplineId: string;
  birthYear: number;
  gender: Sport.SportabzeichenGender;
  performanceValue: number;
  unit: string;
  testDate?: Date;
}

export class RecordSportabzeichenResultUseCase {
  private sportabzeichenService: SportabzeichenService;

  constructor(
    private sportabzeichenResultRepository: SportabzeichenResultRepository,
    private sportabzeichenStandardRepository: SportabzeichenStandardRepository
  ) {
    this.sportabzeichenService = new SportabzeichenService();
  }

  async execute(input: RecordSportabzeichenResultInput): Promise<Sport.SportabzeichenResult> {
    // Validate input
    if (!input.studentId) {
      throw new Error('Student ID is required');
    }
    if (!input.disciplineId) {
      throw new Error('Discipline ID is required');
    }
    if (!input.birthYear || !Number.isFinite(input.birthYear)) {
      throw new Error('Valid birth year is required');
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
    const allStandards = await this.sportabzeichenStandardRepository.findByDiscipline(input.disciplineId);

    // Build result using service
    const resultData = this.sportabzeichenService.buildResult({
      studentId: input.studentId,
      disciplineId: input.disciplineId,
      birthYear: input.birthYear,
      gender: input.gender,
      performanceValue: input.performanceValue,
      unit: input.unit,
      testDate: input.testDate,
      standards: allStandards
    });

    // Save to repository (id, createdAt, lastModified will be auto-generated)
    const result = await this.sportabzeichenResultRepository.create(resultData);

    return result;
  }
}
