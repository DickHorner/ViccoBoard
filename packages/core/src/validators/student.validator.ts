/**
 * Student Validator
 * Validates student entity data before creation/update
 */

import type { Student, ContactInfo } from '../interfaces/core.types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface StudentValidationOptions {
  maxNameLength?: number;
  maxEmailLength?: number;
  minBirthYear?: number;
  maxBirthYear?: number;
}

const DEFAULT_OPTIONS: Required<StudentValidationOptions> = {
  maxNameLength: 200,
  maxEmailLength: 320, // RFC 5321 standard
  minBirthYear: 1900,
  maxBirthYear: new Date().getFullYear() + 10
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
    if (data.gender && !['male', 'female', 'diverse'].includes(data.gender)) {
      errors.push('Gender must be one of: male, female, diverse');
    }

    // Birth year validation (if provided)
    if (data.birthYear !== undefined) {
      if (typeof data.birthYear !== 'number') {
        errors.push('Birth year must be a number');
      } else if (data.birthYear < this.options.minBirthYear || data.birthYear > this.options.maxBirthYear) {
        errors.push(`Birth year must be between ${this.options.minBirthYear} and ${this.options.maxBirthYear}`);
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
