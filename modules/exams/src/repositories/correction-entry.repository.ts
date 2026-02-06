/**
 * Correction Entry Repository
 * Handles persistence of correction entries
 */

import { AdapterRepository } from '@viccoboard/storage';
import { Exams, safeJsonParse, safeJsonStringify } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class CorrectionEntryRepository extends AdapterRepository<Exams.CorrectionEntry> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'correction_entries');
  }

  mapToEntity(row: any): Exams.CorrectionEntry {
    return {
      id: row.id,
      examId: row.exam_id,
      candidateId: row.candidate_id,
      taskScores: safeJsonParse(row.task_scores, [], 'CorrectionEntry.taskScores'),
      totalPoints: row.total_points,
      totalGrade: row.total_grade,
      percentageScore: row.percentage_score,
      comments: safeJsonParse(row.comments, [], 'CorrectionEntry.comments'),
      supportTips: safeJsonParse(row.support_tips, [], 'CorrectionEntry.supportTips'),
      highlightedWork: row.highlighted_work ? safeJsonParse(row.highlighted_work, undefined, 'CorrectionEntry.highlightedWork') : undefined,
      status: row.status,
      correctedBy: row.corrected_by ?? undefined,
      correctedAt: row.corrected_at ? new Date(row.corrected_at) : undefined,
      lastModified: new Date(row.last_modified)
    };
  }

  mapToRow(entity: Partial<Exams.CorrectionEntry>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.examId !== undefined) row.exam_id = entity.examId;
    if (entity.candidateId !== undefined) row.candidate_id = entity.candidateId;
    if (entity.taskScores !== undefined) row.task_scores = safeJsonStringify(entity.taskScores, 'CorrectionEntry.taskScores');
    if (entity.totalPoints !== undefined) row.total_points = entity.totalPoints;
    if (entity.totalGrade !== undefined) row.total_grade = entity.totalGrade;
    if (entity.percentageScore !== undefined) row.percentage_score = entity.percentageScore;
    if (entity.comments !== undefined) row.comments = safeJsonStringify(entity.comments, 'CorrectionEntry.comments');
    if (entity.supportTips !== undefined) row.support_tips = safeJsonStringify(entity.supportTips, 'CorrectionEntry.supportTips');
    if (entity.highlightedWork !== undefined) row.highlighted_work = safeJsonStringify(entity.highlightedWork, 'CorrectionEntry.highlightedWork');
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.correctedBy !== undefined) row.corrected_by = entity.correctedBy;
    if (entity.correctedAt !== undefined) row.corrected_at = entity.correctedAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  async createEntry(entry: Exams.CorrectionEntry): Promise<Exams.CorrectionEntry> {
    const row = this.mapToRow(entry);
    await this.adapter.insert(this.tableName, row);
    return entry;
  }

  async findByExam(examId: string): Promise<Exams.CorrectionEntry[]> {
    return this.find({ exam_id: examId });
  }

  async findByCandidate(candidateId: string): Promise<Exams.CorrectionEntry[]> {
    return this.find({ candidate_id: candidateId });
  }

  async findByExamAndCandidate(examId: string, candidateId: string): Promise<Exams.CorrectionEntry | null> {
    const results = await this.find({ exam_id: examId, candidate_id: candidateId });
    return results[0] ?? null;
  }
}
