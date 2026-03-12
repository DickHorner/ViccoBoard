/**
 * RecordFeedbackSessionUseCase Tests
 * Verifies feedback sessions are persisted correctly via tool_sessions table.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { RecordFeedbackSessionUseCase } from '../src/use-cases/record-feedback-session.use-case';
import { FeedbackSessionRepository } from '../src/repositories/feedback-session.repository';
import { ToolSessionRepository } from '../src/repositories/tool-session.repository';
import { SQLiteStorage } from '@viccoboard/storage/node';
import {
  InitialSchemaMigration,
  GradingSchemaMigration,
  ToolSessionsSchemaMigration
} from '@viccoboard/storage/node';
import type { StorageAdapter } from '@viccoboard/storage/node';
import type { Sport } from '@viccoboard/core';

describe('RecordFeedbackSessionUseCase', () => {
  let storage: SQLiteStorage;
  let toolSessionRepo: ToolSessionRepository;
  let feedbackRepo: FeedbackSessionRepository;
  let useCase: RecordFeedbackSessionUseCase;
  let adapter: StorageAdapter;

  const emojiMethod: Sport.FeedbackMethod = {
    id: 'emoji',
    name: 'Smiley-Abfrage',
    type: 'emoji'
  };

  const ratingMethod: Sport.FeedbackMethod = {
    id: 'rating',
    name: 'Bewertungsskala',
    type: 'rating'
  };

  const config: Sport.FeedbackConfig = {
    anonymous: true,
    questions: [
      { id: 'q1', text: 'Wie war die Stunde?', type: 'choice', required: true }
    ]
  };

  const createClassGroup = async (id: string) => {
    const now = new Date().toISOString();
    await adapter.insert('class_groups', {
      id,
      name: `Class ${id}`,
      school_year: '2024/25',
      color: null,
      archived: 0,
      state: null,
      holiday_calendar_ref: null,
      grading_scheme: null,
      subject_profile: null,
      created_at: now,
      last_modified: now
    });
  };

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new ToolSessionsSchemaMigration(storage));
    await storage.migrate();
    adapter = storage.getAdapter();
    toolSessionRepo = new ToolSessionRepository(adapter);
    feedbackRepo = new FeedbackSessionRepository(toolSessionRepo);
    useCase = new RecordFeedbackSessionUseCase(feedbackRepo);
  });

  it('persists an emoji feedback session with responses', async () => {
    await createClassGroup('class-1');
    const responses: Sport.FeedbackResponse[] = [
      { answers: { emoji: 'good' }, timestamp: new Date() },
      { answers: { emoji: 'neutral' }, timestamp: new Date() },
      { answers: { emoji: 'good' }, timestamp: new Date() }
    ];

    const session = await useCase.execute({
      classGroupId: 'class-1',
      method: emojiMethod,
      configuration: config,
      responses,
      completedAt: new Date()
    });

    expect(session.id).toBeTruthy();
    expect(session.method.type).toBe('emoji');
    expect(session.responses).toHaveLength(3);
    expect(session.classGroupId).toBe('class-1');
    expect(session.completedAt).toBeDefined();
  });

  it('persists a rating feedback session', async () => {
    await createClassGroup('class-2');
    const ratingConfig: Sport.FeedbackConfig = {
      anonymous: true,
      questions: [
        { id: 'q1', text: 'Bewertung', type: 'rating', required: true }
      ]
    };
    const responses: Sport.FeedbackResponse[] = [
      { answers: { rating: 4 }, timestamp: new Date() },
      { answers: { rating: 5 }, timestamp: new Date() }
    ];

    const session = await useCase.execute({
      classGroupId: 'class-2',
      method: ratingMethod,
      configuration: ratingConfig,
      responses
    });

    expect(session.method.type).toBe('rating');
    expect(session.responses).toHaveLength(2);
  });

  it('retrieves feedback sessions by class via repository', async () => {
    await createClassGroup('class-1');
    await createClassGroup('class-2');

    await useCase.execute({
      classGroupId: 'class-1',
      method: emojiMethod,
      configuration: config,
      responses: [{ answers: { emoji: 'good' }, timestamp: new Date() }]
    });
    await useCase.execute({
      classGroupId: 'class-2',
      method: emojiMethod,
      configuration: config,
      responses: []
    });

    const class1Sessions = await feedbackRepo.findByClass('class-1');
    expect(class1Sessions).toHaveLength(1);
    expect(class1Sessions[0].classGroupId).toBe('class-1');
  });

  it('retrieves all feedback sessions', async () => {
    await createClassGroup('class-1');

    await useCase.execute({
      classGroupId: 'class-1',
      method: emojiMethod,
      configuration: config,
      responses: []
    });
    await useCase.execute({
      classGroupId: 'class-1',
      method: ratingMethod,
      configuration: config,
      responses: []
    });

    const all = await feedbackRepo.findAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(all.every(s => s.method !== undefined)).toBe(true);
  });

  it('throws when classGroupId is missing', async () => {
    await expect(
      useCase.execute({
        classGroupId: '',
        method: emojiMethod,
        configuration: config,
        responses: []
      })
    ).rejects.toThrow('classGroupId is required');
  });

  it('throws when method type is missing', async () => {
    await expect(
      useCase.execute({
        classGroupId: 'class-1',
        method: { id: '', name: '', type: '' as any },
        configuration: config,
        responses: []
      })
    ).rejects.toThrow('method with type is required');
  });
});

