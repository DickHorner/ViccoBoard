/**
 * Tactics Snapshot Repository
 * Manages persistence for tactics board snapshots
 */

import { Sport } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';
const uuidv4 = () => crypto.randomUUID();

export interface CreateTacticsSnapshotInput {
  lessonId?: string;
  sport?: string;
  title: string;
  markings: Sport.TacticsMarking[];
  background: Sport.TacticsBoardSnapshot['background'];
}

export interface UpdateTacticsSnapshotInput {
  title?: string;
  markings?: Sport.TacticsMarking[];
  background?: Sport.TacticsBoardSnapshot['background'];
}

export class TacticsSnapshotRepository {
  constructor(private adapter: StorageAdapter) {}

  private toDomain(dbRecord: any): Sport.TacticsBoardSnapshot {
    return {
      id: dbRecord.id,
      lessonId: dbRecord.lesson_id || undefined,
      sport: dbRecord.sport ?? '',
      title: dbRecord.title ?? '',
      version: dbRecord.version ?? 1,
      markings:
        typeof dbRecord.markings === 'string'
          ? JSON.parse(dbRecord.markings)
          : dbRecord.markings,
      background: dbRecord.background as Sport.TacticsBoardSnapshot['background'],
      createdAt: new Date(dbRecord.created_at),
      lastModified: new Date(dbRecord.last_modified)
    };
  }

  async create(input: CreateTacticsSnapshotInput): Promise<Sport.TacticsBoardSnapshot> {
    const now = new Date();
    const snapshot: Sport.TacticsBoardSnapshot = {
      id: uuidv4(),
      lessonId: input.lessonId,
      sport: input.sport ?? '',
      title: input.title,
      version: 1,
      markings: input.markings,
      background: input.background,
      createdAt: now,
      lastModified: now
    };

    const dbRecord = {
      id: snapshot.id,
      lesson_id: snapshot.lessonId ?? null,
      sport: snapshot.sport,
      title: snapshot.title,
      version: snapshot.version,
      markings: JSON.stringify(snapshot.markings),
      background: snapshot.background,
      created_at: snapshot.createdAt.toISOString(),
      last_modified: snapshot.lastModified.toISOString()
    };

    await this.adapter.insert('tactics_snapshots', dbRecord);
    return snapshot;
  }

  async findById(id: string): Promise<Sport.TacticsBoardSnapshot | null> {
    const result = await this.adapter.getById<any>('tactics_snapshots', id);
    return result ? this.toDomain(result) : null;
  }

  async findAll(): Promise<Sport.TacticsBoardSnapshot[]> {
    const results = await this.adapter.getAll<any>('tactics_snapshots');
    return results.map((r) => this.toDomain(r));
  }

  async findByLesson(lessonId: string): Promise<Sport.TacticsBoardSnapshot[]> {
    const results = await this.adapter.getAll<any>('tactics_snapshots', {
      lesson_id: lessonId
    });
    return results.map((r) => this.toDomain(r));
  }

  async update(
    id: string,
    input: UpdateTacticsSnapshotInput
  ): Promise<Sport.TacticsBoardSnapshot> {
    const snapshot = await this.findById(id);
    if (!snapshot) {
      throw new Error(`TacticsSnapshot ${id} not found`);
    }

    const updated: Sport.TacticsBoardSnapshot = {
      ...snapshot,
      title: input.title ?? snapshot.title,
      markings: input.markings ?? snapshot.markings,
      background: input.background ?? snapshot.background,
      version: snapshot.version + 1,
      lastModified: new Date()
    };

    const dbUpdates = {
      title: updated.title,
      markings: JSON.stringify(updated.markings),
      background: updated.background,
      version: updated.version,
      last_modified: updated.lastModified.toISOString()
    };

    await this.adapter.update('tactics_snapshots', id, dbUpdates);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.adapter.delete('tactics_snapshots', id);
  }
}
