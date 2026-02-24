/**
 * Tool Session Repository
 * Manages persistence for live tool usage sessions (Timer, Scoreboard, Tournaments, etc.)
 * Separate from student performance entries to maintain domain integrity
 */

import { Sport} from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';
import { v4 as uuidv4 } from 'uuid';

export interface CreateToolSessionInput {
  toolType: string;
  classGroupId?: string;
  lessonId?: string;
  sessionMetadata: Record<string, any>;
  startedAt?: Date;
  endedAt?: Date;
}

export interface UpdateToolSessionInput {
  sessionMetadata?: Record<string, any>;
  endedAt?: Date;
}

export class ToolSessionRepository {
  constructor(private adapter: StorageAdapter) {}

  /**
   * Convert database snake_case record to domain camelCase model
   */
  private toDomain(dbRecord: any): Sport.ToolSession {
    return {
      id: dbRecord.id,
      toolType: dbRecord.tool_type,
      classGroupId: dbRecord.class_group_id || undefined,
      lessonId: dbRecord.lesson_id || undefined,
      sessionMetadata: typeof dbRecord.session_metadata === 'string' 
        ? JSON.parse(dbRecord.session_metadata) 
        : dbRecord.session_metadata,
      startedAt: new Date(dbRecord.started_at),
      endedAt: dbRecord.ended_at ? new Date(dbRecord.ended_at) : undefined,
      createdAt: new Date(dbRecord.created_at),
      lastModified: new Date(dbRecord.last_modified)
    };
  }

  async create(input: CreateToolSessionInput): Promise<Sport.ToolSession> {
    const now = new Date();
    const session: Sport.ToolSession = {
      id: uuidv4(),
      toolType: input.toolType,
      classGroupId: input.classGroupId,
      lessonId: input.lessonId,
      sessionMetadata: input.sessionMetadata,
      startedAt: input.startedAt || now,
      endedAt: input.endedAt,
      createdAt: now,
      lastModified: now
    };

    // Convert to snake_case for database
    const dbRecord = {
      id: session.id,
      tool_type: session.toolType,
      class_group_id: session.classGroupId || null,
      lesson_id: session.lessonId || null,
      session_metadata: JSON.stringify(session.sessionMetadata),
      started_at: session.startedAt?.toISOString(),
      ended_at: session.endedAt?.toISOString() || null,
      created_at: session.createdAt.toISOString(),
      last_modified: session.lastModified.toISOString()
    };

    await this.adapter.insert('tool_sessions', dbRecord);
    return session;
  }

  async findById(id: string): Promise<Sport.ToolSession | null> {
    const result = await this.adapter.getById<any>('tool_sessions', id);
    return result ? this.toDomain(result) : null;
  }

  async findByToolType(toolType: string): Promise<Sport.ToolSession[]> {
    const results = await this.adapter.getAll<any>('tool_sessions', { tool_type: toolType });
    return results.map(r => this.toDomain(r));
  }

  async findByClassGroup(classGroupId: string): Promise<Sport.ToolSession[]> {
    const results = await this.adapter.getAll<any>('tool_sessions', { class_group_id: classGroupId });
    return results.map(r => this.toDomain(r));
  }

  async findAll(): Promise<Sport.ToolSession[]> {
    const results = await this.adapter.getAll<any>('tool_sessions');
    return results.map(r => this.toDomain(r));
  }

  async update(
    id: string,
    input: UpdateToolSessionInput
  ): Promise<Sport.ToolSession> {
    const session = await this.findById(id);
    if (!session) {
      throw new Error(`ToolSession ${id} not found`);
    }

    const updated: Sport.ToolSession = {
      ...session,
      sessionMetadata: input.sessionMetadata || session.sessionMetadata,
      endedAt: input.endedAt !== undefined ? input.endedAt : session.endedAt,
      lastModified: new Date()
    };

    // Convert to snake_case for database
    const dbUpdates = {
      session_metadata: JSON.stringify(updated.sessionMetadata),
      ended_at: updated.endedAt?.toISOString() || null,
      last_modified: updated.lastModified.toISOString()
    };

    await this.adapter.update('tool_sessions', id, dbUpdates);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.adapter.delete('tool_sessions', id);
  }

  async deleteByToolType(toolType: string): Promise<void> {
    const sessions = await this.findByToolType(toolType);
    await Promise.all(sessions.map((s) => this.delete(s.id)));
  }
}
