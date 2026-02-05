/**
 * Exam Validator
 * Validates exam entity data before creation/update
 */

import type { Exam, ExamStructure, GradingKey } from '../interfaces/exam.types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationOptions {
  maxTitleLength?: number;
  maxDescriptionLength?: number;
  maxTasks?: number;
  maxPoints?: number;
}

const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  maxTitleLength: 500,
  maxDescriptionLength: 5000,
  maxTasks: 100,
  maxPoints: 10000
};

export class ExamValidator {
  private options: Required<ValidationOptions>;

  constructor(options: ValidationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Validate exam data for creation
   */
  validateCreate(data: Partial<Exam>): ValidationResult {
    const errors: string[] = [];

    // Title validation
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (data.title.length > this.options.maxTitleLength) {
      errors.push(`Title must not exceed ${this.options.maxTitleLength} characters`);
    }

    // Description validation
    if (data.description && data.description.length > this.options.maxDescriptionLength) {
      errors.push(`Description must not exceed ${this.options.maxDescriptionLength} characters`);
    }

    // Mode validation
    if (!data.mode) {
      errors.push('Mode is required');
    } else if (!['simple', 'complex'].includes(data.mode)) {
      errors.push('Mode must be either "simple" or "complex"');
    }

    // Structure validation
    if (data.structure) {
      const structureErrors = this.validateStructure(data.structure);
      errors.push(...structureErrors);
    }

    // Grading key validation
    if (data.gradingKey) {
      const gradingKeyErrors = this.validateGradingKey(data.gradingKey);
      errors.push(...gradingKeyErrors);
    }

    // Candidates validation
    if (data.candidates && Array.isArray(data.candidates)) {
      if (data.candidates.length > 1000) {
        errors.push('Maximum 1000 candidates allowed per exam');
      }

      data.candidates.forEach((candidate: any, index: number) => {
        if (!candidate.id || typeof candidate.id !== 'string') {
          errors.push(`Candidate at index ${index}: ID is required and must be a string`);
        }
        if (!candidate.name || typeof candidate.name !== 'string') {
          errors.push(`Candidate at index ${index}: Name is required and must be a string`);
        }
      });
    }

    // Status validation
    if (data.status && !['draft', 'active', 'archived'].includes(data.status)) {
      errors.push('Status must be one of: draft, active, archived');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate exam structure
   */
  private validateStructure(structure: ExamStructure): string[] {
    const errors: string[] = [];

    if (!structure.tasks || !Array.isArray(structure.tasks)) {
      errors.push('Structure must have a tasks array');
      return errors;
    }

    if (structure.tasks.length === 0) {
      errors.push('Exam must have at least one task');
    } else if (structure.tasks.length > this.options.maxTasks) {
      errors.push(`Exam cannot have more than ${this.options.maxTasks} tasks`);
    }

    // Validate total points
    if (typeof structure.totalPoints !== 'number' || structure.totalPoints < 0) {
      errors.push('Total points must be a non-negative number');
    } else if (structure.totalPoints > this.options.maxPoints) {
      errors.push(`Total points cannot exceed ${this.options.maxPoints}`);
    }

    // Validate parts if present
    if (structure.parts && Array.isArray(structure.parts)) {
      structure.parts.forEach((part: any, index: number) => {
        if (!part.id || typeof part.id !== 'string') {
          errors.push(`Part at index ${index}: ID is required and must be a string`);
        }
        if (!part.title || typeof part.title !== 'string') {
          errors.push(`Part at index ${index}: Title is required and must be a string`);
        }
        if (part.title && part.title.length > 200) {
          errors.push(`Part at index ${index}: Title must not exceed 200 characters`);
        }
      });
    }

    return errors;
  }

  /**
   * Validate grading key
   */
  private validateGradingKey(gradingKey: GradingKey): string[] {
    const errors: string[] = [];

    if (!gradingKey.gradeBoundaries || !Array.isArray(gradingKey.gradeBoundaries)) {
      errors.push('Grading key must have a gradeBoundaries array');
      return errors;
    }

    if (gradingKey.gradeBoundaries.length === 0) {
      errors.push('Grading key must have at least one grade boundary');
    }

    // Validate each grade boundary
    gradingKey.gradeBoundaries.forEach((boundary: any, index: number) => {
      if (!boundary.grade || typeof boundary.grade !== 'string') {
        errors.push(`Grade boundary at index ${index}: Grade is required and must be a string`);
      }
      if (typeof boundary.minPercentage !== 'number') {
        errors.push(`Grade boundary at index ${index}: minPercentage must be a number`);
      }
      if (boundary.minPercentage < 0 || boundary.minPercentage > 100) {
        errors.push(`Grade boundary at index ${index}: minPercentage must be between 0 and 100`);
      }
    });

    // Validate total points
    if (typeof gradingKey.totalPoints !== 'number' || gradingKey.totalPoints < 0) {
      errors.push('Grading key total points must be a non-negative number');
    } else if (gradingKey.totalPoints > this.options.maxPoints) {
      errors.push(`Grading key total points cannot exceed ${this.options.maxPoints}`);
    }

    return errors;
  }

  /**
   * Validate exam data for update
   */
  validateUpdate(data: Partial<Exam>): ValidationResult {
    const errors: string[] = [];

    // ID validation for updates
    if (!data.id || typeof data.id !== 'string') {
      errors.push('ID is required for updates and must be a string');
    }

    // Use same validation as create for other fields
    const createValidation = this.validateCreate(data);
    errors.push(...createValidation.errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Default validator instance
 */
export const examValidator = new ExamValidator();
