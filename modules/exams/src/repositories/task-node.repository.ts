/**
 * TaskNode Repository
 * Handles persistence of task hierarchy nodes
 */

import { AdapterRepository, safeJsonParse, safeJsonStringify } from '@viccoboard/storage';
import { Exams } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';
import { v4 as uuidv4 } from 'uuid';

export class TaskNodeRepository extends AdapterRepository<Exams.TaskNode> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'task_nodes');
  }

  mapToEntity(row: any): Exams.TaskNode {
    return {
      id: row.id,
      parentId: row.parent_id ?? undefined,
      level: row.level,
      order: row.order_index,
      title: row.title,
      description: row.description ?? undefined,
      points: row.points,
      bonusPoints: row.bonus_points ?? undefined,
      isChoice: !!row.is_choice,
      choiceGroup: row.choice_group ?? undefined,
      criteria: [],
      allowComments: !!row.allow_comments,
      allowSupportTips: !!row.allow_support_tips,
      commentBoxEnabled: !!row.comment_box_enabled,
      subtasks: safeJsonParse(row.subtasks, [], 'TaskNode.subtasks')
    };
  }

  mapToRow(entity: Partial<Exams.TaskNode> & { examId?: string }): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    const examId = (entity as { examId?: string }).examId;
    if (examId !== undefined) row.exam_id = examId;
    if (entity.parentId !== undefined) row.parent_id = entity.parentId;
    if (entity.level !== undefined) row.level = entity.level;
    if (entity.order !== undefined) row.order_index = entity.order;
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.points !== undefined) row.points = entity.points;
    if (entity.bonusPoints !== undefined) row.bonus_points = entity.bonusPoints;
    if (entity.isChoice !== undefined) row.is_choice = entity.isChoice ? 1 : 0;
    if (entity.choiceGroup !== undefined) row.choice_group = entity.choiceGroup;
    if (entity.allowComments !== undefined) row.allow_comments = entity.allowComments ? 1 : 0;
    if (entity.allowSupportTips !== undefined) row.allow_support_tips = entity.allowSupportTips ? 1 : 0;
    if (entity.commentBoxEnabled !== undefined) row.comment_box_enabled = entity.commentBoxEnabled ? 1 : 0;
    if (entity.subtasks !== undefined) row.subtasks = safeJsonStringify(entity.subtasks, 'TaskNode.subtasks');

    return row;
  }


  async createForExam(examId: string, task: Omit<Exams.TaskNode, 'id'>): Promise<Exams.TaskNode> {
    const id = uuidv4();
    const now = new Date();
    const entity: Exams.TaskNode = {
      ...task,
      id
    };

    const row = this.mapToRow({ ...entity, examId });
    row.created_at = now.toISOString();
    row.last_modified = now.toISOString();

    await this.adapter.insert(this.tableName, row);

    return { ...entity, criteria: [] };
  }

  async findByExam(examId: string): Promise<Exams.TaskNode[]> {
    return this.find({ exam_id: examId });
  }

  async findByParent(parentId: string): Promise<Exams.TaskNode[]> {
    return this.find({ parent_id: parentId });
  }
}
