/**
 * Criterion Repository
 * Handles persistence of task criteria
 */

import { AdapterRepository } from '@viccoboard/storage';
import { Exams } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';
import { v4 as uuidv4 } from 'uuid';

export class CriterionRepository extends AdapterRepository<Exams.Criterion> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'criteria');
  }

  mapToEntity(row: any): Exams.Criterion {
    return {
      id: row.id,
      text: row.text,
      formatting: row.formatting ? JSON.parse(row.formatting) : {},
      points: row.points,
      subCriteria: row.sub_criteria ? JSON.parse(row.sub_criteria) : undefined,
      aspectBased: !!row.aspect_based
    };
  }

  mapToRow(entity: Partial<Exams.Criterion> & { examId?: string; taskId?: string }): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.text !== undefined) row.text = entity.text;
    if (entity.formatting !== undefined) row.formatting = JSON.stringify(entity.formatting);
    if (entity.points !== undefined) row.points = entity.points;
    if (entity.subCriteria !== undefined) row.sub_criteria = JSON.stringify(entity.subCriteria);
    if (entity.aspectBased !== undefined) row.aspect_based = entity.aspectBased ? 1 : 0;

    if (entity.examId !== undefined) row.exam_id = entity.examId;
    if (entity.taskId !== undefined) row.task_id = entity.taskId;

    return row;
  }


  async createForTask(
    examId: string,
    taskId: string,
    criterion: Exams.Criterion
  ): Promise<Exams.Criterion> {
    const id = uuidv4();
    const now = new Date();
    const entity = { ...criterion, id };

    const row = this.mapToRow({ ...entity, examId, taskId });
    row.created_at = now.toISOString();
    row.last_modified = now.toISOString();

    await this.adapter.insert(this.tableName, row);
    return entity;
  }

  async findByTask(taskId: string): Promise<Exams.Criterion[]> {
    return this.find({ task_id: taskId });
  }

  async findByExam(examId: string): Promise<Exams.Criterion[]> {
    return this.find({ exam_id: examId });
  }
}
