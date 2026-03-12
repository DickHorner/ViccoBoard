/**
 * Sport Statistics Service
 * Provides aggregation helpers for attendance, performance, and tool usage signals.
 * Pure domain service – no storage access, no side effects.
 */

import type { AttendanceRecord, Sport } from '@viccoboard/core';

// ─── Attendance ────────────────────────────────────────────────────────────────

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  excused: number;
  passive: number;
  /** 0–100, rounded to one decimal */
  attendanceRate: number;
}

export interface AttendanceOverview {
  global: AttendanceStats;
  /** Per lesson – keyed by lessonId */
  perLesson: Record<string, AttendanceStats>;
}

function emptyStats(): AttendanceStats {
  return { total: 0, present: 0, absent: 0, excused: 0, passive: 0, attendanceRate: 100 };
}

function buildStats(records: AttendanceRecord[]): AttendanceStats {
  const stats = emptyStats();
  stats.total = records.length;
  for (const r of records) {
    if (r.status === 'present') stats.present++;
    else if (r.status === 'absent') stats.absent++;
    else if (r.status === 'excused') stats.excused++;
    else if (r.status === 'passive') stats.passive++;
  }
  stats.attendanceRate =
    stats.total > 0
      ? Math.round((stats.present / stats.total) * 1000) / 10
      : 100;
  return stats;
}

// ─── Performance ───────────────────────────────────────────────────────────────

export interface CategoryPerformanceSummary {
  categoryId: string;
  categoryName: string;
  gradedCount: number;
  /** null when no entries with a grade exist */
  averageGrade: number | null;
}

export interface PerformanceOverview {
  totalEntries: number;
  gradedEntries: number;
  categories: CategoryPerformanceSummary[];
}

// ─── Tool Usage ────────────────────────────────────────────────────────────────

export interface ToolUsageSummary {
  toolType: string;
  sessionCount: number;
  /** undefined when no session has an endedAt */
  lastUsedAt: Date | undefined;
}

export interface ToolUsageOverview {
  totalSessions: number;
  byToolType: ToolUsageSummary[];
}

function calculateAverageGrade(entries: Sport.PerformanceEntry[]): number | null {
  const graded = entries.filter(
    (e) => e.calculatedGrade !== undefined && e.calculatedGrade !== null
  );
  if (graded.length === 0) return null;
  return (
    Math.round(
      (graded.reduce((sum, e) => sum + Number(e.calculatedGrade), 0) / graded.length) * 10
    ) / 10
  );
}

// ─── Service ───────────────────────────────────────────────────────────────────

export class SportStatisticsService {
  /**
   * Aggregate attendance records into a global + per-lesson overview.
   */
  aggregateAttendanceOverview(records: AttendanceRecord[]): AttendanceOverview {
    const perLesson: Record<string, AttendanceRecord[]> = {};
    for (const r of records) {
      if (!perLesson[r.lessonId]) perLesson[r.lessonId] = [];
      perLesson[r.lessonId].push(r);
    }

    const perLessonStats: Record<string, AttendanceStats> = {};
    for (const [lessonId, lessonRecords] of Object.entries(perLesson)) {
      perLessonStats[lessonId] = buildStats(lessonRecords);
    }

    return {
      global: buildStats(records),
      perLesson: perLessonStats
    };
  }

  /**
   * Aggregate performance entries and grade categories into a performance overview.
   * @param entries  All PerformanceEntry records in scope
   * @param categories  Grade categories to label the summary rows
   */
  aggregatePerformanceOverview(
    entries: Sport.PerformanceEntry[],
    categories: Sport.GradeCategory[]
  ): PerformanceOverview {
    const categoryMap = new Map<string, Sport.GradeCategory>(
      categories.map((c) => [c.id, c])
    );

    // Group entries by category
    const byCat = new Map<string, Sport.PerformanceEntry[]>();
    for (const e of entries) {
      if (!byCat.has(e.categoryId)) byCat.set(e.categoryId, []);
      byCat.get(e.categoryId)!.push(e);
    }

    const categorySummaries: CategoryPerformanceSummary[] = categories.map((cat) => {
      const catEntries = byCat.get(cat.id) ?? [];
      const graded = catEntries.filter(
        (e) => e.calculatedGrade !== undefined && e.calculatedGrade !== null
      );
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        gradedCount: graded.length,
        averageGrade: calculateAverageGrade(catEntries)
      };
    });

    // Also include categories referenced in entries but not in the provided list
    for (const [catId, catEntries] of byCat.entries()) {
      if (!categoryMap.has(catId)) {
        const graded = catEntries.filter(
          (e) => e.calculatedGrade !== undefined && e.calculatedGrade !== null
        );
        categorySummaries.push({
          categoryId: catId,
          categoryName: catId,
          gradedCount: graded.length,
          averageGrade: calculateAverageGrade(catEntries)
        });
      }
    }

    const gradedEntries = entries.filter(
      (e) => e.calculatedGrade !== undefined && e.calculatedGrade !== null
    ).length;

    return {
      totalEntries: entries.length,
      gradedEntries,
      categories: categorySummaries
    };
  }

  /**
   * Aggregate tool sessions into a usage overview grouped by tool type.
   */
  aggregateToolUsageOverview(sessions: Sport.ToolSession[]): ToolUsageOverview {
    const byType = new Map<string, Sport.ToolSession[]>();
    for (const s of sessions) {
      if (!byType.has(s.toolType)) byType.set(s.toolType, []);
      byType.get(s.toolType)!.push(s);
    }

    const byToolType: ToolUsageSummary[] = [];
    for (const [toolType, typeSessions] of byType.entries()) {
      const withEnd = typeSessions
        .filter((s) => s.endedAt !== undefined)
        .sort((a, b) => (b.endedAt!.getTime() - a.endedAt!.getTime()));
      byToolType.push({
        toolType,
        sessionCount: typeSessions.length,
        lastUsedAt: withEnd.length > 0 ? withEnd[0].endedAt : undefined
      });
    }

    // Sort descending by session count
    byToolType.sort((a, b) => b.sessionCount - a.sessionCount);

    return {
      totalSessions: sessions.length,
      byToolType
    };
  }
}
