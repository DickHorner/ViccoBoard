/**
 * Exam Analysis & Difficulty Service
 * Analyzes exam results and provides difficulty metrics
 * Includes point adjustment assistant
 */

import { Exams } from '@viccoboard/core';

export interface DifficultyAnalysis {
  taskId: string;
  taskTitle: string;
  maxPoints: number;
  averageScore: number;
  medianScore: number;
  standardDeviation: number;
  difficultyIndex: number; // 0-1: 0=very difficult, 1=very easy
  criticalCount: number; // Number of students scoring < 50%
  excellentCount: number; // Number of students scoring > 80%
}

export interface ExamStatistics {
  totalCandidates: number;
  completedCount: number;
  averageScore: number;
  medianScore: number;
  standardDeviation: number;
  minScore: number;
  maxScore: number;
  gradeDistribution: Map<string | number, number>;
  taskDifficulties: DifficultyAnalysis[];
}

export interface PointAdjustmentSuggestion {
  currentDistribution: Record<string, number>;
  suggestedDistribution: Record<string, number>;
  adjustments: Array<{
    taskId: string;
    taskTitle: string;
    currentPoints: number;
    suggestedPoints: number;
    reason: string;
  }>;
  impactAnalysis: {
    affectedGrades: Array<{ candidateId: string; oldGrade: string | number; newGrade: string | number }>;
    gradeShift: number; // Average grade change
  };
}

export class ExamAnalysisService {
  /**
   * Analyze difficulty of a single task
   */
  static analyzeDifficulty(
    taskId: string,
    taskTitle: string,
    maxPoints: number,
    corrections: Exams.CorrectionEntry[]
  ): DifficultyAnalysis {
    const scores = corrections
      .map(c => c.taskScores.find(ts => ts.taskId === taskId)?.points || 0)
      .sort((a, b) => a - b);

    if (scores.length === 0) {
      return {
        taskId,
        taskTitle,
        maxPoints,
        averageScore: 0,
        medianScore: 0,
        standardDeviation: 0,
        difficultyIndex: 0,
        criticalCount: 0,
        excellentCount: 0
      };
    }

    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const median = this.calculateMedian(scores);
    const stdDev = this.calculateStandardDeviation(scores, average);
    const difficultyIndex = average / maxPoints; // 0=very difficult (low avg), 1=very easy (high avg)
    const criticalCount = scores.filter(s => s < (maxPoints * 0.5)).length;
    const excellentCount = scores.filter(s => s > (maxPoints * 0.8)).length;

    return {
      taskId,
      taskTitle,
      maxPoints,
      averageScore: average,
      medianScore: median,
      standardDeviation: stdDev,
      difficultyIndex,
      criticalCount,
      excellentCount
    };
  }

  /**
   * Analyze all tasks in an exam
   */
  static analyzeExamDifficulty(
    exam: Exams.Exam,
    corrections: Exams.CorrectionEntry[]
  ): ExamStatistics {
    const taskDifficulties = exam.structure.tasks.map(task =>
      this.analyzeDifficulty(task.id, task.title, task.points, corrections)
    );

    const totalScores = corrections.map(c => c.totalPoints).sort((a, b) => a - b);
    const totalAverage = totalScores.reduce((sum, s) => sum + s, 0) / totalScores.length;
    const totalMedian = this.calculateMedian(totalScores);
    const totalStdDev = this.calculateStandardDeviation(totalScores, totalAverage);

    // Grade distribution
    const gradeDistribution = new Map<string | number, number>();
    for (const correction of corrections) {
      const grade = correction.totalGrade;
      const count = gradeDistribution.get(grade) || 0;
      gradeDistribution.set(grade, count + 1);
    }

    return {
      totalCandidates: corrections.length,
      completedCount: corrections.filter(c => c.status === 'completed').length,
      averageScore: totalAverage,
      medianScore: totalMedian,
      standardDeviation: totalStdDev,
      minScore: totalScores[0] || 0,
      maxScore: totalScores[totalScores.length - 1] || 0,
      gradeDistribution,
      taskDifficulties
    };
  }

  /**
   * Identify unusually difficult or easy tasks
   */
  static identifyOutliers(
    analysis: ExamStatistics,
    threshold: number = 0.2
  ): {
    veryDifficult: DifficultyAnalysis[];
    veryEasy: DifficultyAnalysis[];
  } {
    const avgDifficulty = analysis.taskDifficulties.reduce((sum, t) => sum + t.difficultyIndex, 0) / analysis.taskDifficulties.length;

    return {
      veryDifficult: analysis.taskDifficulties.filter(
        t => avgDifficulty - t.difficultyIndex > threshold
      ),
      veryEasy: analysis.taskDifficulties.filter(
        t => t.difficultyIndex - avgDifficulty > threshold
      )
    };
  }

  /**
   * Generate point adjustment suggestions
   * Adjusts task points to balance difficulty while maintaining proportions
   */
  static suggestPointAdjustments(
    exam: Exams.Exam,
    corrections: Exams.CorrectionEntry[],
    targetDifficultyIndex: number = 0.6
  ): PointAdjustmentSuggestion {
    const analysis = this.analyzeExamDifficulty(exam, corrections);
    const currentDistribution: Record<string, number> = {};
    const suggestedDistribution: Record<string, number> = {};
    const adjustments: Array<{
      taskId: string;
      taskTitle: string;
      currentPoints: number;
      suggestedPoints: number;
      reason: string;
    }> = [];

    // Calculate suggested point adjustments
    const totalCurrentPoints = exam.structure.tasks.reduce((sum, t) => sum + t.points, 0);
    let totalSuggestedPoints = 0;

    for (const task of exam.structure.tasks) {
      const difficulty = analysis.taskDifficulties.find(t => t.taskId === task.id);
      if (!difficulty) continue;

      currentDistribution[task.id] = task.points;

      // Calculate desired points based on difficulty
      let suggestedPoints = task.points;
      if (difficulty.difficultyIndex < targetDifficultyIndex - 0.1) {
        // Task is too difficult, reduce points
        suggestedPoints = Math.round(task.points * 0.85);
      } else if (difficulty.difficultyIndex > targetDifficultyIndex + 0.1) {
        // Task is too easy, increase points
        suggestedPoints = Math.round(task.points * 1.15);
      }

      // Maintain proportions by normalizing
      const proportionAdjustment = totalCurrentPoints > 0 ? (task.points / totalCurrentPoints) : 0;
      suggestedPoints = Math.round(suggestedPoints * proportionAdjustment * totalCurrentPoints / suggestedPoints);

      suggestedDistribution[task.id] = suggestedPoints;
      totalSuggestedPoints += suggestedPoints;

      if (suggestedPoints !== task.points) {
        adjustments.push({
          taskId: task.id,
          taskTitle: task.title,
          currentPoints: task.points,
          suggestedPoints,
          reason:
            difficulty.difficultyIndex < 0.5
              ? 'Task is too difficult'
              : difficulty.difficultyIndex > 0.7
                ? 'Task is too easy'
                : 'Minor balancing adjustment'
        });
      }
    }

    // Normalize suggested points to maintain total
    const scaleFactor = totalCurrentPoints / Math.max(totalSuggestedPoints, 1);
    for (const taskId in suggestedDistribution) {
      suggestedDistribution[taskId] = Math.round(suggestedDistribution[taskId] * scaleFactor);
    }

    // Analyze impact
    const impactAnalysis = {
      affectedGrades: [] as Array<{ candidateId: string; oldGrade: string | number; newGrade: string | number }>,
      gradeShift: 0
    };

    // Calculate grade shift (simplified)
    const avgScoreBefore = analysis.averageScore;
    const projectedScoreAfter = (avgScoreBefore / totalCurrentPoints) * totalCurrentPoints;
    const gradeShift = projectedScoreAfter - avgScoreBefore;
    impactAnalysis.gradeShift = gradeShift;

    return {
      currentDistribution,
      suggestedDistribution,
      adjustments,
      impactAnalysis
    };
  }

  /**
   * Calculate median of sorted array
   */
  private static calculateMedian(sortedValues: number[]): number {
    if (sortedValues.length === 0) return 0;
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];
  }

  /**
   * Calculate standard deviation
   */
  private static calculateStandardDeviation(
    values: number[],
    mean: number
  ): number {
    if (values.length === 0) return 0;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, sq) => sum + sq, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Identify students needing intervention
   */
  static identifyStudentsAtRisk(
    corrections: Exams.CorrectionEntry[],
    riskThreshold: number = 50 // percentage score
  ): Array<{
    candidateId: string;
    score: number;
    percentage: number;
    riskLevel: 'critical' | 'warning' | 'ok';
  }> {
    return corrections
      .map(c => {
        const percentage = c.percentageScore || 0;
        let riskLevel: 'critical' | 'warning' | 'ok';
        if (percentage < riskThreshold * 0.7) {
          riskLevel = 'critical';
        } else if (percentage < riskThreshold) {
          riskLevel = 'warning';
        } else {
          riskLevel = 'ok';
        }

        return {
          candidateId: c.candidateId,
          score: c.totalPoints,
          percentage,
          riskLevel
        };
      })
      .filter(s => s.riskLevel !== 'ok')
      .sort((a, b) => a.percentage - b.percentage);
  }

  /**
   * Calculate performance variance by task
   */
  static calculateTaskVariance(
    corrections: Exams.CorrectionEntry[],
    exam: Exams.Exam
  ): Map<string, number> {
    const variance = new Map<string, number>();

    for (const task of exam.structure.tasks) {
      const scores = corrections
        .map(c => c.taskScores.find(ts => ts.taskId === task.id)?.points || 0)
        .filter(s => s > 0);

      if (scores.length === 0) {
        variance.set(task.id, 0);
        continue;
      }

      const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
      const avgSquaredDiff = squaredDiffs.reduce((sum, sq) => sum + sq, 0) / scores.length;
      variance.set(task.id, Math.sqrt(avgSquaredDiff));
    }

    return variance;
  }
}

/**
 * Helper class for analysis UI
 */
export class AnalysisUIHelper {
  /**
   * Format difficulty index as text
   */
  static formatDifficultyText(difficultyIndex: number): string {
    if (difficultyIndex < 0.3) return 'Very Difficult';
    if (difficultyIndex < 0.5) return 'Difficult';
    if (difficultyIndex < 0.7) return 'Moderate';
    if (difficultyIndex < 0.85) return 'Easy';
    return 'Very Easy';
  }

  /**
   * Get color for difficulty
   */
  static getDifficultyColor(difficultyIndex: number): string {
    if (difficultyIndex < 0.3) return '#dc3545'; // Red
    if (difficultyIndex < 0.5) return '#ff9800'; // Orange
    if (difficultyIndex < 0.7) return '#ffc107'; // Yellow
    if (difficultyIndex < 0.85) return '#90ee90'; // Light green
    return '#28a745'; // Green
  }

  /**
   * Format risk level with emoji
   */
  static formatRiskLevel(riskLevel: string): string {
    switch (riskLevel) {
      case 'critical':
        return '🚨 Critical';
      case 'warning':
        return '⚠️ Warning';
      case 'ok':
        return '✅ OK';
      default:
        return '❓ Unknown';
    }
  }
}
