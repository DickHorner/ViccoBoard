/**
 * Long-Term Note Management Service
 * Manages student development tracking over time
 */

import type { StudentLongTermNote, DevelopmentNote, CompetencyArea } from '../repositories/student-long-term-note.repository';
import { LongTermNoteUIHelper } from './long-term-note.types';
import type { CompetencyProgress, StudentGrowthAnalysis } from './long-term-note.types';
import {
  calculateCompetencyProgress,
  compareCompetencyAcrossStudents,
  generateProgressSummary,
  identifyStudentsNeedingSupport
} from './long-term-note.analytics';

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
    return calculateCompetencyProgress(competency, assessments);
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
    return compareCompetencyAcrossStudents(notes, competencyName);
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
    return identifyStudentsNeedingSupport(notes, criteriaOptions);
  }

  /**
   * Generate a text summary of student progress
   */
  static generateProgressSummary(
    note: StudentLongTermNote,
    growth: StudentGrowthAnalysis
  ): string {
    return generateProgressSummary(note, growth);
  }
}

export { LongTermNoteUIHelper };
export type { CompetencyProgress, StudentGrowthAnalysis };
