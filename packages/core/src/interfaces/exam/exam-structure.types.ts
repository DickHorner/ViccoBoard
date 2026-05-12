/**
 * Exam structure and grading metadata types.
 */

import type { PrintPreset } from './tracking.types.js';

export interface Exam {
  id: string;
  title: string;
  description?: string;
  date?: Date;
  classGroupId?: string;
  assessmentFormat: ExamAssessmentFormat;
  mode: ExamMode;
  kind?: ExamKind;
  sourceTemplateId?: string;
  structure: ExamStructure;
  gradingKey: GradingKey;
  printPresets: PrintPreset[];
  candidates: Candidate[];
  candidateGroups: CandidateGroup[];
  status: 'draft' | 'in-progress' | 'completed';
  createdAt: Date;
  lastModified: Date;
}

export type ExamKind = 'template' | 'exam';

export type ExamAssessmentFormat =
  | 'klausur'
  | 'test'
  | 'mappenkorrektur'
  | 'portfolio'
  | 'referat'
  | 'referatsrueckmeldung'
  | 'facharbeit'
  | 'muendliche-pruefung'
  | 'gruppenarbeit';

export enum ExamMode {
  Simple = 'simple',
  Complex = 'complex'
}

export interface ExamStructure {
  parts: ExamPart[];
  tasks: TaskNode[];
  allowsComments: boolean;
  allowsSupportTips: boolean;
  totalPoints: number;
}

export interface ExamPart {
  id: string;
  name: string;
  description?: string;
  taskIds: string[];
  calculateSubScore: boolean;
  scoreType: 'points' | 'grade';
  printable: boolean;
  order: number;
}

export interface TaskNode {
  id: string;
  parentId?: string;
  level: 1 | 2 | 3;
  order: number;
  title: string;
  description?: string;
  points: number;
  bonusPoints?: number;
  isChoice: boolean;
  choiceGroup?: string;
  criteria: Criterion[];
  allowComments: boolean;
  allowSupportTips: boolean;
  commentBoxEnabled: boolean;
  subtasks: string[];
}

export interface Criterion {
  id: string;
  text: string;
  formatting: TextFormatting;
  points: number;
  subCriteria?: SubCriterion[];
  aspectBased: boolean;
}

export interface SubCriterion {
  id: string;
  text: string;
  formatting: TextFormatting;
  weight?: number;
}

export interface TextFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  color?: string;
}

export interface Candidate {
  id: string;
  examId: string;
  studentId?: string;
  firstName: string;
  lastName: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
}

export interface CandidateGroup {
  id: string;
  name: string;
  memberCandidateIds: string[];
  topic?: string;
  notes?: string;
}

export interface GradingKey {
  id: string;
  name: string;
  type: GradingKeyType;
  totalPoints: number;
  gradeBoundaries: GradeBoundary[];
  roundingRule: RoundingRule;
  errorPointsToGrade: boolean;
  presetId?: string;
  customizable: boolean;
  modifiedAfterCorrection: boolean;
}

export enum GradingKeyType {
  Percentage = 'percentage',
  Points = 'points',
  ErrorPoints = 'error-points',
  Custom = 'custom'
}

export interface GradeBoundary {
  grade: number | string;
  minPercentage?: number;
  maxPercentage?: number;
  minPoints?: number;
  maxPoints?: number;
  displayValue: string;
}

export interface RoundingRule {
  type: 'up' | 'down' | 'nearest' | 'none';
  decimalPlaces: number;
}

export interface GradingPreset {
  id: string;
  name: string;
  description: string;
  boundaries: GradeBoundary[];
  defaultRounding: RoundingRule;
  system: 'german-1-6' | 'german-0-15' | 'percentage' | 'custom';
}
