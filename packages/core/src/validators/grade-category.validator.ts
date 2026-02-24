/**
 * Grade Category Validator
 * Validates grade category entity data before creation/update
 */

import type { GradeCategory, GradeCategoryType } from '../interfaces/sport.types.js';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface GradeCategoryValidationOptions {
  maxNameLength?: number;
  maxDescriptionLength?: number;
  minWeight?: number;
  maxWeight?: number;
}

const DEFAULT_OPTIONS: Required<GradeCategoryValidationOptions> = {
  maxNameLength: 200,
  maxDescriptionLength: 1000,
  minWeight: 0,
  maxWeight: 100
};

export class GradeCategoryValidator {
  private options: Required<GradeCategoryValidationOptions>;

  constructor(options: GradeCategoryValidationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Validate grade category data for creation
   */
  validateCreate(data: Partial<GradeCategory>): ValidationResult {
    const errors: string[] = [];

    // Name validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    } else if (data.name.length > this.options.maxNameLength) {
      errors.push(`Name must not exceed ${this.options.maxNameLength} characters`);
    }

    // Description validation (if provided)
    if (data.description && data.description.length > this.options.maxDescriptionLength) {
      errors.push(`Description must not exceed ${this.options.maxDescriptionLength} characters`);
    }

    // Class group ID validation
    if (!data.classGroupId || typeof data.classGroupId !== 'string') {
      errors.push('Class group ID is required and must be a string');
    }

    // Type validation
    if (!data.type) {
      errors.push('Type is required');
    } else if (!['criteria', 'time', 'cooper', 'shuttle', 'mittelstrecke', 'Sportabzeichen', 'bjs', 'verbal'].includes(data.type)) {
      errors.push('Type must be one of: criteria, time, cooper, shuttle, mittelstrecke, Sportabzeichen, bjs, verbal');
    }

    // Weight validation
    if (typeof data.weight !== 'number') {
      errors.push('Weight is required and must be a number');
    } else if (data.weight < this.options.minWeight || data.weight > this.options.maxWeight) {
      errors.push(`Weight must be between ${this.options.minWeight} and ${this.options.maxWeight}`);
    }

    // Configuration validation based on type
    if (data.configuration) {
      const configErrors = this.validateConfiguration(data.type!, data.configuration);
      errors.push(...configErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate configuration based on category type
   */
  private validateConfiguration(type: GradeCategoryType, config: any): string[] {
    const errors: string[] = [];

    if (typeof config !== 'object' || config === null) {
      errors.push('Configuration must be an object');
      return errors;
    }

    switch (type) {
      case 'criteria':
        if (config.criteria && !Array.isArray(config.criteria)) {
          errors.push('Criteria configuration must have a criteria array');
        }
        if (config.criteria && config.criteria.length > 50) {
          errors.push('Maximum 50 criteria allowed per category');
        }
        break;

      case 'time':
        if (config.unit && !['seconds', 'minutes', 'hours'].includes(config.unit)) {
          errors.push('Time unit must be one of: seconds, minutes, hours');
        }
        if (typeof config.lowerIsBetter !== 'undefined' && typeof config.lowerIsBetter !== 'boolean') {
          errors.push('lowerIsBetter must be a boolean');
        }
        break;

      case 'cooper':
        if (config.distanceInMeters && (typeof config.distanceInMeters !== 'number' || config.distanceInMeters <= 0)) {
          errors.push('Cooper test distance must be a positive number');
        }
        break;

      case 'shuttle':
        if (config.configId && typeof config.configId !== 'string') {
          errors.push('Shuttle config ID must be a string');
        }
        break;

      case 'mittelstrecke':
        if (config.gradingTable && typeof config.gradingTable !== 'string') {
          errors.push('Mittelstrecke grading table must be a string');
        }
        break;

      case 'Sportabzeichen':
      case 'bjs':
      case 'verbal':
        // These types have their own specific configurations
        // Add validation as needed
        break;
    }

    return errors;
  }

  /**
   * Validate grade category data for update
   */
  validateUpdate(data: Partial<GradeCategory>): ValidationResult {
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
export const gradeCategoryValidator = new GradeCategoryValidator();
