/**
 * Record Cooper Test Result Use Case
 * Records a cooper test result for a student with automatic grading
 */

import { Sport} from '@viccoboard/core';
import type { PerformanceEntryRepository } from '../repositories/performance-entry.repository.js';
import type { CooperTestConfigRepository } from '../repositories/cooper-test-config.repository.js';
import type { TableDefinitionRepository } from '../repositories/table-definition.repository.js';
import { CooperTestService } from '../services/cooper-test.service.js';

export interface RecordCooperTestResultInput {
  studentId: string;
  categoryId: string;
  configId: string;
  SportType: 'running' | 'swimming';
  rounds: number;
  lapLengthMeters: number;
  extraMeters?: number;
  calculatedGrade?: string | number;
  comment?: string;
  tableId?: string; // For auto-grading
  metadata?: Record<string, any>;
}

export class RecordCooperTestResultUseCase {
  private cooperTestService: CooperTestService;

  constructor(
    private performanceEntryRepository: PerformanceEntryRepository,
    private cooperTestConfigRepository: CooperTestConfigRepository,
    private tableDefinitionRepository: TableDefinitionRepository
  ) {
    this.cooperTestService = new CooperTestService();
  }

  async execute(input: RecordCooperTestResultInput): Promise<Sport.PerformanceEntry> {
    // Validate input
    if (!input.studentId) {
      throw new Error('Student ID is required');
    }
    if (!input.categoryId) {
      throw new Error('Category ID is required');
    }
    if (!input.SportType) {
      throw new Error('Sport type is required');
    }
    if (input.rounds === undefined || input.rounds === null) {
      throw new Error('Rounds are required');
    }
    if (input.lapLengthMeters === undefined || input.lapLengthMeters === null) {
      throw new Error('Lap length is required');
    }

    // Fetch cooper test config
    const config = await this.cooperTestConfigRepository.findById(input.configId);
    if (!config) {
      throw new Error(`Cooper Test Config not found: ${input.configId}`);
    }

    // Validate that Sport type matches config
    if (config.SportType !== input.SportType) {
      throw new Error(`Sport type mismatch: config expects ${config.SportType}, got ${input.SportType}`);
    }

    // Build result object
    const result = this.cooperTestService.buildResult(
      input.SportType,
      input.rounds,
      input.lapLengthMeters,
      input.extraMeters || 0
    );

    let calculatedGrade = input.calculatedGrade;

    // Auto-calculate grade if table is provided
    if (input.tableId && !calculatedGrade) {
      const table = await this.tableDefinitionRepository.findById(input.tableId);
      if (table) {
        try {
          calculatedGrade = this.cooperTestService.calculateGradeFromTable(
            table,
            result.distanceMeters,
            { SportType: input.SportType }
          );
        } catch (error) {
          // Log but don't fail - grade calculation is optional
          console.warn('Could not auto-calculate Cooper Test grade:', error);
        }
      }
    }

    const now = new Date();

    // Save to repository
    return this.performanceEntryRepository.create({
      studentId: input.studentId,
      categoryId: input.categoryId,
      measurements: {
        SportType: result.SportType,
        rounds: result.rounds,
        lapLengthMeters: result.lapLengthMeters,
        extraMeters: result.extraMeters,
        distanceMeters: result.distanceMeters
      },
      calculatedGrade,
      timestamp: input.metadata?.timestamp || now,
      comment: input.comment,
      metadata: {
        ...input.metadata,
        testType: 'cooper-test',
        configId: input.configId,
        tableId: input.tableId
      }
    });
  }
}
