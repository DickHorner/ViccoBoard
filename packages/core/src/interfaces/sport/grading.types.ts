/**
 * Sport grading-related domain types.
 */

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
  Sportabzeichen = 'Sportabzeichen',
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

export interface TimeGradingConfig {
  type: 'time';
  bestGrade: number | string;
  worstGrade: number | string;
  linearMapping: boolean;
  customBoundaries?: TimeBoundary[];
  adjustableAfterwards: boolean;
}

export interface TimeBoundary {
  time: number;
  grade: number | string;
}

export interface CooperGradingConfig {
  type: 'cooper';
  SportType: 'running' | 'swimming';
  distanceUnit: 'meters' | 'kilometers';
  gradingTable?: string;
  autoEvaluation: boolean;
}

export interface ShuttleGradingConfig {
  type: 'shuttle';
  gradingTable?: string;
  configId?: string;
  autoEvaluation: boolean;
}

export interface MittelstreckeGradingConfig {
  type: 'mittelstrecke';
  gradingTable?: string;
  autoEvaluation: boolean;
}

export interface SportabzeichenConfig {
  type: 'Sportabzeichen';
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
