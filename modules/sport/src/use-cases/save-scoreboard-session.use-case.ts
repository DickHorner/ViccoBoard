/**
 * Save Scoreboard Session Use Case
 * Persists a scoreboard match session as a ToolSession (toolType = 'scoreboard').
 */

import { Sport } from '@viccoboard/core';
import type { ToolSessionRepository } from '../repositories/tool-session.repository.js';

export interface ScoreboardTeamInput {
  id: string;
  name: string;
  color?: string;
}

export interface ScoreEventInput {
  teamId: string;
  points: number;
  type: 'add' | 'subtract' | 'set';
  description?: string;
  timestamp?: string;
}

export interface SaveScoreboardSessionInput {
  sessionId?: string;
  classGroupId?: string;
  lessonId?: string;
  sessionName: string;
  teams: ScoreboardTeamInput[];
  scores: Record<string, number>;
  history: ScoreEventInput[];
  linkedTeamSessionId?: string;
  linkedTimerSessionId?: string;
}

export interface ScoreboardSessionMetadata {
  sessionName: string;
  teams: ScoreboardTeamInput[];
  scores: Record<string, number>;
  history: Array<ScoreEventInput & { timestamp: string }>;
  linkedTeamSessionId?: string;
  linkedTimerSessionId?: string;
}

export class SaveScoreboardSessionUseCase {
  constructor(private toolSessionRepository: ToolSessionRepository) {}

  async execute(input: SaveScoreboardSessionInput): Promise<Sport.ToolSession> {
    if (!input.sessionName || !input.sessionName.trim()) {
      throw new Error('sessionName is required');
    }

    if (!input.teams || input.teams.length < 2) {
      throw new Error('at least 2 teams are required');
    }

    const metadata: ScoreboardSessionMetadata = {
      sessionName: input.sessionName.trim(),
      teams: input.teams,
      scores: input.scores,
      history: input.history.map(entry => ({
        ...entry,
        timestamp: entry.timestamp ?? new Date().toISOString()
      })),
      linkedTeamSessionId: input.linkedTeamSessionId,
      linkedTimerSessionId: input.linkedTimerSessionId
    };

    if (input.sessionId) {
      return this.toolSessionRepository.update(input.sessionId, {
        sessionMetadata: metadata,
        endedAt: new Date()
      });
    }

    return this.toolSessionRepository.create({
      toolType: 'scoreboard',
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      sessionMetadata: metadata
    });
  }
}
