/**
 * SportStatisticsService Tests
 * Unit tests for attendance, performance, and tool usage aggregation helpers.
 */

import { SportStatisticsService } from '../src/services/sport-statistics.service';
import { AttendanceStatus } from '@viccoboard/core';
import type { AttendanceRecord, Sport } from '@viccoboard/core';

describe('SportStatisticsService', () => {
  const service = new SportStatisticsService();

  // ─── Helper builders ──────────────────────────────────────────────────────

  function makeAttendance(
    overrides: Partial<AttendanceRecord> & { lessonId: string; status: AttendanceStatus }
  ): AttendanceRecord {
    const now = new Date('2026-01-01T08:00:00.000Z');
    return {
      id: `a-${Math.random()}`,
      studentId: 's1',
      exported: false,
      timestamp: now,
      createdAt: now,
      lastModified: now,
      ...overrides
    } as AttendanceRecord;
  }

  function makeEntry(
    overrides: Partial<Sport.PerformanceEntry> & { categoryId: string }
  ): Sport.PerformanceEntry {
    const now = new Date('2026-01-01T08:00:00.000Z');
    return {
      id: `e-${Math.random()}`,
      studentId: 's1',
      measurements: {},
      timestamp: now,
      createdAt: now,
      lastModified: now,
      ...overrides
    } as Sport.PerformanceEntry;
  }

  function makeCategory(id: string, name: string): Sport.GradeCategory {
    const now = new Date('2026-01-01T08:00:00.000Z');
    return {
      id,
      classGroupId: 'cg1',
      name,
      type: 'criteria' as any,
      weight: 100,
      configuration: {},
      createdAt: now,
      lastModified: now
    } as unknown as Sport.GradeCategory;
  }

  function makeToolSession(
    toolType: string,
    endedAt?: Date
  ): Sport.ToolSession {
    const now = new Date('2026-01-01T08:00:00.000Z');
    return {
      id: `ts-${Math.random()}`,
      toolType,
      sessionMetadata: {},
      startedAt: now,
      endedAt,
      createdAt: now,
      lastModified: now
    } as Sport.ToolSession;
  }

  // ─── aggregateAttendanceOverview ──────────────────────────────────────────

  describe('aggregateAttendanceOverview', () => {
    test('returns all-100 overview for empty input', () => {
      const result = service.aggregateAttendanceOverview([]);
      expect(result.global.total).toBe(0);
      expect(result.global.attendanceRate).toBe(100);
      expect(result.perLesson).toEqual({});
    });

    test('counts status types correctly', () => {
      const records: AttendanceRecord[] = [
        makeAttendance({ lessonId: 'l1', status: AttendanceStatus.Present }),
        makeAttendance({ lessonId: 'l1', status: AttendanceStatus.Present }),
        makeAttendance({ lessonId: 'l1', status: AttendanceStatus.Absent }),
        makeAttendance({ lessonId: 'l2', status: AttendanceStatus.Excused }),
        makeAttendance({ lessonId: 'l2', status: AttendanceStatus.Passive })
      ];

      const result = service.aggregateAttendanceOverview(records);

      expect(result.global.total).toBe(5);
      expect(result.global.present).toBe(2);
      expect(result.global.absent).toBe(1);
      expect(result.global.excused).toBe(1);
      expect(result.global.passive).toBe(1);
      expect(result.global.attendanceRate).toBe(40);
    });

    test('groups records by lesson', () => {
      const records: AttendanceRecord[] = [
        makeAttendance({ lessonId: 'l1', status: AttendanceStatus.Present }),
        makeAttendance({ lessonId: 'l2', status: AttendanceStatus.Absent }),
        makeAttendance({ lessonId: 'l2', status: AttendanceStatus.Present })
      ];

      const result = service.aggregateAttendanceOverview(records);

      expect(result.perLesson['l1'].total).toBe(1);
      expect(result.perLesson['l2'].total).toBe(2);
      expect(result.perLesson['l2'].present).toBe(1);
    });

    test('calculates attendance rate rounded to one decimal', () => {
      const records = [
        makeAttendance({ lessonId: 'l1', status: AttendanceStatus.Present }),
        makeAttendance({ lessonId: 'l1', status: AttendanceStatus.Present }),
        makeAttendance({ lessonId: 'l1', status: AttendanceStatus.Absent })
      ];

      const result = service.aggregateAttendanceOverview(records);
      // 2/3 * 100 = 66.666… → 66.7
      expect(result.global.attendanceRate).toBe(66.7);
    });
  });

  // ─── aggregatePerformanceOverview ─────────────────────────────────────────

  describe('aggregatePerformanceOverview', () => {
    test('returns empty overview for no entries', () => {
      const result = service.aggregatePerformanceOverview([], [makeCategory('c1', 'Sprint')]);
      expect(result.totalEntries).toBe(0);
      expect(result.gradedEntries).toBe(0);
      expect(result.categories[0].gradedCount).toBe(0);
      expect(result.categories[0].averageGrade).toBeNull();
    });

    test('counts total and graded entries', () => {
      const cat = makeCategory('c1', 'Sprint');
      const entries = [
        makeEntry({ categoryId: 'c1', calculatedGrade: 2 }),
        makeEntry({ categoryId: 'c1', calculatedGrade: undefined }),
        makeEntry({ categoryId: 'c1', calculatedGrade: 3 })
      ];

      const result = service.aggregatePerformanceOverview(entries, [cat]);
      expect(result.totalEntries).toBe(3);
      expect(result.gradedEntries).toBe(2);
    });

    test('calculates average grade per category', () => {
      const cat = makeCategory('c1', 'Sprint');
      const entries = [
        makeEntry({ categoryId: 'c1', calculatedGrade: 2 }),
        makeEntry({ categoryId: 'c1', calculatedGrade: 3 })
      ];

      const result = service.aggregatePerformanceOverview(entries, [cat]);
      expect(result.categories[0].averageGrade).toBe(2.5);
    });

    test('handles categories with no matching entries', () => {
      const categories = [makeCategory('c1', 'A'), makeCategory('c2', 'B')];
      const entries = [makeEntry({ categoryId: 'c1', calculatedGrade: 1 })];

      const result = service.aggregatePerformanceOverview(entries, categories);
      const c2 = result.categories.find((c) => c.categoryId === 'c2')!;
      expect(c2.gradedCount).toBe(0);
      expect(c2.averageGrade).toBeNull();
    });

    test('includes categories from entries not in category list', () => {
      const entries = [makeEntry({ categoryId: 'unknown-cat', calculatedGrade: 4 })];
      const result = service.aggregatePerformanceOverview(entries, []);
      expect(result.categories.some((c) => c.categoryId === 'unknown-cat')).toBe(true);
    });
  });

  // ─── aggregateToolUsageOverview ───────────────────────────────────────────

  describe('aggregateToolUsageOverview', () => {
    test('returns empty overview for no sessions', () => {
      const result = service.aggregateToolUsageOverview([]);
      expect(result.totalSessions).toBe(0);
      expect(result.byToolType).toHaveLength(0);
    });

    test('counts sessions per tool type', () => {
      const sessions = [
        makeToolSession('timer'),
        makeToolSession('timer'),
        makeToolSession('scoreboard')
      ];

      const result = service.aggregateToolUsageOverview(sessions);
      expect(result.totalSessions).toBe(3);
      const timer = result.byToolType.find((t) => t.toolType === 'timer')!;
      expect(timer.sessionCount).toBe(2);
    });

    test('sorts tool types descending by session count', () => {
      const sessions = [
        makeToolSession('feedback'),
        makeToolSession('timer'),
        makeToolSession('timer'),
        makeToolSession('timer')
      ];

      const result = service.aggregateToolUsageOverview(sessions);
      expect(result.byToolType[0].toolType).toBe('timer');
    });

    test('tracks lastUsedAt from the most recent endedAt', () => {
      const earlier = new Date('2026-01-01T09:00:00.000Z');
      const later = new Date('2026-01-02T10:00:00.000Z');
      const sessions = [
        makeToolSession('timer', earlier),
        makeToolSession('timer', later)
      ];

      const result = service.aggregateToolUsageOverview(sessions);
      const timer = result.byToolType.find((t) => t.toolType === 'timer')!;
      expect(timer.lastUsedAt).toEqual(later);
    });

    test('lastUsedAt is undefined when no session has endedAt', () => {
      const sessions = [makeToolSession('timer')];
      const result = service.aggregateToolUsageOverview(sessions);
      expect(result.byToolType[0].lastUsedAt).toBeUndefined();
    });
  });
});
