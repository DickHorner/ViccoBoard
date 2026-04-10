/**
 * Student Validator
 * Validates student entity data before creation/update
 */

import type { Student, ContactInfo } from '../interfaces/core.types.js';
import { isValidDateOnlyString } from '../utils/student-helpers.js';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface StudentValidationOptions {
  maxNameLength?: number;
  maxEmailLength?: number;
  minDateOfBirth?: string;
  maxDateOfBirth?: string;
}

const DEFAULT_OPTIONS: Required<StudentValidationOptions> = {
  maxNameLength: 200,
  maxEmailLength: 320, // RFC 5321 standard
  minDateOfBirth: '1900-01-01',
  maxDateOfBirth: `${new Date().getFullYear() + 10}-12-31`
};

export class StudentValidator {
  private options: Required<StudentValidationOptions>;

  constructor(options: StudentValidationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Validate student data for creation
   */
  validateCreate(data: Partial<Student>): ValidationResult {
    const errors: string[] = [];

    // First name validation
    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push('First name is required');
    } else if (data.firstName.length > this.options.maxNameLength) {
      errors.push(`First name must not exceed ${this.options.maxNameLength} characters`);
    }

    // Last name validation
    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push('Last name is required');
    } else if (data.lastName.length > this.options.maxNameLength) {
      errors.push(`Last name must not exceed ${this.options.maxNameLength} characters`);
    }

    // Class group ID validation
    if (!data.classGroupId || typeof data.classGroupId !== 'string') {
      errors.push('Class group ID is required and must be a string');
    }

    // Gender validation (if provided)
    if (data.gender && !['m', 'f'].includes(data.gender)) {
      errors.push('Gender must be one of: m, f');
    }

    // Date of birth validation
    if (data.dateOfBirth === undefined) {
      errors.push('Date of birth is required');
    } else if (data.dateOfBirth !== null) {
      if (typeof data.dateOfBirth !== 'string' || !isValidDateOnlyString(data.dateOfBirth)) {
        errors.push('Date of birth must be a valid date in YYYY-MM-DD format');
      } else if (
        data.dateOfBirth < this.options.minDateOfBirth ||
        data.dateOfBirth > this.options.maxDateOfBirth
      ) {
        errors.push(`Date of birth must be between ${this.options.minDateOfBirth} and ${this.options.maxDateOfBirth}`);
      }
    }

    // Contact info validation (if provided)
    if (data.contactInfo) {
      const contactErrors = this.validateContactInfo(data.contactInfo);
      errors.push(...contactErrors);
    }

    // Photo URI validation (if provided)
    if (data.photoUri && typeof data.photoUri !== 'string') {
      errors.push('Photo URI must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate contact info
   */
  private validateContactInfo(contactInfo: Partial<ContactInfo>): string[] {
    const errors: string[] = [];

    if (contactInfo.email) {
      if (contactInfo.email.length > this.options.maxEmailLength) {
        errors.push(`Email must not exceed ${this.options.maxEmailLength} characters`);
      }
      if (!this.isValidEmail(contactInfo.email)) {
        errors.push('Email must be a valid email address');
      }
    }

    if (contactInfo.parentEmail) {
      if (contactInfo.parentEmail.length > this.options.maxEmailLength) {
        errors.push(`Parent email must not exceed ${this.options.maxEmailLength} characters`);
      }
      if (!this.isValidEmail(contactInfo.parentEmail)) {
        errors.push('Parent email must be a valid email address');
      }
    }

    if (contactInfo.phone && typeof contactInfo.phone !== 'string') {
      errors.push('Phone must be a string');
    }

    return errors;
  }

  /**
   * Validate student data for update
   */
  validateUpdate(data: Partial<Student>): ValidationResult {
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
   * Validate email format using regex
   */
  private isValidEmail(email: string): boolean {
    // RFC 5322 simplified regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Default validator instance
 */
export const studentValidator = new StudentValidator();
