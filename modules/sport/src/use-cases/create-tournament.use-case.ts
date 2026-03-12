/**
 * CreateTournamentUseCase
 * Validates input, generates the schedule, and persists the tournament.
 */

import { Sport } from '@viccoboard/core';
import { TournamentRepository } from '../repositories/tournament.repository.js';
import { TournamentService } from '../services/tournament.service.js';

export interface CreateTournamentInput {
  classGroupId: string;
  name: string;
  type: 'round-robin' | 'knockout';
  teams: Array<{
    id: string;
    name: string;
    studentIds: string[];
    color?: string;
  }>;
}

export class CreateTournamentUseCase {
  constructor(
    private readonly tournamentRepository: TournamentRepository,
    private readonly tournamentService: TournamentService
  ) {}

  async execute(input: CreateTournamentInput): Promise<Sport.Tournament> {
    if (!input.classGroupId || !input.classGroupId.trim()) {
      throw new Error('classGroupId is required');
    }
    if (!input.name || !input.name.trim()) {
      throw new Error('Tournament name is required');
    }
    if (!['round-robin', 'knockout'].includes(input.type)) {
      throw new Error('type must be one of: round-robin, knockout');
    }
    if (!input.teams || input.teams.length < 2) {
      throw new Error('At least 2 teams are required');
    }

    const teams: Sport.Team[] = input.teams.map(t => ({
      id: t.id,
      name: t.name,
      studentIds: t.studentIds,
      color: t.color
    }));

    // Generate a temporary ID for the tournament so the schedule can reference it
    const { v4: uuidv4 } = await import('uuid');
    const tournamentId = uuidv4();

    let matches: Sport.Match[];
    if (input.type === 'round-robin') {
      matches = this.tournamentService.generateRoundRobinSchedule(
        tournamentId,
        teams
      );
    } else {
      matches = this.tournamentService.generateKnockoutBracket(
        tournamentId,
        teams
      );
    }

    const tournament = await this.tournamentRepository.create({
      classGroupId: input.classGroupId.trim(),
      name: input.name.trim(),
      type: input.type,
      teams,
      matches
    });

    // Overwrite the id so all match.tournamentId values are consistent
    // (the repository assigned a fresh UUID, so we need to sync up if they differ)
    if (tournament.id !== tournamentId) {
      const syncedMatches = tournament.matches.map(m => ({
        ...m,
        tournamentId: tournament.id
      }));
      return this.tournamentRepository.update(tournament.id, {
        matches: syncedMatches
      });
    }

    return tournament;
  }
}
