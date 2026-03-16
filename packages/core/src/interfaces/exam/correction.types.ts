/**
 * Exam correction, support tip, and analysis types.
 */

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

export interface CorrectionMode {
  type: 'compact' | 'task-wise' | 'table' | 'splitscreen';
  configuration: CorrectionModeConfig;
}

export interface CorrectionModeConfig {
  autoCalculateTotal?: boolean;
  showPointsToNextGrade?: boolean;
  tabNavigation?: boolean;
  taskId?: string;
  showAllCandidates?: boolean;
  tableView?: boolean;
  candidateIds?: string[];
  maxSimultaneous?: number;
  groupTopic?: string;
}

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
  difficulty: number;
  discrimination: number;
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
