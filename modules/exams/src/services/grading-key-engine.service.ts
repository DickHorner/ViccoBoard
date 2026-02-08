/**
 * Advanced Grading Key Engine
 * Handles complex grading key operations including:
 * - Custom grading key creation and modification
 * - Post-correction modifications with change tracking
 * - Error points to grade conversion
 * - Grading key history and validation
 */

import { Exams } from '@viccoboard/core';
import { v4 as uuidv4 } from 'uuid';
import { GradingKeyService } from './grading-key.service';

export interface GradingKeyChange {
  id: string;
  timestamp: Date;
  previousKey: Exams.GradingKey;
  newKey: Exams.GradingKey;
  reason?: string;
  changedBy?: string;
}

export interface GradingKeyModificationResult {
  success: boolean;
  oldKey: Exams.GradingKey;
  newKey: Exams.GradingKey;
  affectedGrades: Array<{ candidateId: string; oldGrade: string | number; newGrade: string | number }>;
  changeLog: GradingKeyChange;
}

export class GradingKeyEngine {
  private static changeHistory: Map<string, GradingKeyChange[]> = new Map();

  /**
   * Create a custom grading key from boundaries
   */
  static createCustomGradingKey(
    name: string,
    totalPoints: number,
    boundaries: Exams.GradeBoundary[],
    roundingRule: Exams.RoundingRule = { type: 'nearest', decimalPlaces: 1 }
  ): Exams.GradingKey {
    // Sort boundaries by minPercentage descending
    const sortedBoundaries = [...boundaries].sort((a, b) => {
      const minA = a.minPercentage ?? 0;
      const minB = b.minPercentage ?? 0;
      return minB - minA; // Descending order
    });

    return {
      id: uuidv4(),
      name,
      type: Exams.GradingKeyType.Percentage,
      totalPoints,
      gradeBoundaries: sortedBoundaries,
      roundingRule,
      errorPointsToGrade: false,
      customizable: true,
      modifiedAfterCorrection: false
    };
  }

  /**
   * Convert percentage-based boundaries to points-based
   */
  static convertToPointsBased(
    percentageKey: Exams.GradingKey,
    totalPoints: number
  ): Exams.GradingKey {
    const pointsBoundaries = percentageKey.gradeBoundaries.map(b => {
      const minPts = Math.ceil((((b.minPercentage ?? 0) / 100) * totalPoints));
      return { ...b, minPoints: minPts };
    });

    return {
      ...percentageKey,
      type: Exams.GradingKeyType.Points,
      gradeBoundaries: pointsBoundaries
    };
  }

  /**
   * Modify grading key after correction with change tracking
   */
  static modifyGradingKeyAfterCorrection(
    oldKey: Exams.GradingKey,
    newBoundaries: Exams.GradeBoundary[],
    reason?: string,
    changedBy?: string
  ): Exams.GradingKey {
    const modifiedKey: Exams.GradingKey = {
      ...oldKey,
      gradeBoundaries: newBoundaries,
      modifiedAfterCorrection: true
    };

    // Record change
    const change: GradingKeyChange = {
      id: uuidv4(),
      timestamp: new Date(),
      previousKey: oldKey,
      newKey: modifiedKey,
      reason,
      changedBy
    };

    const history = this.changeHistory.get(oldKey.id) || [];
    history.push(change);
    this.changeHistory.set(oldKey.id, history);

    return modifiedKey;
  }

  /**
   * Recalculate all grades in a batch of corrections
   */
  static recalculateGradesForBatch(
    corrections: Exams.CorrectionEntry[],
    oldKey: Exams.GradingKey,
    newKey: Exams.GradingKey
  ): {
    affectedGrades: Array<{ candidateId: string; oldGrade: string | number; newGrade: string | number }>;
    changeCount: number;
  } {
    const affectedGrades: Array<{ candidateId: string; oldGrade: string | number; newGrade: string | number }> = [];
    let changeCount = 0;

    for (const correction of corrections) {
      const oldGradeResult = GradingKeyService.calculateGrade(correction.totalPoints, oldKey);
      const newGradeResult = GradingKeyService.calculateGrade(correction.totalPoints, newKey);

      if (oldGradeResult.grade !== newGradeResult.grade) {
        affectedGrades.push({
          candidateId: correction.candidateId,
          oldGrade: oldGradeResult.grade,
          newGrade: newGradeResult.grade
        });
        changeCount++;
      }
    }

    return { affectedGrades, changeCount };
  }

  /**
   * Convert error points to grade
   * Allows setting points as error deductions from max score
   */
  static convertErrorPointsToGrade(
    totalPoints: number,
    errorPoints: number,
    maxPoints: number,
    gradingKey: Exams.GradingKey
  ): { grade: string | number; calculatedPoints: number } {
    const calculatedPoints = Math.max(0, maxPoints - errorPoints);
    const gradeResult = GradingKeyService.calculateGrade(calculatedPoints, gradingKey);
    return { grade: gradeResult.grade, calculatedPoints };
  }

  /**
   * Validate grading key consistency
   */
  static validateGradingKey(key: Exams.GradingKey): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check boundaries are properly ordered
    if (key.type === Exams.GradingKeyType.Percentage) {
      for (let i = 0; i < key.gradeBoundaries.length - 1; i++) {
        const current = key.gradeBoundaries[i].minPercentage ?? 0;
        const next = key.gradeBoundaries[i + 1].minPercentage ?? 0;
        if (current <= next) {
          errors.push(
            `Boundary order error: Grade ${key.gradeBoundaries[i].displayValue} (${current}%) should be higher than Grade ${key.gradeBoundaries[i + 1].displayValue} (${next}%)`
          );
        }
      }
    }

    // Check for gaps in grading scale
    if (key.gradeBoundaries.length < 2) {
      errors.push('Grading key must have at least 2 grade boundaries');
    }

    // Check that lowest boundary covers 0%
    const lowest = key.gradeBoundaries[key.gradeBoundaries.length - 1];
    if ((lowest.minPercentage ?? 0) > 0) {
      errors.push('Lowest grade boundary must start at 0%');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get change history for a grading key
   */
  static getChangeHistory(keyId: string): GradingKeyChange[] {
    return this.changeHistory.get(keyId) || [];
  }

  /**
   * Compare two grading keys
   */
  static compareGradingKeys(
    key1: Exams.GradingKey,
    key2: Exams.GradingKey
  ): { changes: string[]; isSame: boolean } {
    const changes: string[] = [];

    if (key1.name !== key2.name) {
      changes.push(`Name changed: "${key1.name}" → "${key2.name}"`);
    }

    if (key1.type !== key2.type) {
      changes.push(`Type changed: ${key1.type} → ${key2.type}`);
    }

    if (JSON.stringify(key1.gradeBoundaries) !== JSON.stringify(key2.gradeBoundaries)) {
      changes.push('Grade boundaries modified');
    }

    if (JSON.stringify(key1.roundingRule) !== JSON.stringify(key2.roundingRule)) {
      changes.push('Rounding rule changed');
    }

    return {
      changes,
      isSame: changes.length === 0
    };
  }

  /**
   * Create a grading key preset
   */
  static createPreset(
    name: string,
    description: string,
    system: Exams.GradingPreset['system'],
    boundaries: Exams.GradeBoundary[],
    defaultRounding: Exams.RoundingRule
  ): Exams.GradingPreset {
    return {
      id: uuidv4(),
      name,
      description,
      system,
      boundaries,
      defaultRounding
    };
  }

  /**
   * Clone a grading key with custom modifications
   */
  static cloneWithModifications(
    sourceKey: Exams.GradingKey,
    modifications: Partial<Exams.GradingKey>
  ): Exams.GradingKey {
    return {
      ...sourceKey,
      ...modifications,
      id: uuidv4(),
      modifiedAfterCorrection: false
    };
  }

  /**
   * Suggest grading key adjustments based on grade distribution
   */
  static suggestGradingKeyAdjustments(
    corrections: Exams.CorrectionEntry[],
    currentKey: Exams.GradingKey,
    targetDistribution?: { grade: string | number; percentage: number }[]
  ): {
    suggestion: Exams.GradeBoundary[];
    reasoning: string[];
  } {
    const reasoning: string[] = [];

    // Calculate grade distribution
    const gradeDistribution = new Map<string | number, number>();
    for (const correction of corrections) {
      const result = GradingKeyService.calculateGrade(correction.totalPoints, currentKey);
      const count = gradeDistribution.get(result.grade) || 0;
      gradeDistribution.set(result.grade, count + 1);
    }

    reasoning.push(
      `Current distribution: ${Array.from(gradeDistribution.entries())
        .map(([grade, count]) => `${grade}:${count}`)
        .join(', ')}`
    );

    // For now, suggest boundaries if distribution is too skewed
    let suggestion = currentKey.gradeBoundaries;

    const avgGrade = Array.from(gradeDistribution.entries()).reduce((sum, [_, count]) => sum + count, 0) / gradeDistribution.size;
    if (avgGrade > 4) {
      reasoning.push('Grade distribution is skewed toward lower grades. Consider adjusting boundaries.');
    }

    return { suggestion, reasoning };
  }

  /**
   * Export grading key history as report
   */
  static exportchangeHistory(keyId: string): string {
    const history = this.getChangeHistory(keyId);
    if (history.length === 0) {
      return 'No changes recorded';
    }

    let report = `Grading Key Change History (ID: ${keyId})\n`;
    report += `Generated: ${new Date().toISOString()}\n`;
    report += '='.repeat(60) + '\n\n';

    for (const change of history) {
      report += `Change ID: ${change.id}\n`;
      report += `Timestamp: ${change.timestamp.toISOString()}\n`;
      if (change.changedBy) report += `Changed by: ${change.changedBy}\n`;
      if (change.reason) report += `Reason: ${change.reason}\n`;

      const comparison = this.compareGradingKeys(change.previousKey, change.newKey);
      if (comparison.changes.length > 0) {
        report += 'Changes:\n';
        for (const change of comparison.changes) {
          report += `  - ${change}\n`;
        }
      }
      report += '\n';
    }

    return report;
  }
}

/**
 * Helper class for grading key UI operations
 */
export class GradingKeyUIHelper {
  /**
   * Format boundary for display
   */
  static formatBoundary(boundary: Exams.GradeBoundary, type: string = 'percentage'): string {
    if (type === 'points') {
      const min = boundary.minPoints ?? 0;
      const max = boundary.maxPoints ?? 100;
      return `Grade ${boundary.displayValue}: ${min}-${max} points`;
    } else {
      const min = boundary.minPercentage ?? 0;
      const max = boundary.maxPercentage ?? 100;
      return `Grade ${boundary.displayValue}: ${min}%-${max}%`;
    }
  }

  /**
   * Get color code for grade
   */
  static getGradeColor(grade: string | number): string {
    const gradeNum = typeof grade === 'number' ? grade : parseInt(grade as string);

    // German grading colors (1=good, 6=bad)
    if (gradeNum === 1 || gradeNum === 15) return '#28a745'; // Green
    if (gradeNum === 2 || gradeNum === 14) return '#5cb85c'; // Light green
    if (gradeNum === 3 || gradeNum === 13) return '#ffc107'; // Orange
    if (gradeNum === 4 || gradeNum === 12) return '#ff9800'; // Dark orange
    if (gradeNum === 5 || gradeNum === 11) return '#fd7e14'; // Darker orange
    if (gradeNum === 6 || gradeNum === 5) return '#dc3545'; // Red

    return '#999'; // Gray for unknown
  }

  /**
   * Suggest preset based on context
   */
  static suggestPreset(numCandidates: number, relevantPresets: Exams.GradingPreset[]): Exams.GradingPreset | null {
    // Simple heuristic: for most German contexts, 1-6 is standard
    return relevantPresets.find(p => p.system === 'german-1-6') || null;
  }
}
