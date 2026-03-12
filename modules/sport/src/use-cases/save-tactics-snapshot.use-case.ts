/**
 * Save Tactics Snapshot Use Case
 * Persists (creates or updates) a tactics board snapshot
 */

import { Sport } from '@viccoboard/core';
import type { TacticsSnapshotRepository } from '../repositories/tactics-snapshot.repository.js';

export interface SaveTacticsSnapshotInput {
  /** Provide an existing id to update, omit to create a new snapshot */
  id?: string;
  lessonId?: string;
  sport?: string;
  title: string;
  markings: Sport.TacticsMarking[];
  background: Sport.TacticsBoardSnapshot['background'];
}

export class SaveTacticsSnapshotUseCase {
  constructor(private tacticsSnapshotRepository: TacticsSnapshotRepository) {}

  async execute(input: SaveTacticsSnapshotInput): Promise<Sport.TacticsBoardSnapshot> {
    if (!input.title || !input.title.trim()) {
      throw new Error('title is required');
    }
    if (!['court', 'field', 'pitch', 'custom'].includes(input.background)) {
      throw new Error('background must be one of: court, field, pitch, custom');
    }
    if (!Array.isArray(input.markings)) {
      throw new Error('markings must be an array');
    }

    if (input.id) {
      return this.tacticsSnapshotRepository.update(input.id, {
        title: input.title,
        markings: input.markings,
        background: input.background
      });
    }

    return this.tacticsSnapshotRepository.create({
      lessonId: input.lessonId,
      sport: input.sport,
      title: input.title,
      markings: input.markings,
      background: input.background
    });
  }
}
