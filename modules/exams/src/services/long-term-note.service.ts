/**
 * Long-Term Note Management Service
 * Manages student development tracking over time
 */

import type { StudentLongTermNote, DevelopmentNote, CompetencyArea } from '../repositories/student-long-term-note.repository';

export interface CompetencyProgress {
  competencyId: string;
  competencyName: string;
  assessments: Array<{
    date: Date;
    score: number;
    examId?: string;
  }>;
  trend: 'improving' | 'stable' | 'declining' | 'new';
  averageScore: number;
  latestScore: number;
  previousScore?: number;
  trendPercentage: number; // Improvement/decline as percentage
}

export interface StudentGrowthAnalysis {
  studentId: string;
  totalNotes: number;
  competenciesTracked: number;
  improvingCount: number;
  stableCount: number;
  decliningCount: number;
  averageTrend: number; // Positive = improving, negative = declining
  strengths: string[];
  focusAreas: string[];
  recentAchievements: Array<{
    achievement: string;
    date: Date;
  }>;
  recentChallenges: Array<{
    challenge: string;
    date: Date;
  }>;
}

export class LongTermNoteManagementService {
  /**
   * Create a new long-term note for a student
   */
  static createLongTermNote(
    studentId: string,
    classGroupId: string,
    schoolYear: string,
    options?: {
      competencyAreas?: CompetencyArea[];
      strengths?: string[];
      focusAreas?: string[];
      internalNotes?: string;
    }
  ): StudentLongTermNote {
    return {
      id: `note-${studentId}-${schoolYear}-${Date.now()}`,
      studentId,
      classGroupId,
      schoolYear,
      competencyAreas: options?.competencyAreas ?? [],
      developmentNotes: [],
      internalNotes: options?.internalNotes ?? '',
      strengths: options?.strengths ?? [],
      focusAreas: options?.focusAreas ?? [],
      createdAt: new Date(),
      lastModified: new Date()
    };
  }

  /**
   * Add a competency area to track
   */
  static addCompetency(
    note: StudentLongTermNote,
    name: string,
    description: string
  ): StudentLongTermNote {
    const competency: CompetencyArea = {
      id: `competency-${Date.now()}`,
      name,
      description,
      assessmentCount: 0,
      trend: 'new'
    };

    return {
      ...note,
      competencyAreas: [...note.competencyAreas, competency],
      lastModified: new Date()
    };
  }

  /**
   * Record a competency assessment
   */
  static recordCompetencyAssessment(
    note: StudentLongTermNote,
    competencyId: string,
    score: number,
    examId?: string
  ): StudentLongTermNote {
    const updatedAreas = note.competencyAreas.map((comp: CompetencyArea) => {
      if (comp.id === competencyId) {
        return {
          ...comp,
          assessmentCount: comp.assessmentCount + 1,
          lastAssessmentDate: new Date()
        };
      }
      return comp;
    });

    return {
      ...note,
      competencyAreas: updatedAreas,
      lastModified: new Date()
    };
  }

  /**
   * Add a development note
   */
  static addDevelopmentNote(
    note: StudentLongTermNote,
    content: string,
    category: 'achievement' | 'challenge' | 'support' | 'observation',
    examId?: string
  ): StudentLongTermNote {
    const devNote: DevelopmentNote = {
      id: `note-${Date.now()}`,
      date: new Date(),
      content,
      category,
      relatedExamId: examId
    };

    return {
      ...note,
      developmentNotes: [...note.developmentNotes, devNote],
      lastModified: new Date()
    };
  }

  /**
   * Update a development note
   */
  static updateDevelopmentNote(
    note: StudentLongTermNote,
    noteId: string,
    newContent: string,
    newCategory?: 'achievement' | 'challenge' | 'support' | 'observation'
  ): StudentLongTermNote {
    const updated = note.developmentNotes.map((devNote: DevelopmentNote) => {
      if (devNote.id === noteId) {
        return {
          ...devNote,
          content: newContent,
          category: newCategory ?? devNote.category
        };
      }
      return devNote;
    });

    return {
      ...note,
      developmentNotes: updated,
      lastModified: new Date()
    };
  }

  /**
   * Delete a development note
   */
  static removeDevelopmentNote(
    note: StudentLongTermNote,
    noteId: string
  ): StudentLongTermNote {
    return {
      ...note,
      developmentNotes: note.developmentNotes.filter((devNote: DevelopmentNote) => devNote.id !== noteId),
      lastModified: new Date()
    };
  }

  /**
   * Get development notes by category
   */
  static getNotesByCategory(
    note: StudentLongTermNote,
    category: 'achievement' | 'challenge' | 'support' | 'observation'
  ): DevelopmentNote[] {
    return note.developmentNotes.filter((n: DevelopmentNote) => n.category === category);
  }

  /**
   * Get recent development notes
   */
  static getRecentNotes(
    note: StudentLongTermNote,
    dayCount: number = 30
  ): DevelopmentNote[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dayCount);

    return note.developmentNotes
      .filter((n: DevelopmentNote) => n.date >= cutoffDate)
      .sort((a: DevelopmentNote, b: DevelopmentNote) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Update strengths list
   */
  static updateStrengths(
    note: StudentLongTermNote,
    strengths: string[]
  ): StudentLongTermNote {
    return {
      ...note,
      strengths,
      lastModified: new Date()
    };
  }

  /**
   * Add a strength
   */
  static addStrength(
    note: StudentLongTermNote,
    strength: string
  ): StudentLongTermNote {
    if (!note.strengths.includes(strength)) {
      return {
        ...note,
        strengths: [...note.strengths, strength],
        lastModified: new Date()
      };
    }
    return note;
  }

  /**
   * Update focus areas
   */
  static updateFocusAreas(
    note: StudentLongTermNote,
    areas: string[]
  ): StudentLongTermNote {
    return {
      ...note,
      focusAreas: areas,
      lastModified: new Date()
    };
  }

  /**
   * Add a focus area
   */
  static addFocusArea(
    note: StudentLongTermNote,
    area: string
  ): StudentLongTermNote {
    if (!note.focusAreas.includes(area)) {
      return {
        ...note,
        focusAreas: [...note.focusAreas, area],
        lastModified: new Date()
      };
    }
    return note;
  }

  /**
   * Calculate competency progress
   */
  static calculateCompetencyProgress(
    competency: CompetencyArea,
    assessments: Array<{ date: Date; score: number; examId?: string }>
  ): CompetencyProgress {
    if (assessments.length === 0) {
      return {
        competencyId: competency.id,
        competencyName: competency.name,
        assessments: [],
        trend: competency.trend,
        averageScore: 0,
        latestScore: 0,
        trendPercentage: 0
      };
    }

    // Sort by date
    const sortedAssessments = [...assessments].sort((a, b) => a.date.getTime() - b.date.getTime());

    const scores = sortedAssessments.map((a) => a.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const latestScore = scores[scores.length - 1];
    const previousScore = scores.length > 1 ? scores[scores.length - 2] : undefined;

    // Calculate trend percentage
    let trendPercentage = 0;
    if (previousScore !== undefined) {
      trendPercentage = ((latestScore - previousScore) / previousScore) * 100;
    }

    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' | 'new' = competency.trend;
    if (scores.length > 1) {
      if (trendPercentage > 5) {
        trend = 'improving';
      } else if (trendPercentage < -5) {
        trend = 'declining';
      } else {
        trend = 'stable';
      }
    }

    return {
      competencyId: competency.id,
      competencyName: competency.name,
      assessments: sortedAssessments,
      trend,
      averageScore,
      latestScore,
      previousScore,
      trendPercentage
    };
  }

  /**
   * Analyze overall student growth
   */
  static analyzeStudentGrowth(
    notes: StudentLongTermNote[],
    allAssessments: Map<string, Array<{ date: Date; score: number; examId?: string }>>
  ): StudentGrowthAnalysis {
    if (notes.length === 0) {
      return {
        studentId: '',
        totalNotes: 0,
        competenciesTracked: 0,
        improvingCount: 0,
        stableCount: 0,
        decliningCount: 0,
        averageTrend: 0,
        strengths: [],
        focusAreas: [],
        recentAchievements: [],
        recentChallenges: []
      };
    }

    // Aggregate data from all notes
    const studentId = notes[0].studentId;
    let totalCompetencies = 0;
    let improvingCount = 0;
    let stableCount = 0;
    let decliningCount = 0;
    let totalTrendPercentage = 0;

    const allStrengths = new Set<string>();
    const allFocusAreas = new Set<string>();
    const achievements: Array<{ achievement: string; date: Date }> = [];
    const challenges: Array<{ challenge: string; date: Date }> = [];

    for (const note of notes) {
      note.strengths.forEach((s: string) => allStrengths.add(s));
      note.focusAreas.forEach((a: string) => allFocusAreas.add(a));

      note.competencyAreas.forEach((comp: CompetencyArea) => {
        totalCompetencies++;
        const assessments = allAssessments.get(comp.id) || [];
        const progress = this.calculateCompetencyProgress(comp, assessments);

        if (progress.trend === 'improving') improvingCount++;
        else if (progress.trend === 'stable') stableCount++;
        else if (progress.trend === 'declining') decliningCount++;

        totalTrendPercentage += progress.trendPercentage;
      });

      // Collect recent notes
      note.developmentNotes
        .filter((n: DevelopmentNote) => n.category === 'achievement')
        .forEach((n: DevelopmentNote) => achievements.push({ achievement: n.content, date: n.date }));

      note.developmentNotes
        .filter((n: DevelopmentNote) => n.category === 'challenge')
        .forEach((n: DevelopmentNote) => challenges.push({ challenge: n.content, date: n.date }));
    }

    const averageTrend = totalCompetencies > 0 ? totalTrendPercentage / totalCompetencies : 0;

    return {
      studentId,
      totalNotes: notes.length,
      competenciesTracked: totalCompetencies,
      improvingCount,
      stableCount,
      decliningCount,
      averageTrend,
      strengths: Array.from(allStrengths),
      focusAreas: Array.from(allFocusAreas),
      recentAchievements: achievements.slice(0, 5),
      recentChallenges: challenges.slice(0, 5)
    };
  }

  /**
   * Compare competency progress across students
   */
  static compareCompetencyAcrossStudents(
    notes: Map<string, StudentLongTermNote>,
    competencyName: string
  ): Array<{ studentId: string; studentName: string; averageScore: number; trend: string }> {
    const results: Array<{ studentId: string; studentName: string; averageScore: number; trend: string }> = [];

    for (const [studentId, note] of notes) {
      const competency = note.competencyAreas.find((c: CompetencyArea) => c.name === competencyName);
      if (competency) {
        results.push({
          studentId,
          studentName: studentId, // Would resolve to actual name via students module
          averageScore: 0, // Would calculate from assessments
          trend: competency.trend
        });
      }
    }

    return results;
  }

  /**
   * Identify students needing intervention
   */
  static identifyStudentsNeedingSupport(
    notes: StudentLongTermNote[],
    criteriaOptions?: {
      minFocusAreas?: number;
      maxImprovingCompetencies?: number;
      hasChallenges?: boolean;
    }
  ): StudentLongTermNote[] {
    return notes.filter((note) => {
      const criteria = criteriaOptions || { minFocusAreas: 2, maxImprovingCompetencies: 2, hasChallenges: true };

      let needsSupport = false;

      if (criteria.minFocusAreas && note.focusAreas.length >= criteria.minFocusAreas) {
        needsSupport = true;
      }

      if (criteria.hasChallenges && note.developmentNotes.some((n: DevelopmentNote) => n.category === 'challenge')) {
        needsSupport = true;
      }

      return needsSupport;
    });
  }

  /**
   * Generate a text summary of student progress
   */
  static generateProgressSummary(
    note: StudentLongTermNote,
    growth: StudentGrowthAnalysis
  ): string {
    const lines: string[] = [];

    lines.push(`Long-Term Development Summary`);
    lines.push(`School Year: ${note.schoolYear}`);
    lines.push(`Total Assessments: ${growth.totalNotes}`);
    lines.push(`Competencies Tracked: ${growth.competenciesTracked}`);
    lines.push('');

    lines.push(`Progress Overview:`);
    lines.push(`  • Improving: ${growth.improvingCount}`);
    lines.push(`  • Stable: ${growth.stableCount}`);
    lines.push(`  • Declining: ${growth.decliningCount}`);
    lines.push(`  • Average Trend: ${growth.averageTrend > 0 ? '+' : ''}${growth.averageTrend.toFixed(1)}%`);
    lines.push('');

    if (note.strengths.length > 0) {
      lines.push(`Strengths:`);
      note.strengths.forEach((s: string) => lines.push(`  • ${s}`));
      lines.push('');
    }

    if (note.focusAreas.length > 0) {
      lines.push(`Areas for Development:`);
      note.focusAreas.forEach((a: string) => lines.push(`  • ${a}`));
      lines.push('');
    }

    if (growth.recentAchievements.length > 0) {
      lines.push(`Recent Achievements:`);
      growth.recentAchievements.forEach((a) => lines.push(`  • ${a.achievement} (${a.date.toLocaleDateString()})`));
      lines.push('');
    }

    if (note.internalNotes) {
      lines.push(`Notes:`);
      lines.push(note.internalNotes);
    }

    return lines.join('\n');
  }
}

/**
 * Helper class for UI rendering
 */
export class LongTermNoteUIHelper {
  /**
   * Format trend as icon and text
   */
  static formatTrend(trend: 'improving' | 'stable' | 'declining' | 'new'): { icon: string; text: string; color: string } {
    switch (trend) {
      case 'improving':
        return { icon: '📈', text: 'Improving', color: '#28a745' };
      case 'stable':
        return { icon: '➡️', text: 'Stable', color: '#ffc107' };
      case 'declining':
        return { icon: '📉', text: 'Declining', color: '#dc3545' };
      case 'new':
        return { icon: '🆕', text: 'New', color: '#17a2b8' };
      default:
        return { icon: '❓', text: 'Unknown', color: '#999' };
    }
  }

  /**
   * Get color for trend percentage
   */
  static getTrendColor(percentage: number): string {
    if (percentage > 10) return '#28a745'; // Green
    if (percentage > 0) return '#90ee90'; // Light green
    if (percentage > -10) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  }

  /**
   * Format note category as display text
   */
  static formatCategory(category: 'achievement' | 'challenge' | 'support' | 'observation'): { icon: string; label: string } {
    switch (category) {
      case 'achievement':
        return { icon: '⭐', label: 'Achievement' };
      case 'challenge':
        return { icon: '⚠️', label: 'Challenge' };
      case 'support':
        return { icon: '🤝', label: 'Support' };
      case 'observation':
        return { icon: '👀', label: 'Observation' };
      default:
        return { icon: '📝', label: 'Note' };
    }
  }

  /**
   * Get badge color for growth analysis
   */
  static getGrowthBadgeColor(value: number): string {
    if (value > 5) return '#28a745'; // Green (improving)
    if (value > -5) return '#ffc107'; // Yellow (stable)
    return '#dc3545'; // Red (declining)
  }
}
