/**
 * Sport live tool, feedback, and statistics types.
 */

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
  round: number;
  sequence: number;
  status: 'scheduled' | 'in-progress' | 'completed';
  startTime?: Date;
  endTime?: Date;
}

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
  avoidPairs?: string[][];
  keepPairs?: string[][];
}

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

export interface TacticsBoardSnapshot {
  id: string;
  lessonId?: string;
  sport: string;
  title: string;
  version: number;
  markings: TacticsMarking[];
  background: 'court' | 'field' | 'pitch' | 'custom';
  createdAt: Date;
  lastModified: Date;
}

export interface TacticsMarking {
  id: string;
  type: 'player' | 'ball' | 'arrow' | 'line' | 'circle' | 'text';
  position: { x: number; y: number };
  properties: Record<string, any>;
}

export interface DiceLogEntry {
  id: string;
  lessonId: string;
  timestamp: Date;
  minValue: number;
  maxValue: number;
  result: number;
}

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
  studentId?: string;
  answers: Record<string, any>;
  timestamp: Date;
}

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
