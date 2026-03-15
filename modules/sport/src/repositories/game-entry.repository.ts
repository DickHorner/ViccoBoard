/**
 * GameEntry Repository
 * Manages persistence for the local sport game / exercise database.
 */

import { Sport } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';
import { v4 as uuidv4 } from 'uuid';

export interface CreateGameEntryInput {
  name: string;
  category: Sport.GameCategory;
  phase: Sport.GamePhase;
  difficulty: Sport.GameDifficulty;
  duration: number;
  ageGroup: string;
  material?: string;
  goal: string;
  description: string;
  variation?: string;
  notes?: string;
  sportType?: string;
  isCustom?: boolean;
}

export class GameEntryRepository {
  constructor(private adapter: StorageAdapter) {}

  private toDomain(raw: any): Sport.GameEntry {
    return {
      id: raw.id,
      name: raw.name,
      category: raw.category as Sport.GameCategory,
      phase: raw.phase as Sport.GamePhase,
      difficulty: raw.difficulty as Sport.GameDifficulty,
      duration: Number(raw.duration ?? 0),
      ageGroup: raw.age_group ?? '',
      material: raw.material ?? undefined,
      goal: raw.goal ?? '',
      description: raw.description ?? '',
      variation: raw.variation ?? undefined,
      notes: raw.notes ?? undefined,
      sportType: raw.sport_type ?? undefined,
      isCustom: Boolean(raw.is_custom),
      createdAt: new Date(raw.created_at),
      lastModified: new Date(raw.last_modified)
    };
  }

  async create(input: CreateGameEntryInput): Promise<Sport.GameEntry> {
    const now = new Date();
    const entry: Sport.GameEntry = {
      id: uuidv4(),
      name: input.name,
      category: input.category,
      phase: input.phase,
      difficulty: input.difficulty,
      duration: input.duration,
      ageGroup: input.ageGroup,
      material: input.material,
      goal: input.goal,
      description: input.description,
      variation: input.variation,
      notes: input.notes,
      sportType: input.sportType,
      isCustom: input.isCustom ?? true,
      createdAt: now,
      lastModified: now
    };

    await this.adapter.insert('game_entries', {
      id: entry.id,
      name: entry.name,
      category: entry.category,
      phase: entry.phase,
      difficulty: entry.difficulty,
      duration: entry.duration,
      age_group: entry.ageGroup,
      material: entry.material ?? null,
      goal: entry.goal,
      description: entry.description,
      variation: entry.variation ?? null,
      notes: entry.notes ?? null,
      sport_type: entry.sportType ?? null,
      is_custom: entry.isCustom ? 1 : 0,
      created_at: entry.createdAt.toISOString(),
      last_modified: entry.lastModified.toISOString()
    });

    return entry;
  }

  async findById(id: string): Promise<Sport.GameEntry | null> {
    const result = await this.adapter.getById<any>('game_entries', id);
    return result ? this.toDomain(result) : null;
  }

  async findAll(): Promise<Sport.GameEntry[]> {
    const results = await this.adapter.getAll<any>('game_entries');
    return results.map((r) => this.toDomain(r));
  }

  async findByCategory(category: Sport.GameCategory): Promise<Sport.GameEntry[]> {
    const results = await this.adapter.getAll<any>('game_entries', { category });
    return results.map((r) => this.toDomain(r));
  }

  async update(
    id: string,
    updates: Partial<Omit<CreateGameEntryInput, 'isCustom'>>
  ): Promise<Sport.GameEntry> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`GameEntry ${id} not found`);
    }

    const updated: Sport.GameEntry = {
      ...existing,
      ...updates,
      ageGroup: updates.ageGroup ?? existing.ageGroup,
      lastModified: new Date()
    };

    await this.adapter.update('game_entries', id, {
      name: updated.name,
      category: updated.category,
      phase: updated.phase,
      difficulty: updated.difficulty,
      duration: updated.duration,
      age_group: updated.ageGroup,
      material: updated.material ?? null,
      goal: updated.goal,
      description: updated.description,
      variation: updated.variation ?? null,
      notes: updated.notes ?? null,
      sport_type: updated.sportType ?? null,
      last_modified: updated.lastModified.toISOString()
    });

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.adapter.delete('game_entries', id);
  }

  async count(): Promise<number> {
    const all = await this.findAll();
    return all.length;
  }
}
