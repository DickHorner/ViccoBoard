/**
 * UpdateTournamentMatchUseCase
 * Records a match result and advances the knockout bracket if applicable.
 */

import { Sport } from '@viccoboard/core';
import { TournamentRepository } from '../repositories/tournament.repository.js';
import { TournamentService } from '../services/tournament.service.js';

export interface UpdateTournamentMatchInput {
  tournamentId: string;
  matchId: string;
  score1: number;
  score2: number;
}

export class UpdateTournamentMatchUseCase {
  constructor(
    private readonly tournamentRepository: TournamentRepository,
    private readonly tournamentService: TournamentService
  ) {}

  async execute(
    input: UpdateTournamentMatchInput
  ): Promise<Sport.Tournament> {
    if (!input.tournamentId) {
      throw new Error('tournamentId is required');
    }
    if (!input.matchId) {
      throw new Error('matchId is required');
    }
    if (input.score1 < 0 || input.score2 < 0) {
      throw new Error('Scores must be non-negative');
    }

    const tournament = await this.tournamentRepository.findById(
      input.tournamentId
    );
    if (!tournament) {
      throw new Error(`Tournament ${input.tournamentId} not found`);
    }

    // Knockout matches must have a clear winner (no draws allowed)
    if (tournament.type === 'knockout' && input.score1 === input.score2) {
      throw new Error('Knockout matches must have a winner — scores cannot be equal');
    }

    const matchIndex = tournament.matches.findIndex(
      m => m.id === input.matchId
    );
    if (matchIndex === -1) {
      throw new Error(
        `Match ${input.matchId} not found in tournament ${input.tournamentId}`
      );
    }

    // Update the specific match
    let updatedMatch: Sport.Match = {
      ...tournament.matches[matchIndex],
      score1: input.score1,
      score2: input.score2,
      status: 'completed',
      endTime: new Date()
    };

    let updatedMatches = tournament.matches.map((m, i) =>
      i === matchIndex ? updatedMatch : m
    );

    // For knockout tournaments, propagate the winner to the next round
    if (tournament.type === 'knockout') {
      updatedMatches = this.tournamentService.advanceKnockoutWinner(
        updatedMatches,
        updatedMatch
      );
    }

    // Determine new tournament status
    const allDone = this.tournamentService.isTournamentComplete(updatedMatches);
    const newStatus: Sport.Tournament['status'] = allDone
      ? 'completed'
      : 'in-progress';

    return this.tournamentRepository.update(tournament.id, {
      matches: updatedMatches,
      status: newStatus
    });
  }
}
