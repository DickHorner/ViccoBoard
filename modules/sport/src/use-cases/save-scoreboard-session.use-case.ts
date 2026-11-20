/**
 * Save Scoreboard Session Use Case
 * Persists a scoreboard match session as a ToolSession (toolType = 'scoreboard').
 */

import { Sport } from '@viccoboard/core';
import type { RoundExclusionMode } from '../services/round-number-picker.service.js';
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

/** Snapshot of the inline timer state stored alongside a scoreboard session. */
export interface InlineTimerState {
  /** Accumulated elapsed time in milliseconds. */
  elapsedMs: number;
  /** Whether the timer was actively running when the session was saved. */
  running: boolean;
}

export interface ScoreboardRoundSettings {
  sport: 'basketball' | 'standard' | 'custom';
  customPoints: number;
  timerMode: 'stopwatch' | 'countdown';
  roundDurationMs: number;
  numberPickerEnabled: boolean;
  teamSize: number;
  playersPerRound: number;
  exclusionMode: RoundExclusionMode;
  selectionMethod: 'random' | 'manual';
  activeNumbers: number[];
  roundActive: boolean;
  pendingNumbers: number[];
  roundHistory: number[][];
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
  /** Number of active team slots shown (2 or 4). */
  layout?: 2 | 4;
  /** Inline timer state persisted with the session. */
  inlineTimer?: InlineTimerState;
  roundSettings?: ScoreboardRoundSettings;
}

export interface ScoreboardSessionMetadata {
  sessionName: string;
  teams: ScoreboardTeamInput[];
  scores: Record<string, number>;
  history: Array<ScoreEventInput & { timestamp: string }>;
  linkedTeamSessionId?: string;
  linkedTimerSessionId?: string;
  /** Number of active team slots shown (2 or 4). */
  layout?: 2 | 4;
  /** Inline timer state persisted with the session. */
  inlineTimer?: InlineTimerState;
  roundSettings?: ScoreboardRoundSettings;
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
      linkedTimerSessionId: input.linkedTimerSessionId,
      layout: input.layout,
      inlineTimer: input.inlineTimer,
      roundSettings: input.roundSettings
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
