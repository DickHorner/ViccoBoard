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

  async cancelMatch(tournamentId: string, matchId: string): Promise<Sport.Tournament> {
    const tournament = await this.tournamentRepository.findById(tournamentId);
    if (!tournament || tournament.type !== 'adaptive') throw new Error('Adaptive tournament not found');
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match || match.status !== 'scheduled') throw new Error('Only scheduled matches can be cancelled');
    return this.tournamentRepository.update(tournamentId, {
      matches: tournament.matches.map(m => m.id === matchId ? { ...m, status: 'cancelled' } : m)
    });
  }

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

    const next = (tournament.teamSize ?? 1) === 1
      ? this.tournamentService.generateAdaptiveRound(
        tournament.id,
        tournament.teams,
        tournament.matches,
        input.participantIds,
        input.sessionDate
      )
      : this.tournamentService.generateRotatingTeamRound(
        tournament.id,
        tournament.teams,
        tournament.matches,
        input.participantIds,
        input.sessionDate,
        tournament.teamSize!
      );
    return this.tournamentRepository.update(tournament.id, {
      matches: [...tournament.matches, ...next],
      status: 'in-progress'
    });
  }
}
