/**
 * Record Shuttle Run Result Use Case
 * Records a shuttle run test result for a student
 */

import { Sport } from '@viccoboard/core';
import type { PerformanceEntryRepository } from '../repositories/performance-entry.repository.js';
import type { ShuttleRunConfigRepository } from '../repositories/shuttle-run-config.repository.js';
import { ShuttleRunService } from '../services/shuttle-run.service.js';

export interface RecordShuttleRunResultInput {
  studentId: string;
  categoryId: string;
  configId: string;
  level: number;
  lane: number;
  calculatedGrade?: string | number;
  comment?: string;
  metadata?: Record<string, any>;
}

export class RecordShuttleRunResultUseCase {
  private shuttleRunService: ShuttleRunService;

  constructor(
    private performanceEntryRepository: PerformanceEntryRepository,
    private shuttleRunConfigRepository: ShuttleRunConfigRepository
  ) {
    this.shuttleRunService = new ShuttleRunService();
  }

  async execute(input: RecordShuttleRunResultInput): Promise<Sport.PerformanceEntry> {
    // Validate input
    if (!input.studentId) {
      throw new Error('Student ID is required');
    }
    if (!input.categoryId) {
      throw new Error('Category ID is required');
    }
    if (input.level === undefined || input.level === null) {
      throw new Error('Level is required');
    }
    if (input.lane === undefined || input.lane === null) {
      throw new Error('Lane is required');
    }

    // Fetch shuttle run config
    const config = await this.shuttleRunConfigRepository.findById(input.configId);
    if (!config) {
      throw new Error(`Shuttle Run Config not found: ${input.configId}`);
    }

    // Validate result against config
    this.shuttleRunService.validateResult(config, input.level, input.lane);

    // Build result object
    const result = this.shuttleRunService.buildResult(config, input.level, input.lane);

    const now = new Date();

    // Save to repository
    return this.performanceEntryRepository.create({
      studentId: input.studentId,
      categoryId: input.categoryId,
      measurements: {
        level: result.level,
        lane: result.lane
      },
      calculatedGrade: input.calculatedGrade,
      timestamp: input.metadata?.timestamp || now,
      comment: input.comment,
      metadata: {
        ...input.metadata,
        testType: 'shuttle-run',
        configId: input.configId
      }
    });
  }
}
