/**
 * KURT Domain Types
 * All types specific to exam creation, correction, and assessment
 */

import { Student } from './core.types';

// ============================================================================
// Exam Structure
// ============================================================================

export interface Exam {
  id: string;
  title: string;
  description?: string;
  classGroupId?: string;
  mode: ExamMode;
  structure: ExamStructure;
  gradingKey: GradingKey;
  printPresets: PrintPreset[];
  candidates: Candidate[];
  status: 'draft' | 'in-progress' | 'completed';
  createdAt: Date;
  lastModified: Date;
}

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
  parentId?: string; // null for top-level tasks
  level: 1 | 2 | 3; // max 3 levels in complex mode
  order: number;
  title: string;
  description?: string;
  points: number;
  bonusPoints?: number;
  isChoice: boolean; // for choice tasks (e.g., 3a/3b)
  choiceGroup?: string;
  criteria: Criterion[];
  allowComments: boolean;
  allowSupportTips: boolean;
  commentBoxEnabled: boolean;
  subtasks: string[]; // IDs of child tasks
}

export interface Criterion {
  id: string;
  text: string;
  formatting: TextFormatting;
  points: number;
  subCriteria?: SubCriterion[];
  aspectBased: boolean; // for EWH workflow
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

// ============================================================================
// Candidates
// ============================================================================

export interface Candidate {
  id: string;
  examId: string;
  studentId?: string; // optional, can be external
  firstName: string;
  lastName: string;
  externalId?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Grading Keys
// ============================================================================

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

// ============================================================================
// Correction & Scoring
// ============================================================================

export interface CorrectionEntry {
  id: string;
  examId: string;
  candidateId: string;
  taskScores: TaskScore[];
  totalPoints: number;
  totalGrade: string | number;
  percentageScore: number;
  comments: CorrectionComment[];
  supportTips: AssignedSupportTip[];
  highlightedWork?: HighlightedWork[];
  status: 'not-started' | 'in-progress' | 'completed';
  correctedBy?: string;
  correctedAt?: Date;
  lastModified: Date;
}

export interface TaskScore {
  taskId: string;
  points: number;
  maxPoints: number;
  alternativeGrading?: AlternativeGrading;
  partialPoints?: PartialPoint[];
  criterionScores?: CriterionScore[];
  comment?: string;
  timestamp: Date;
}

export interface AlternativeGrading {
  type: '++' | '+' | '0' | '-' | '--';
  points: number;
}

export interface PartialPoint {
  criterionId: string;
  points: number;
  maxPoints: number;
}

export interface CriterionScore {
  criterionId: string;
  points: number;
  maxPoints: number;
  subCriterionScores?: SubCriterionScore[];
}

export interface SubCriterionScore {
  subCriterionId: string;
  achieved: boolean;
  weight?: number;
}

export interface CorrectionComment {
  id: string;
  taskId?: string;
  level: 'exam' | 'task' | 'subtask';
  text: string;
  printable: boolean;
  availableAfterReturn: boolean;
  timestamp: Date;
}

// ============================================================================
// Support Tips (Fördertipps)
// ============================================================================

export interface SupportTip {
  id: string;
  title: string;
  shortDescription: string;
  category?: string;
  tags: string[];
  links: SupportTipLink[];
  qrCode?: string;
  priority: number;
  weight: number;
  usageCount: number;
  createdAt: Date;
  lastModified: Date;
  lastUsed?: Date;
}

export interface SupportTipLink {
  url: string;
  title: string;
  description?: string;
}

export interface AssignedSupportTip {
  supportTipId: string;
  taskId?: string;
  subtaskId?: string;
  assignedAt: Date;
  weight?: number;
  notes?: string;
}

export interface SupportTipAnalytics {
  examId: string;
  candidateId?: string;
  tipUsage: TipUsageSummary[];
  needsByArea: Record<string, number>;
  mostCommonTips: string[];
  generatedAt: Date;
}

export interface TipUsageSummary {
  supportTipId: string;
  frequency: number;
  candidates: string[];
  tasks: string[];
}

// ============================================================================
// Correction Modes
// ============================================================================

export interface CorrectionMode {
  type: 'compact' | 'task-wise' | 'table' | 'splitscreen';
  configuration: CorrectionModeConfig;
}

export interface CorrectionModeConfig {
  // Compact mode
  autoCalculateTotal?: boolean;
  showPointsToNextGrade?: boolean;
  tabNavigation?: boolean;
  
  // Task-wise mode (AWK)
  taskId?: string;
  showAllCandidates?: boolean;
  tableView?: boolean;
  
  // Splitscreen mode
  candidateIds?: string[];
  maxSimultaneous?: number; // up to 4
  groupTopic?: string;
}

// ============================================================================
// Analysis & Adjustment
// ============================================================================

export interface ExamAnalysis {
  examId: string;
  difficulty: DifficultyAnalysis;
  distribution: ScoreDistribution;
  taskAnalysis: TaskAnalysis[];
  generatedAt: Date;
}

export interface DifficultyAnalysis {
  overallDifficulty: 'easy' | 'medium' | 'hard';
  averageScore: number;
  medianScore: number;
  standardDeviation: number;
  difficultTasks: string[];
  easyTasks: string[];
}

export interface ScoreDistribution {
  grades: GradeDistribution[];
  histogram: HistogramBin[];
  passRate: number;
}

export interface GradeDistribution {
  grade: string | number;
  count: number;
  percentage: number;
}

export interface HistogramBin {
  minPoints: number;
  maxPoints: number;
  count: number;
}

export interface TaskAnalysis {
  taskId: string;
  averagePoints: number;
  maxPoints: number;
  difficulty: number; // 0-1
  discrimination: number; // correlation with total score
  criterionAnalysis?: CriterionAnalysis[];
}

export interface CriterionAnalysis {
  criterionId: string;
  averagePoints: number;
  maxPoints: number;
  achievementRate: number;
}

export interface PointAdjustment {
  examId: string;
  adjustments: TaskAdjustment[];
  reason: string;
  appliedAt: Date;
  appliedBy: string;
}

export interface TaskAdjustment {
  taskId: string;
  oldWeight: number;
  newWeight: number;
  oldPoints: number;
  newPoints: number;
  maintainRatios: boolean;
}

// ============================================================================
// Long-term Tracking
// ============================================================================

export interface StudentLongTermRecord {
  studentId: string;
  schoolYear: string;
  competencyAreas: CompetencyArea[];
  notes: LongTermNote[];
  exams: StudentExamSummary[];
}

export interface CompetencyArea {
  id: string;
  name: string;
  description?: string;
  development: 'improving' | 'stable' | 'needs-attention';
  lastAssessed: Date;
}

export interface LongTermNote {
  id: string;
  date: Date;
  category: 'development' | 'strength' | 'support-need' | 'general';
  text: string;
  linkedExamId?: string;
}

export interface StudentExamSummary {
  examId: string;
  examTitle: string;
  date: Date;
  grade: string | number;
  points: number;
  maxPoints: number;
  percentageScore: number;
  taskComments: string[];
  supportTips: string[];
}

// ============================================================================
// Export & Sharing
// ============================================================================

export interface FeedbackSheet {
  examId: string;
  candidateId: string;
  layout: FeedbackLayout;
  header: FeedbackHeader;
  content: FeedbackContent;
  footer: FeedbackFooter;
  generatedAt: Date;
}

export interface FeedbackLayout {
  id: string;
  name: string;
  type: 'compact' | 'detailed' | 'extended' | 'custom';
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
}

export interface FeedbackHeader {
  schoolName?: string;
  schoolLogo?: string;
  examTitle: string;
  examDate?: Date;
  studentName: string;
  customFields?: Record<string, string>;
}

export interface FeedbackContent {
  showTaskBreakdown: boolean;
  showCriteria: boolean;
  showPercentages: boolean;
  showPointDeductions: boolean;
  showComments: boolean;
  showSupportTips: boolean;
  formatCriteriaText: boolean;
  italicizeComments: boolean;
}

export interface FeedbackFooter {
  signature?: string; // base64 image or empty
  signatureType: 'image' | 'drawn' | 'empty';
  teacherName?: string;
  date?: Date;
  customText?: string;
}

export interface PrintPreset {
  id: string;
  name: string;
  layout: FeedbackLayout;
  header: Partial<FeedbackHeader>;
  content: FeedbackContent;
  footer: Partial<FeedbackFooter>;
  isDefault: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  placeholders: EmailPlaceholder[];
  attachPDF: boolean;
  createdAt: Date;
  lastModified: Date;
}

export interface EmailPlaceholder {
  key: string;
  description: string;
  example: string;
  type: 'text' | 'number' | 'grade' | 'date';
}

export interface EmailSendRecord {
  id: string;
  examId: string;
  candidateId: string;
  recipientType: 'student' | 'parent' | 'both';
  recipients: string[];
  templateId: string;
  sentAt: Date;
  status: 'sent' | 'failed' | 'bounced';
  error?: string;
}

// ============================================================================
// Special Features
// ============================================================================

export interface HighlightedWork {
  id: string;
  examId: string;
  candidateId: string;
  taskId?: string;
  category: string;
  description: string;
  imageUri?: string;
  textContent?: string;
  anonymized: boolean;
  tags: string[];
  createdAt: Date;
}

export interface CommentReuse {
  examId: string;
  taskId?: string;
  comments: ReusableComment[];
}

export interface ReusableComment {
  text: string;
  frequency: number;
  lastUsed: Date;
  candidateIds: string[];
}

export interface GroupCorrection {
  id: string;
  examId: string;
  candidateIds: string[];
  topic?: string;
  presentationType: 'presentation' | 'oral' | 'group-work';
  mode: 'splitscreen' | 'sequential';
  fullscreen: boolean;
  maxSimultaneous: number;
  createdAt: Date;
}

// ============================================================================
// Integrations
// ============================================================================

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
