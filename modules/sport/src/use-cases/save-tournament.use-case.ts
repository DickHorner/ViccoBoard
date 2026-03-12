/**
 * Save Tournament Use Case
 * Persists a tournament (create or update) as a ToolSession (toolType = 'tournament').
 */

import { Sport } from '@viccoboard/core';
import type { ToolSessionRepository } from '../repositories/tool-session.repository.js';

export interface SaveTournamentInput {
  /** Provide an existing session id to update, omit to create new */
  sessionId?: string;
  classGroupId?: string;
  lessonId?: string;
  tournament: TournamentData;
}

export interface TournamentData {
  id: string;
  name: string;
  type: 'knockout' | 'round-robin';
  teams: Array<{ id: string; name: string; color?: string }>;
  matches: Array<{
    id: string;
    round: number;
    team1Id: string;
    team2Id: string;
    score1?: number;
    score2?: number;
    status: 'scheduled' | 'in-progress' | 'completed';
  }>;
  status: 'planning' | 'in-progress' | 'completed';
}

export class SaveTournamentUseCase {
  constructor(private toolSessionRepository: ToolSessionRepository) {}

  async execute(input: SaveTournamentInput): Promise<Sport.ToolSession> {
    if (!input.tournament) {
      throw new Error('tournament data is required');
    }
    if (!input.tournament.name || !input.tournament.name.trim()) {
      throw new Error('tournament name is required');
    }
    if (!input.tournament.teams || input.tournament.teams.length < 2) {
      throw new Error('at least 2 teams are required');
    }
    if (!['knockout', 'round-robin'].includes(input.tournament.type)) {
      throw new Error('tournament type must be one of: knockout, round-robin');
    }

    const metadata = { tournament: input.tournament };

    if (input.sessionId) {
      return this.toolSessionRepository.update(input.sessionId, {
        sessionMetadata: metadata
      });
    }

    return this.toolSessionRepository.create({
      toolType: 'tournament',
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      sessionMetadata: metadata
    });
  }
}
