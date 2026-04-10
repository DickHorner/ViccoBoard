/**
 * Add Student Use Case
 * Business logic for adding a student to a class
 */

import { Student } from '@viccoboard/core';
import { StudentRepository } from '../repositories/student.repository.js';

export interface ClassGroupLookup {
  findById(id: string): Promise<{ id: string } | null>;
}

export interface AddStudentInput {
  firstName: string;
  lastName: string;
  classGroupId: string;
  dateOfBirth: string;
  gender?: 'm' | 'f';
  email?: string;
  parentEmail?: string;
  phone?: string;
}

export class AddStudentUseCase {
  constructor(
    private studentRepo: StudentRepository,
    private classGroupLookup?: ClassGroupLookup
  ) {}

  async execute(input: AddStudentInput): Promise<Student> {
    // Validation
    await this.validate(input);

    // Create the student
    const student = await this.studentRepo.create({
      firstName: input.firstName,
      lastName: input.lastName,
      classGroupId: input.classGroupId,
      dateOfBirth: input.dateOfBirth,
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

    // Verify class exists when a lookup is provided
    if (this.classGroupLookup) {
      const classGroup = await this.classGroupLookup.findById(input.classGroupId);
      if (!classGroup) {
        throw new Error(`Class with ID "${input.classGroupId}" not found`);
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateOfBirth)) {
      throw new Error('Date of birth must use YYYY-MM-DD');
    }

    const parsedDate = new Date(`${input.dateOfBirth}T00:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== input.dateOfBirth) {
      throw new Error('Date of birth must be a valid calendar date');
    }

    if (input.gender && input.gender !== 'm' && input.gender !== 'f') {
      throw new Error('Gender must be m or f');
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
