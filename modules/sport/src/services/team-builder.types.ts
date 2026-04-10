export type TeamAlgorithm = 'random' | 'gender-balanced' | 'homogeneous' | 'heterogeneous';
export type TeamBasis = 'gender' | 'performance' | 'performanceRating';

export interface TeamStudent {
  id: string;
  gender?: 'm' | 'f' | null;
  performanceScore?: number | null;
  performanceRating?: number | null;
}

export interface TeamConstraints {
  alwaysTogether?: string[][];
  neverTogether?: string[][];
}

export interface TeamConstraintConflict {
  type: 'alwaysTogether-group-too-large' | 'direct-contradiction' | 'neverTogether-unsatisfiable';
  message: string;
  studentIds?: string[];
}

export class TeamConstraintError extends Error {
  readonly conflicts: TeamConstraintConflict[];

  constructor(message: string, conflicts: TeamConstraintConflict[]) {
    super(message);
    this.name = 'TeamConstraintError';
    this.conflicts = conflicts;
  }
}

export interface TeamBuildInput {
  students: TeamStudent[];
  teamCount: number;
  teamLabel: string;
  algorithm?: TeamAlgorithm;
  basis?: TeamBasis;
  roles?: string[];
  constraints?: TeamConstraints;
}

export interface BuiltTeam {
  id: string;
  name: string;
  studentIds: string[];
  roles?: Record<string, string>;
}
