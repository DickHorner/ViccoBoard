/**
 * Exam import/export integration types.
 */

import type { ExamStructure, GradingKey } from './exam-structure.types.js';

export interface ExamDraft {
  id: string;
  title: string;
  structure: ExamStructure;
  gradingKey: GradingKey;
  metadata: Record<string, any>;
  shareToken?: string;
  isTemplate: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface SharePackage {
  type: 'exam-draft' | 'support-tips' | 'grading-preset';
  data: any;
  metadata: SharePackageMetadata;
  encrypted: boolean;
}

export interface SharePackageMetadata {
  version: string;
  createdBy?: string;
  createdAt: Date;
  description?: string;
  tags: string[];
}

export interface WebUntisImport {
  courseData: WebUntisCourse[];
  studentData: WebUntisStudent[];
  importedAt: Date;
}

export interface WebUntisCourse {
  id: string;
  name: string;
  teacher: string;
  students: string[];
}

export interface WebUntisStudent {
  id: string;
  firstName: string;
  lastName: string;
  externalId: string;
  gender?: string;
}

export interface GradeExport {
  format: 'clipboard' | 'csv' | 'excel';
  includeNames: boolean;
  includeStats: boolean;
  data: GradeExportData[];
}

export interface GradeExportData {
  studentName: string;
  grade: string | number;
  points?: number;
  percentage?: number;
}
