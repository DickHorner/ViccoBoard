/**
 * Performance Entry Validator
 * Validates performance entry entity data before creation/update
 */

import type { PerformanceEntry } from '../interfaces/sport.types.js';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PerformanceEntryValidationOptions {
  maxCommentLength?: number;
  maxMeasurements?: number;
}

const DEFAULT_OPTIONS: Required<PerformanceEntryValidationOptions> = {
  maxCommentLength: 1000,
  maxMeasurements: 50
};

export class PerformanceEntryValidator {
  private options: Required<PerformanceEntryValidationOptions>;

  constructor(options: PerformanceEntryValidationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Validate performance entry data for creation
   */
  validateCreate(data: Partial<PerformanceEntry>): ValidationResult {
    const errors: string[] = [];

    // Student ID validation
    if (!data.studentId || typeof data.studentId !== 'string') {
      errors.push('Student ID is required and must be a string');
    }

    // Category ID validation
    if (!data.categoryId || typeof data.categoryId !== 'string') {
      errors.push('Category ID is required and must be a string');
    }

    // Measurements validation
    if (!data.measurements || typeof data.measurements !== 'object') {
      errors.push('Measurements are required and must be an object');
    } else {
      const measurementKeys = Object.keys(data.measurements);
      
      if (measurementKeys.length === 0) {
        errors.push('At least one measurement is required');
      } else if (measurementKeys.length > this.options.maxMeasurements) {
        errors.push(`Maximum ${this.options.maxMeasurements} measurements allowed`);
      }

      // Validate measurement values
      measurementKeys.forEach(key => {
        const value = data.measurements![key];
        if (typeof value !== 'number' && typeof value !== 'string' && typeof value !== 'boolean') {
          errors.push(`Measurement "${key}" must be a number, string, or boolean`);
        }
      });
    }

    // Calculated grade validation (if provided)
    if (data.calculatedGrade !== undefined) {
      if (typeof data.calculatedGrade !== 'number' && typeof data.calculatedGrade !== 'string') {
        errors.push('Calculated grade must be a number or string');
      }
      if (typeof data.calculatedGrade === 'number' && (data.calculatedGrade < 0 || data.calculatedGrade > 15)) {
        errors.push('Calculated grade must be between 0 and 15 (German grading scale)');
      }
    }

    // Timestamp validation (if provided)
    if (data.timestamp) {
      if (!(data.timestamp instanceof Date) || isNaN(data.timestamp.getTime())) {
        errors.push('Timestamp must be a valid date');
      } else {
        const now = new Date();
        const oneYearInFuture = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        
        if (data.timestamp > oneYearInFuture) {
          errors.push('Timestamp cannot be more than 1 year in the future');
        }
        
        const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
        if (data.timestamp < tenYearsAgo) {
          errors.push('Timestamp cannot be more than 10 years in the past');
        }
      }
    }

    // Comment validation (if provided)
    if (data.comment && data.comment.length > this.options.maxCommentLength) {
      errors.push(`Comment must not exceed ${this.options.maxCommentLength} characters`);
    }

    // Device info validation (if provided)
    if (data.deviceInfo && typeof data.deviceInfo !== 'string') {
      errors.push('Device info must be a string');
    }

    // Metadata validation (if provided)
    if (data.metadata !== undefined && typeof data.metadata !== 'object') {
      errors.push('Metadata must be an object');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate performance entry data for update
   */
  validateUpdate(data: Partial<PerformanceEntry>): ValidationResult {
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

  /**
   * Validate batch import of performance entries
   */
  validateBatch(entries: Partial<PerformanceEntry>[]): ValidationResult {
    const errors: string[] = [];

    if (!Array.isArray(entries)) {
      errors.push('Batch import must be an array');
      return { isValid: false, errors };
    }

    if (entries.length === 0) {
      errors.push('Batch import must contain at least one entry');
    } else if (entries.length > 1000) {
      errors.push('Batch import cannot exceed 1000 entries');
    }

    entries.forEach((entry, index) => {
      const result = this.validateCreate(entry);
      if (!result.isValid) {
        errors.push(`Entry at index ${index}: ${result.errors.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Default validator instance
 */
export const performanceEntryValidator = new PerformanceEntryValidator();
