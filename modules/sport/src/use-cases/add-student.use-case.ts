/**
 * Add Student Use Case
 * Business logic for adding a student to a class
 */

import { Student } from '@viccoboard/core';
import { StudentRepository } from '../repositories/student.repository';
import { ClassGroupRepository } from '../repositories/class-group.repository';

export interface AddStudentInput {
  firstName: string;
  lastName: string;
  classGroupId: string;
  birthYear?: number;
  gender?: 'male' | 'female' | 'diverse';
  email?: string;
  parentEmail?: string;
  phone?: string;
}

export class AddStudentUseCase {
  constructor(
    private studentRepo: StudentRepository,
    private classGroupRepo: ClassGroupRepository
  ) {}

  async execute(input: AddStudentInput): Promise<Student> {
    // Validation
    await this.validate(input);

    // Create the student
    const student = await this.studentRepo.create({
      firstName: input.firstName,
      lastName: input.lastName,
      classGroupId: input.classGroupId,
      birthYear: input.birthYear,
      gender: input.gender,
      contactInfo: {
        email: input.email,
        parentEmail: input.parentEmail,
        phone: input.phone
      }
    });

    return student;
  }

  private async validate(input: AddStudentInput): Promise<void> {
    if (!input.firstName || input.firstName.trim().length === 0) {
      throw new Error('First name is required');
    }

    if (!input.lastName || input.lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }

    if (!input.classGroupId || input.classGroupId.trim().length === 0) {
      throw new Error('Class group ID is required');
    }

    // Verify class exists
    const classGroup = await this.classGroupRepo.findById(input.classGroupId);
    if (!classGroup) {
      throw new Error(`Class with ID "${input.classGroupId}" not found`);
    }

    // Validate birth year if provided
    if (input.birthYear !== undefined) {
      const currentYear = new Date().getFullYear();
      if (input.birthYear < 1900 || input.birthYear > currentYear) {
        throw new Error(`Birth year must be between 1900 and ${currentYear}`);
      }
    }

    // Validate email format if provided
    if (input.email && !this.isValidEmail(input.email)) {
      throw new Error('Invalid email format');
    }

    if (input.parentEmail && !this.isValidEmail(input.parentEmail)) {
      throw new Error('Invalid parent email format');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }
}
