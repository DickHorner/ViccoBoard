/**
 * Grading Key Service
 * Calculates grades based on grading keys, handles rounding and boundary determination
 */

import { Exams } from '@viccoboard/core';

export class GradingKeyService {
  /**
   * Calculate grade from points based on grading key
   */
  static calculateGrade(
    points: number,
    gradingKey: Exams.GradingKey
  ): { grade: string | number; percentage: number } {
    if (gradingKey.gradeBoundaries.length === 0) {
      return { grade: 'N/A', percentage: (points / gradingKey.totalPoints) * 100 };
    }

    const percentage = (points / gradingKey.totalPoints) * 100;

    // Find matching boundary
    const boundary = gradingKey.gradeBoundaries.find(b => {
      if (gradingKey.type === Exams.GradingKeyType.Percentage) {
        const minPct = b.minPercentage ?? 0;
        const maxPct = b.maxPercentage ?? 100;
        // Use inclusive upper bound when no explicit maxPercentage is set (open-ended top grade)
        return b.maxPercentage !== undefined
          ? percentage >= minPct && percentage < maxPct
          : percentage >= minPct && percentage <= maxPct;
      } else if (gradingKey.type === Exams.GradingKeyType.Points) {
        const minPts = b.minPoints ?? 0;
        const maxPts = b.maxPoints ?? gradingKey.totalPoints;
        // Use inclusive upper bound when no explicit maxPoints is set (open-ended top grade)
        return b.maxPoints !== undefined
          ? points >= minPts && points < maxPts
          : points >= minPts && points <= maxPts;
      }
      return false;
    });

    // Default to worst grade if below minimum
    if (!boundary) {
      const worst = gradingKey.gradeBoundaries[gradingKey.gradeBoundaries.length - 1];
      return { grade: worst.displayValue, percentage };
    }

    return { grade: boundary.displayValue, percentage };
  }

  /**
   * Apply rounding rule
   */
  static applyRounding(value: number, rule: Exams.RoundingRule): number {
    const factor = Math.pow(10, rule.decimalPlaces);

    switch (rule.type) {
      case 'up':
        return Math.ceil(value * factor) / factor;
      case 'down':
        return Math.floor(value * factor) / factor;
      case 'nearest':
        return Math.round(value * factor) / factor;
      case 'none':
      default:
        return value;
    }
  }

  /**
   * Calculate percentage from points
   */
  static calculatePercentage(points: number, maxPoints: number): number {
    if (maxPoints === 0) return 0;
    return Math.round((points / maxPoints) * 1000) / 10; // 1 decimal place
  }

  /**
   * Get boundaries for percentage-based grading
   */
  static generatePercentageBoundaries(
    preset: Exams.GradingPreset
  ): Exams.GradeBoundary[] {
    return preset.boundaries.map(b => ({
      ...b,
      minPercentage: b.minPercentage ?? 0,
      maxPercentage: b.maxPercentage ?? 100
    }));
  }

  /**
   * Get boundaries for points-based grading
   */
  static generatePointsBoundaries(
    preset: Exams.GradingPreset,
    totalPoints: number
  ): Exams.GradeBoundary[] {
    return preset.boundaries.map(b => {
      const minPct = b.minPercentage ?? 0;
      const maxPct = b.maxPercentage ?? 100;
      // For 100% upper bound, add 1 so a perfect score satisfies the exclusive `< maxPoints` check
      const maxPoints = maxPct >= 100
        ? totalPoints + 1
        : Math.ceil((maxPct / 100) * totalPoints);
      return {
        ...b,
        minPoints: Math.ceil((minPct / 100) * totalPoints),
        maxPoints
      };
    });
  }

  /**
   * Check if grading key is still applicable after correction
   */
  static isModifiedAfterCorrection(gradingKey: Exams.GradingKey): boolean {
    return gradingKey.modifiedAfterCorrection;
  }

  /**
   * Mark grading key as modified after correction
   */
  static markAsModifiedAfterCorrection(
    gradingKey: Exams.GradingKey
  ): Exams.GradingKey {
    return {
      ...gradingKey,
      modifiedAfterCorrection: true
    };
  }

  /**
   * Calculate points needed for next grade
   */
  static pointsToNextGrade(
    currentPoints: number,
    gradingKey: Exams.GradingKey
  ): number {
    const currentGrade = this.calculateGrade(currentPoints, gradingKey);
    const currentPercentage = currentGrade.percentage;

    // Find next grade threshold
    const nextBoundary = gradingKey.gradeBoundaries.find(b => {
      const minPct = b.minPercentage ?? 0;
      return minPct > currentPercentage;
    });

    if (!nextBoundary) {
      return 0; // Already at highest grade
    }

    const nextMinPercentage = nextBoundary.minPercentage ?? 0;
    const nextMinPoints = (nextMinPercentage / 100) * gradingKey.totalPoints;
    return Math.ceil(nextMinPoints - currentPoints);
  }
}

// German grading presets
export const GERMAN_1_6_PRESET: Exams.GradingPreset = {
  id: 'german-1-6-sekundarstufe-1',
  name: 'Sekundarstufe I (1-6)',
  description: 'Herkömmliches deutsches Notensystem für die Mittelstufe',
  system: 'german-1-6',
  boundaries: [
    { grade: 1, minPercentage: 96, displayValue: '1' },
    { grade: 2, minPercentage: 80, displayValue: '2' },
    { grade: 3, minPercentage: 60, displayValue: '3' },
    { grade: 4, minPercentage: 45, displayValue: '4' },
    { grade: 5, minPercentage: 16, displayValue: '5' },
    { grade: 6, minPercentage: 0, displayValue: '6' }
  ],
  defaultRounding: { type: 'nearest', decimalPlaces: 0 }
};

export const GERMAN_0_15_PRESET: Exams.GradingPreset = {
  id: 'german-0-15-gymnasiale-oberstufe',
  name: 'Gymnasiale Oberstufe (0-15 NP)',
  description: 'KMK-/Wikipedia-Schwellen für das Punktesystem der gymnasialen Oberstufe',
  system: 'german-0-15',
  boundaries: [
    { grade: 15, minPercentage: 95, displayValue: '15' },
    { grade: 14, minPercentage: 90, displayValue: '14' },
    { grade: 13, minPercentage: 85, displayValue: '13' },
    { grade: 12, minPercentage: 80, displayValue: '12' },
    { grade: 11, minPercentage: 75, displayValue: '11' },
    { grade: 10, minPercentage: 70, displayValue: '10' },
    { grade: 9, minPercentage: 65, displayValue: '9' },
    { grade: 8, minPercentage: 60, displayValue: '8' },
    { grade: 7, minPercentage: 55, displayValue: '7' },
    { grade: 6, minPercentage: 50, displayValue: '6' },
    { grade: 5, minPercentage: 45, displayValue: '5' },
    { grade: 4, minPercentage: 40, displayValue: '4' },
    { grade: 3, minPercentage: 33, displayValue: '3' },
    { grade: 2, minPercentage: 27, displayValue: '2' },
    { grade: 1, minPercentage: 20, displayValue: '1' },
    { grade: 0, minPercentage: 0, displayValue: '0' }
  ],
  defaultRounding: { type: 'nearest', decimalPlaces: 0 }
};

export const KBR_GRADING_PRESETS: Exams.GradingPreset[] = [
  GERMAN_1_6_PRESET,
  GERMAN_0_15_PRESET
];
