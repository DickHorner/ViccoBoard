/**
 * Record Grade Entry Use Case
 * Records a grade/performance entry for a student
 */

import { Sport } from '@viccoboard/core';
import type { PerformanceEntryRepository } from '../repositories/performance-entry.repository.js';

export interface RecordGradeInput {
  studentId: string;
  categoryId: string;
  measurements: Record<string, any>;
  calculatedGrade?: string | number;
  comment?: string;
  metadata?: Record<string, any>;
}

export class RecordGradeUseCase {
  constructor(
    private performanceEntryRepository: PerformanceEntryRepository
  ) {}

  async execute(input: RecordGradeInput): Promise<Sport.PerformanceEntry> {
    // Validate input
    if (!input.studentId) {
      throw new Error('Student ID is required');
    }
    if (!input.categoryId) {
      throw new Error('Category ID is required');
    }
    if (!input.measurements || Object.keys(input.measurements).length === 0) {
      throw new Error('Measurements are required');
    }

    const now = new Date();

    // Save to repository (repository assigns id and timestamps)
    return this.performanceEntryRepository.create({
      studentId: input.studentId,
      categoryId: input.categoryId,
      measurements: input.measurements,
      calculatedGrade: input.calculatedGrade,
      timestamp: now,
      comment: input.comment,
      metadata: input.metadata
    });
  }
}
