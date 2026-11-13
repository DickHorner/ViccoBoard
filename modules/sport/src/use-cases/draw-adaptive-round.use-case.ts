import { Sport } from '@viccoboard/core';
import { TournamentRepository } from '../repositories/tournament.repository.js';
import { TournamentService } from '../services/tournament.service.js';

export interface DrawAdaptiveRoundInput {
  tournamentId: string;
  participantIds: string[];
  sessionDate: string;
}

export class DrawAdaptiveRoundUseCase {
  constructor(
    private readonly tournamentRepository: TournamentRepository,
    private readonly tournamentService: TournamentService
  ) {}

  async execute(input: DrawAdaptiveRoundInput): Promise<Sport.Tournament> {
    if (!input.tournamentId || !/^\d{4}-\d{2}-\d{2}$/.test(input.sessionDate)) {
      throw new Error('A tournament and valid session date are required');
    }
    const tournament = await this.tournamentRepository.findById(input.tournamentId);
    if (!tournament || tournament.type !== 'adaptive') {
      throw new Error('Adaptive tournament not found');
    }
    if (tournament.status === 'completed') {
      throw new Error('Tournament is closed');
    }

    const next = this.tournamentService.generateAdaptiveRound(
      tournament.id,
      tournament.teams,
      tournament.matches,
      input.participantIds,
      input.sessionDate
    );
    return this.tournamentRepository.update(tournament.id, {
      matches: [...tournament.matches, ...next],
      status: 'in-progress'
    });
  }
}
