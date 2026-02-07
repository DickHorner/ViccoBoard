/**
 * SportZens Domain Types
 * All types specific to physical education/sports assessment
 */

import { Student, ClassGroup } from './core.types.js';

// ============================================================================
// Grading Schemes & Categories
// ============================================================================

export interface GradeScheme {
  id: string;
  name: string;
  description?: string;
  grades: GradeDefinition[];
  type: 'numeric' | 'letter' | 'points';
  createdAt: Date;
  lastModified: Date;
}

export interface GradeDefinition {
  value: string | number;
  displayValue: string;
  description?: string;
  minPercentage?: number;
  maxPercentage?: number;
}

export interface GradeCategory {
  id: string;
  classGroupId: string;
  name: string;
  description?: string;
  type: GradeCategoryType;
  weight: number;
  configuration: GradeCategoryConfig;
  createdAt: Date;
  lastModified: Date;
}

export enum GradeCategoryType {
  Criteria = 'criteria',
  Time = 'time',
  Cooper = 'cooper',
  Shuttle = 'shuttle',
  Mittelstrecke = 'mittelstrecke',
  Sportabzeichen = 'sportabzeichen',
  BJS = 'bjs',
  Verbal = 'verbal'
}

export type GradeCategoryConfig = 
  | CriteriaGradingConfig
  | TimeGradingConfig
  | CooperGradingConfig
  | ShuttleGradingConfig
  | MittelstreckeGradingConfig
  | SportabzeichenConfig
  | BJSConfig
  | VerbalAssessmentConfig;

// Criteria-based grading (up to 8 criteria)
export interface CriteriaGradingConfig {
  type: 'criteria';
  criteria: Criterion[];
  allowSelfAssessment: boolean;
  selfAssessmentViaWOW: boolean;
}

export interface Criterion {
  id: string;
  name: string;
  description?: string;
  weight: number;
  minValue: number;
  maxValue: number;
}

// Time-based grading
export interface TimeGradingConfig {
  type: 'time';
  bestGrade: number | string;
  worstGrade: number | string;
  linearMapping: boolean;
  customBoundaries?: TimeBoundary[];
  adjustableAfterwards: boolean;
}

export interface TimeBoundary {
  time: number; // in seconds
  grade: number | string;
}

// Cooper Test
export interface CooperGradingConfig {
  type: 'cooper';
  sportType: 'running' | 'swimming';
  distanceUnit: 'meters' | 'kilometers';
  gradingTable?: string; // reference to table
  autoEvaluation: boolean;
}

// Shuttle Run
export interface ShuttleGradingConfig {
  type: 'shuttle';
  gradingTable?: string; // reference to table
  configId?: string; // reference to shuttle run config
  autoEvaluation: boolean;
}

// Mittelstrecke (Middle Distance)
export interface MittelstreckeGradingConfig {
  type: 'mittelstrecke';
  gradingTable?: string; // reference to table
  autoEvaluation: boolean;
}

// Sportabzeichen (Sports Badge)
export interface SportabzeichenConfig {
  type: 'sportabzeichen';
  requiresBirthYear: boolean;
  ageDependent: boolean;
  gradingTable?: string;
  disciplines: SportabzeichenDiscipline[];
  pdfExportEnabled: boolean;
}

export interface SportabzeichenDiscipline {
  id: string;
  name: string;
  category: 'endurance' | 'strength' | 'speed' | 'coordination';
  measurementUnit: string;
}

export type SportabzeichenLevel = 'bronze' | 'silver' | 'gold' | 'none';
export type SportabzeichenGender = 'male' | 'female' | 'diverse' | 'any';

export interface SportabzeichenStandard {
  id: string;
  disciplineId: string;
  gender: SportabzeichenGender;
  ageMin: number;
  ageMax: number;
  level: Exclude<SportabzeichenLevel, 'none'>;
  comparison: 'min' | 'max';
  threshold: number;
  unit: string;
  createdAt: Date;
  lastModified: Date;
}

export interface SportabzeichenResult {
  id: string;
  studentId: string;
  disciplineId: string;
  testDate: Date;
  ageAtTest: number;
  gender: SportabzeichenGender;
  performanceValue: number;
  unit: string;
  achievedLevel: SportabzeichenLevel;
  createdAt: Date;
  lastModified: Date;
}

// Bundesjugendspiele (Federal Youth Games)
export interface BJSConfig {
  type: 'bjs';
  disciplines: BJSDiscipline[];
  gradingTable?: string;
  autoGrading: boolean;
}

export interface BJSDiscipline {
  id: string;
  name: string;
  measurementType: 'time' | 'distance' | 'height';
  unit: string;
}

// Verbal Assessment
export interface VerbalAssessmentConfig {
  type: 'verbal';
  fields: VerbalAssessmentField[];
  scales: AssessmentScale[];
  exportFormat: 'text' | 'structured';
}

export interface VerbalAssessmentField {
  id: string;
  label: string;
  type: 'text' | 'scale' | 'checkbox';
  required: boolean;
}

export interface AssessmentScale {
  id: string;
  name: string;
  levels: ScaleLevel[];
}

export interface ScaleLevel {
  value: number;
  label: string;
  description?: string;
}

// ============================================================================
// Performance Tracking
// ============================================================================

export interface PerformanceEntry {
  id: string;
  studentId: string;
  categoryId: string;
  measurements: Record<string, any>;
  calculatedGrade?: string | number;
  timestamp: Date;
  deviceInfo?: string;
  comment?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  lastModified: Date;
}

// ============================================================================
// Table Definitions
// ============================================================================

export interface TableDefinition {
  id: string;
  name: string;
  type: 'simple' | 'complex';
  description?: string;
  source: 'local' | 'imported' | 'downloaded';
  dimensions: TableDimension[];
  mappingRules: MappingRule[];
  entries: TableEntry[];
  createdAt: Date;
  lastModified: Date;
}

export interface TableDimension {
  name: 'age' | 'gender' | 'sport' | 'discipline' | 'custom';
  values: string[];
}

export interface MappingRule {
  condition: Record<string, any>;
  output: Record<string, any>;
}

export interface TableEntry {
  key: Record<string, any>; // dimension values
  value: any; // grade or performance requirement
}

// ============================================================================
// Shuttle Run Configuration
// ============================================================================

export interface ShuttleRunConfig {
  id: string;
  name: string;
  levels: ShuttleRunLevel[];
  audioSignalsEnabled: boolean;
  source: 'default' | 'imported';
  createdAt: Date;
  lastModified: Date;
}

export interface ShuttleRunLevel {
  level: number;
  lane: number; // LevelBahn
  speed: number;
  duration: number;
}

// ============================================================================
// Cooper Test Configuration
// ============================================================================

export interface CooperTestConfig {
  id: string;
  name: string;
  sportType: 'running' | 'swimming';
  distanceUnit: 'meters' | 'kilometers';
  lapLengthMeters: number;
  gradingTableId?: string;
  source: 'default' | 'imported';
  createdAt: Date;
  lastModified: Date;
}

// ============================================================================
// Live Tools
// ============================================================================

// Tournament
export interface Tournament {
  id: string;
  classGroupId: string;
  name: string;
  type: 'knockout' | 'round-robin' | 'swiss' | 'custom';
  teams: Team[];
  matches: Match[];
  status: 'planning' | 'in-progress' | 'completed';
  createdAt: Date;
  lastModified: Date;
}

export interface Team {
  id: string;
  name: string;
  studentIds: string[];
  color?: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  team1Id: string;
  team2Id: string;
  score1?: number;
  score2?: number;
  status: 'scheduled' | 'in-progress' | 'completed';
  startTime?: Date;
  endTime?: Date;
}

// Team Assignment
export interface TeamAssignment {
  id: string;
  classGroupId: string;
  lessonId?: string;
  algorithm: 'random' | 'balanced' | 'skill-based' | 'custom';
  parameters: TeamAssignmentParams;
  teams: Team[];
  createdAt: Date;
}

export interface TeamAssignmentParams {
  teamCount?: number;
  teamSize?: number;
  balanceByGender?: boolean;
  balanceBySkill?: boolean;
  avoidPairs?: string[][]; // student IDs that shouldn't be together
  keepPairs?: string[][]; // student IDs that should be together
}

// Scoreboard
export interface ScoreboardState {
  id: string;
  lessonId: string;
  teams: ScoreboardTeam[];
  currentScore: Record<string, number>;
  history: ScoreEvent[];
  createdAt: Date;
  lastModified: Date;
}

export interface ScoreboardTeam {
  id: string;
  name: string;
  color: string;
}

export interface ScoreEvent {
  timestamp: Date;
  teamId: string;
  points: number;
  type: 'add' | 'subtract' | 'set';
  description?: string;
}

// Timer
export interface TimerState {
  id: string;
  lessonId: string;
  type: 'countdown' | 'stopwatch' | 'interval';
  duration?: number;
  intervals?: TimerInterval[];
  startTime?: Date;
  pausedAt?: Date;
  elapsedTime: number;
  running: boolean;
}

export interface TimerInterval {
  name: string;
  duration: number;
  color?: string;
}

// Tactics Board
export interface TacticsBoardSnapshot {
  id: string;
  lessonId: string;
  sport: string;
  version: number;
  markings: TacticsMarking[];
  background: 'court' | 'field' | 'pitch' | 'custom';
  createdAt: Date;
}

export interface TacticsMarking {
  id: string;
  type: 'player' | 'ball' | 'arrow' | 'line' | 'circle' | 'text';
  position: { x: number; y: number };
  properties: Record<string, any>;
}

// Dice
export interface DiceLogEntry {
  id: string;
  lessonId: string;
  timestamp: Date;
  minValue: number;
  maxValue: number;
  result: number;
}

// ============================================================================
// Feedback
// ============================================================================

export interface FeedbackSession {
  id: string;
  classGroupId: string;
  lessonId?: string;
  method: FeedbackMethod;
  configuration: FeedbackConfig;
  responses: FeedbackResponse[];
  createdAt: Date;
  completedAt?: Date;
}

export interface FeedbackMethod {
  id: string;
  name: string;
  type: 'rating' | 'emoji' | 'text' | 'multi-choice' | 'custom';
  description?: string;
}

export interface FeedbackConfig {
  anonymous: boolean;
  questions: FeedbackQuestion[];
}

export interface FeedbackQuestion {
  id: string;
  text: string;
  type: 'scale' | 'text' | 'choice' | 'rating';
  required: boolean;
  options?: string[];
}

export interface FeedbackResponse {
  studentId?: string; // optional if anonymous
  answers: Record<string, any>;
  timestamp: Date;
}

// ============================================================================
// Statistics
// ============================================================================

export interface SportStatistics {
  classGroupId: string;
  period: { start: Date; end: Date };
  lessonCount: number;
  attendanceRate: number;
  averageGradesByCategory: Record<string, number>;
  studentProgress: StudentProgressSummary[];
  toolUsage: Record<string, number>;
  generatedAt: Date;
}

export interface StudentProgressSummary {
  studentId: string;
  categories: Record<string, StudentCategoryProgress>;
  attendanceRate: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
}

export interface StudentCategoryProgress {
  categoryId: string;
  currentGrade: string | number;
  entries: number;
  trend: 'improving' | 'stable' | 'declining';
  lastEntry: Date;
}

// ============================================================================
// WOW (Workouts Online Worksheet)
// ============================================================================

export interface Workout {
  id: string;
  classGroupId: string;
  title: string;
  description?: string;
  exercises: Exercise[];
  dueDate?: Date;
  accessToken: string;
  webUrl: string;
  status: 'draft' | 'published' | 'closed';
  createdAt: Date;
  lastModified: Date;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  type: 'reps' | 'time' | 'distance' | 'custom';
  required: boolean;
}

export interface WorkoutSubmission {
  id: string;
  workoutId: string;
  studentId: string;
  results: ExerciseResult[];
  selfAssessment?: Record<string, any>;
  submittedAt: Date;
  completedAt?: Date;
}

export interface ExerciseResult {
  exerciseId: string;
  value: number;
  unit: string;
  comment?: string;
  timestamp: Date;
}

export interface WorkoutProgress {
  workoutId: string;
  studentId: string;
  completionPercentage: number;
  exercisesCompleted: number;
  totalExercises: number;
  lastActivity: Date;
}
