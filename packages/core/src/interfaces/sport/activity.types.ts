/**
 * Sport workout, biomechanics, and exercise database types.
 */

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

export type GameCategory =
  | 'erwaermung'
  | 'ballspiel'
  | 'reaktionsspiel'
  | 'laufspiel'
  | 'koordination'
  | 'kooperation'
  | 'entspannung'
  | 'kraft'
  | 'ausdauer'
  | 'sonstiges';

export type GameDifficulty = 'anfaenger' | 'fortgeschrittene' | 'profis';

export type GamePhase = 'erwaermung' | 'hauptteil' | 'schluss';

export type BodyPoint =
  | 'head'
  | 'neck'
  | 'shoulder-left'
  | 'shoulder-right'
  | 'elbow-left'
  | 'elbow-right'
  | 'wrist-left'
  | 'wrist-right'
  | 'hip-left'
  | 'hip-right'
  | 'knee-left'
  | 'knee-right'
  | 'ankle-left'
  | 'ankle-right';

export interface BiomechanicsMarker {
  bodyPoint: BodyPoint;
  x: number;
  y: number;
  color?: string;
}

export interface BiomechanicsKeyframe {
  id: string;
  timeSec: number;
  markers: BiomechanicsMarker[];
}

export interface SlowMotionSessionMetadata {
  sessionName: string;
  studentLabel?: string;
  exerciseName?: string;
  videoDurationSec?: number;
  keyframes: BiomechanicsKeyframe[];
  notes?: string;
  referenceLines?: Array<{ id: string; x1: number; y1: number; x2: number; y2: number; color?: string }>;
}

export interface GameEntry {
  id: string;
  name: string;
  category: GameCategory;
  phase: GamePhase;
  difficulty: GameDifficulty;
  duration: number;
  ageGroup: string;
  material?: string;
  goal: string;
  description: string;
  variation?: string;
  notes?: string;
  sportType?: string;
  isCustom: boolean;
  createdAt: Date;
  lastModified: Date;
}
