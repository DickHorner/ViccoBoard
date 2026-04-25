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

    const tournamentId = crypto.randomUUID();

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

    // Pass the pre-generated ID so matches and tournament share the same ID
    // without requiring a second database round-trip.
    return this.tournamentRepository.create({
      id: tournamentId,
      classGroupId: input.classGroupId.trim(),
      name: input.name.trim(),
      type: input.type,
      teams,
      matches
    });
  }
}
