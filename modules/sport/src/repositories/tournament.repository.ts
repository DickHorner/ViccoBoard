/**
 * Tournament Repository
 * Manages persistence for tournament structures (teams + matches stored as JSON).
 */

import { Sport } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTournamentInput {
  classGroupId: string;
  name: string;
  type: Sport.Tournament['type'];
  teams: Sport.Team[];
  matches: Sport.Match[];
}

export class TournamentRepository {
  constructor(private adapter: StorageAdapter) {}

  private toDomain(dbRecord: any): Sport.Tournament {
    return {
      id: dbRecord.id,
      classGroupId: dbRecord.class_group_id,
      name: dbRecord.name,
      type: dbRecord.type as Sport.Tournament['type'],
      teams:
        typeof dbRecord.teams === 'string'
          ? JSON.parse(dbRecord.teams)
          : dbRecord.teams,
      matches:
        typeof dbRecord.matches === 'string'
          ? JSON.parse(dbRecord.matches)
          : dbRecord.matches,
      status: dbRecord.status as Sport.Tournament['status'],
      createdAt: new Date(dbRecord.created_at),
      lastModified: new Date(dbRecord.last_modified)
    };
  }

  async create(input: CreateTournamentInput): Promise<Sport.Tournament> {
    const now = new Date();
    const tournament: Sport.Tournament = {
      id: uuidv4(),
      classGroupId: input.classGroupId,
      name: input.name,
      type: input.type,
      teams: input.teams,
      matches: input.matches,
      status: 'planning',
      createdAt: now,
      lastModified: now
    };

    await this.adapter.insert('tournaments', {
      id: tournament.id,
      class_group_id: tournament.classGroupId,
      name: tournament.name,
      type: tournament.type,
      teams: JSON.stringify(tournament.teams),
      matches: JSON.stringify(tournament.matches),
      status: tournament.status,
      created_at: tournament.createdAt.toISOString(),
      last_modified: tournament.lastModified.toISOString()
    });

    return tournament;
  }

  async findById(id: string): Promise<Sport.Tournament | null> {
    const result = await this.adapter.getById<any>('tournaments', id);
    return result ? this.toDomain(result) : null;
  }

  async findByClassGroup(classGroupId: string): Promise<Sport.Tournament[]> {
    const results = await this.adapter.getAll<any>('tournaments', {
      class_group_id: classGroupId
    });
    return results.map(r => this.toDomain(r));
  }

  async findAll(): Promise<Sport.Tournament[]> {
    const results = await this.adapter.getAll<any>('tournaments');
    return results.map(r => this.toDomain(r));
  }

  async update(
    id: string,
    updates: Partial<Pick<Sport.Tournament, 'name' | 'status' | 'teams' | 'matches'>>
  ): Promise<Sport.Tournament> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Tournament ${id} not found`);
    }

    const updated: Sport.Tournament = {
      ...existing,
      ...updates,
      lastModified: new Date()
    };

    await this.adapter.update('tournaments', id, {
      name: updated.name,
      status: updated.status,
      teams: JSON.stringify(updated.teams),
      matches: JSON.stringify(updated.matches),
      last_modified: updated.lastModified.toISOString()
    });

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.adapter.delete('tournaments', id);
  }
}
