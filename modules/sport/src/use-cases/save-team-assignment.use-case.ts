/**
 * Save Team Assignment Use Case
 * Persists a generated team assignment as a ToolSession (toolType = 'teams').
 * Follows the same persistence pattern as RecordTimerResultUseCase.
 */

import { Sport } from '@viccoboard/core';
import type { ToolSessionRepository } from '../repositories/tool-session.repository.js';

export interface SaveTeamAssignmentInput {
  /** The class this team assignment belongs to (required for context). */
  classGroupId: string;
  /** Optional lesson context. */
  lessonId?: string;
  /** Human-readable name for the saved session (e.g. "Volleyball 14.03."). */
  sessionName: string;
  /** Algorithm that was used to generate the teams. */
  algorithm: 'random' | 'gender-balanced';
  /** Label prefix used for team names. */
  teamLabel: string;
  /** The generated teams. */
  teams: Array<{
    id: string;
    name: string;
    studentIds: string[];
    color?: string;
  }>;
}

/** Shape of sessionMetadata stored for a team session. */
export interface TeamSessionMetadata {
  sessionName: string;
  algorithm: 'random' | 'gender-balanced';
  teamLabel: string;
  teams: Array<{
    id: string;
    name: string;
    studentIds: string[];
    color?: string;
  }>;
}

export class SaveTeamAssignmentUseCase {
  constructor(private toolSessionRepository: ToolSessionRepository) {}

  async execute(input: SaveTeamAssignmentInput): Promise<Sport.ToolSession> {
    if (!input.classGroupId) {
      throw new Error('classGroupId is required');
    }
    if (!input.teams || input.teams.length === 0) {
      throw new Error('teams must not be empty');
    }
    if (!input.sessionName || !input.sessionName.trim()) {
      throw new Error('sessionName is required');
    }
    if (!['random', 'gender-balanced'].includes(input.algorithm)) {
      throw new Error('algorithm must be one of: random, gender-balanced');
    }

    return this.toolSessionRepository.create({
      toolType: 'teams',
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      sessionMetadata: {
        sessionName: input.sessionName.trim(),
        algorithm: input.algorithm,
        teamLabel: input.teamLabel,
        teams: input.teams
      }
    });
  }
}
