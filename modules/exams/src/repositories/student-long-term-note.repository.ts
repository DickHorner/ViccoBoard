/**
 * Student Long-term Notes Repository
 * Tracks long-term development, notes, and skill areas for students
 */

import { AdapterRepository } from '@viccoboard/storage';
import { safeJsonParse, safeJsonStringify } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export interface StudentLongTermNote {
  id: string;
  studentId: string;
  classGroupId: string;
  schoolYear: string;
  competencyAreas: CompetencyArea[];
 developmentNotes: DevelopmentNote[];
  internalNotes: string;
  strengths: string[];
  focusAreas: string[];
  lastReviewDate?: Date;
  createdAt: Date;
  lastModified: Date;
}

export interface CompetencyArea {
  id: string;
  name: string;
  description: string;
  assessmentCount: number;
  lastAssessmentDate?: Date;
  trend: 'improving' | 'stable' | 'declining' | 'new';
}

export interface DevelopmentNote {
  id: string;
  date: Date;
  content: string;
  category: 'achievement' | 'challenge' | 'support' | 'observation';
  relatedExamId?: string;
}

export class StudentLongTermNoteRepository extends AdapterRepository<StudentLongTermNote> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'student_long_term_notes');
  }

  mapToEntity(row: any): StudentLongTermNote {
    return {
      id: row.id,
      studentId: row.student_id,
      classGroupId: row.class_group_id,
      schoolYear: row.school_year,
      competencyAreas: safeJsonParse(row.competency_areas, [], 'StudentLongTermNote.competencyAreas'),
      developmentNotes: safeJsonParse(
        row.development_notes,
        [],
        'StudentLongTermNote.developmentNotes'
      ).map((note: any) => ({
        ...note,
        date: new Date(note.date)
      })),
      internalNotes: row.internal_notes ?? '',
      strengths: safeJsonParse(row.strengths, [], 'StudentLongTermNote.strengths'),
      focusAreas: safeJsonParse(row.focus_areas, [], 'StudentLongTermNote.focusAreas'),
      lastReviewDate: row.last_review_date ? new Date(row.last_review_date) : undefined,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  mapToRow(entity: Partial<StudentLongTermNote>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.studentId !== undefined) row.student_id = entity.studentId;
    if (entity.classGroupId !== undefined) row.class_group_id = entity.classGroupId;
    if (entity.schoolYear !== undefined) row.school_year = entity.schoolYear;
    if (entity.competencyAreas !== undefined)
      row.competency_areas = safeJsonStringify(
        entity.competencyAreas,
        'StudentLongTermNote.competencyAreas'
      );
    if (entity.developmentNotes !== undefined)
      row.development_notes = safeJsonStringify(
        entity.developmentNotes.map(note => ({
          ...note,
          date: note.date.toISOString()
        })),
        'StudentLongTermNote.developmentNotes'
      );
    if (entity.internalNotes !== undefined) row.internal_notes = entity.internalNotes;
    if (entity.strengths !== undefined) row.strengths = safeJsonStringify(entity.strengths, 'StudentLongTermNote.strengths');
    if (entity.focusAreas !== undefined) row.focus_areas = safeJsonStringify(entity.focusAreas, 'StudentLongTermNote.focusAreas');
    if (entity.lastReviewDate !== undefined) row.last_review_date = entity.lastReviewDate.toISOString();
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  async findByStudent(studentId: string): Promise<StudentLongTermNote[]> {
    return this.find({ student_id: studentId });
  }

  async findByStudentAndYear(studentId: string, schoolYear: string): Promise<StudentLongTermNote | null> {
    const results = await this.find({ student_id: studentId, school_year: schoolYear });
    return results[0] ?? null;
  }

  async findByClassGroup(classGroupId: string): Promise<StudentLongTermNote[]> {
    return this.find({ class_group_id: classGroupId });
  }
}
