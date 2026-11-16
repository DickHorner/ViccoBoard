import type { ClassGroup } from '@viccoboard/core';
import type { ClassGroupGateway } from './student-csv-import.use-case.js';

export interface CopyClassGroupGateway extends ClassGroupGateway {
  findById(id: string): Promise<ClassGroup | null>;
  update(id: string, updates: Partial<ClassGroup>): Promise<ClassGroup>;
}

export interface CopyClassGroupToSchoolYearInput {
  sourceClassGroupId: string;
  targetSchoolYear: string;
  targetClassName?: string;
  targetGradeLevel?: number;
}

export interface CopyClassGroupToSchoolYearResult {
  classGroup: ClassGroup;
  copiedStudents: number;
  skippedStudents: number;
}

export class CopyClassGroupToSchoolYearUseCase {
  constructor(private classGroupGateway: CopyClassGroupGateway) {}

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

    const sourceClassGroup = await this.classGroupGateway.findById(sourceClassGroupId);
    if (!sourceClassGroup) {
      throw new Error('Source class group not found');
    }

    if (input.targetGradeLevel !== undefined &&
        (!Number.isInteger(input.targetGradeLevel) || input.targetGradeLevel < 1 || input.targetGradeLevel > 13)) {
      throw new Error('targetGradeLevel must be between 1 and 13');
    }

    const className = targetClassName || sourceClassGroup.name;
    const duplicate = (await this.classGroupGateway.findBySchoolYear(targetSchoolYear))
      .find(group => group.id !== sourceClassGroupId &&
        group.name.trim().toLowerCase() === className.toLowerCase());

    if (duplicate) {
      throw new Error('Target class group already exists');
    }

    const classGroup = await this.classGroupGateway.update(sourceClassGroupId, {
      name: className,
      schoolYear: targetSchoolYear,
      gradeLevel: input.targetGradeLevel ?? sourceClassGroup.gradeLevel,
      archived: false
    });

    return { classGroup, copiedStudents: 0, skippedStudents: 0 };
  }

  private isValidSchoolYear(schoolYear: string): boolean {
    const match = /^(\d{4})\/(\d{4})$/.exec(schoolYear);
    return Boolean(match && Number(match[2]) === Number(match[1]) + 1);
  }
}
