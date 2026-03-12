/**
 * FeedbackSession Repository
 * Persists lesson feedback sessions via the existing tool_sessions table
 * (tool_type = 'feedback'), keeping the schema stable without a new migration.
 */

import { Sport } from '@viccoboard/core';
import type { ToolSessionRepository } from './tool-session.repository.js';

interface FeedbackSessionMetadata {
  classGroupId: string;
  lessonId?: string;
  method: Sport.FeedbackMethod;
  configuration: Sport.FeedbackConfig;
  responses: Sport.FeedbackResponse[];
}

export class FeedbackSessionRepository {
  constructor(private toolSessionRepository: ToolSessionRepository) {}

  private toDomain(raw: Sport.ToolSession): Sport.FeedbackSession {
    const meta = raw.sessionMetadata as FeedbackSessionMetadata;
    return {
      id: raw.id,
      classGroupId: meta.classGroupId ?? raw.classGroupId ?? '',
      lessonId: meta.lessonId ?? raw.lessonId,
      method: meta.method,
      configuration: meta.configuration,
      responses: meta.responses ?? [],
      createdAt: raw.createdAt,
      completedAt: raw.endedAt
    };
  }

  async create(session: Omit<Sport.FeedbackSession, 'id' | 'createdAt'>): Promise<Sport.FeedbackSession> {
    const toolSession = await this.toolSessionRepository.create({
      toolType: 'feedback',
      classGroupId: session.classGroupId,
      lessonId: session.lessonId,
      sessionMetadata: {
        classGroupId: session.classGroupId,
        lessonId: session.lessonId,
        method: session.method,
        configuration: session.configuration,
        responses: session.responses
      } satisfies FeedbackSessionMetadata,
      startedAt: new Date(),
      endedAt: session.completedAt
    });
    return this.toDomain(toolSession);
  }

  async update(id: string, updates: Partial<Pick<Sport.FeedbackSession, 'responses' | 'completedAt'>>): Promise<Sport.FeedbackSession> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`FeedbackSession ${id} not found`);

    const merged: Sport.FeedbackSession = {
      ...existing,
      responses: updates.responses ?? existing.responses,
      completedAt: updates.completedAt ?? existing.completedAt
    };

    const toolSession = await this.toolSessionRepository.update(id, {
      sessionMetadata: {
        classGroupId: merged.classGroupId,
        lessonId: merged.lessonId,
        method: merged.method,
        configuration: merged.configuration,
        responses: merged.responses
      } satisfies FeedbackSessionMetadata,
      endedAt: merged.completedAt
    });
    return this.toDomain(toolSession);
  }

  async findById(id: string): Promise<Sport.FeedbackSession | null> {
    const raw = await this.toolSessionRepository.findById(id);
    if (!raw || raw.toolType !== 'feedback') return null;
    return this.toDomain(raw);
  }

  async findByClass(classGroupId: string): Promise<Sport.FeedbackSession[]> {
    const sessions = await this.toolSessionRepository.findByClassGroup(classGroupId);
    return sessions
      .filter(s => s.toolType === 'feedback')
      .map(s => this.toDomain(s));
  }

  async findAll(): Promise<Sport.FeedbackSession[]> {
    const sessions = await this.toolSessionRepository.findByToolType('feedback');
    return sessions.map(s => this.toDomain(s));
  }

  async delete(id: string): Promise<void> {
    return this.toolSessionRepository.delete(id);
  }
}
