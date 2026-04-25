import type { ClassGroup, Student } from '@viccoboard/core';
import { StudentRepository } from '../repositories/student.repository.js';

export interface CopyClassGroupGateway {
  getById(id: string): Promise<ClassGroup | null>;
  findBySchoolYear(schoolYear: string): Promise<ClassGroup[]>;
  create(input: Omit<ClassGroup, 'id' | 'createdAt' | 'lastModified'>): Promise<ClassGroup>;
}

export interface CopyClassGroupToSchoolYearInput {
  sourceClassGroupId: string;
  targetSchoolYear: string;
  targetClassName?: string;
}

export interface CopyClassGroupToSchoolYearResult {
  classGroup: ClassGroup;
  copiedStudents: number;
  skippedStudents: number;
}

export class CopyClassGroupToSchoolYearUseCase {
  constructor(
    private studentRepository: StudentRepository,
    private classGroupGateway: CopyClassGroupGateway
  ) {}

  async execute(input: CopyClassGroupToSchoolYearInput): Promise<CopyClassGroupToSchoolYearResult> {
    const sourceClassGroupId = input.sourceClassGroupId.trim();
    const targetSchoolYear = input.targetSchoolYear.trim();
    const targetClassName = input.targetClassName?.trim();

    if (!sourceClassGroupId) {
      throw new Error('sourceClassGroupId is required');
    }

    if (!this.isValidSchoolYear(targetSchoolYear)) {
      throw new Error('targetSchoolYear must use YYYY/YYYY format');
    }

    const sourceClassGroup = await this.classGroupGateway.getById(sourceClassGroupId);
    if (!sourceClassGroup) {
      throw new Error('Source class group not found');
    }

    const className = targetClassName || sourceClassGroup.name;
    const targetClassGroup = await this.createTargetClassGroup(sourceClassGroup, className, targetSchoolYear);
    const students = await this.studentRepository.findByClassGroup(sourceClassGroup.id);

    let copiedStudents = 0;
    for (const student of students) {
      await this.copyStudent(student, targetClassGroup.id);
      copiedStudents += 1;
    }

    return {
      classGroup: targetClassGroup,
      copiedStudents,
      skippedStudents: 0
    };
  }

  private async createTargetClassGroup(
    sourceClassGroup: ClassGroup,
    targetClassName: string,
    targetSchoolYear: string
  ): Promise<ClassGroup> {
    const existingTargetClassGroup = (await this.classGroupGateway.findBySchoolYear(targetSchoolYear))
      .find((classGroup) => classGroup.name.trim().toLowerCase() === targetClassName.toLowerCase());

    if (existingTargetClassGroup) {
      throw new Error('Target class group already exists');
    }

    return this.classGroupGateway.create({
      name: targetClassName,
      schoolYear: targetSchoolYear,
      color: sourceClassGroup.color,
      archived: false,
      state: sourceClassGroup.state,
      holidayCalendarRef: sourceClassGroup.holidayCalendarRef,
      gradingScheme: sourceClassGroup.gradingScheme,
      subjectProfile: sourceClassGroup.subjectProfile
    });
  }

  private async copyStudent(student: Student, targetClassGroupId: string): Promise<void> {
    await this.studentRepository.create({
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      photoUri: student.photoUri,
      contactInfo: student.contactInfo,
      classGroupId: targetClassGroupId,
      legacyDateOfBirthMissing: student.legacyDateOfBirthMissing
    });
  }

  private isValidSchoolYear(schoolYear: string): boolean {
    const match = /^(\d{4})\/(\d{4})$/.exec(schoolYear);
    if (!match) {
      return false;
    }

    const startYear = Number(match[1]);
    const endYear = Number(match[2]);
    return endYear === startYear + 1;
  }
}
