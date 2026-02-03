/**
 * Exam Repository
 * Handles persistence of exams
 */

import { AdapterRepository } from '@viccoboard/storage';
import { Exams } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

const emptyStructure: Exams.ExamStructure = {
  parts: [],
  tasks: [],
  allowsComments: false,
  allowsSupportTips: false,
  totalPoints: 0
};

export class ExamRepository extends AdapterRepository<Exams.Exam> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'exams');
  }

  mapToEntity(row: any): Exams.Exam {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      classGroupId: row.class_group_id ?? undefined,
      mode: row.mode,
      structure: row.structure ? JSON.parse(row.structure) : emptyStructure,
      gradingKey: JSON.parse(row.grading_key),
      printPresets: row.print_presets ? JSON.parse(row.print_presets) : [],
      candidates: row.candidates ? JSON.parse(row.candidates) : [],
      status: row.status,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  mapToRow(entity: Partial<Exams.Exam>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.classGroupId !== undefined) row.class_group_id = entity.classGroupId;
    if (entity.mode !== undefined) row.mode = entity.mode;
    if (entity.structure !== undefined) row.structure = JSON.stringify(entity.structure);
    if (entity.gradingKey !== undefined) row.grading_key = JSON.stringify(entity.gradingKey);
    if (entity.printPresets !== undefined) row.print_presets = JSON.stringify(entity.printPresets);
    if (entity.candidates !== undefined) row.candidates = JSON.stringify(entity.candidates);
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  async findByClassGroup(classGroupId: string): Promise<Exams.Exam[]> {
    return this.find({ class_group_id: classGroupId });
  }

  async findByStatus(status: Exams.Exam['status']): Promise<Exams.Exam[]> {
    return this.find({ status });
  }
}
