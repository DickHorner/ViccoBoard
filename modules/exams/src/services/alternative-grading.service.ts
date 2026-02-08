/**
 * Alternative Grading Service
 * Manages qualitative scoring: ++, +, 0, -, --
 * Converts between alternative grades and point values
 */

import { Exams } from '@viccoboard/core';

export type AlternativeGradeType = '++' | '+' | '0' | '-' | '--';

export interface AlternativeGradingConfig {
  type: AlternativeGradeType;
  label: string;
  description: string;
  pointsMultiplier: number; // Relative weight when converting to numeric points
  color: string; // UI color representation
  emoji: string; // Visual indicator
}

export interface AlternativeGradingScale {
  name: string;
  description: string;
  grades: AlternativeGradingConfig[];
  totalMaxPoints?: number; // Reference points for conversion
}

/**
 * Standard German Alternative Grading Scale
 * Maps to traditional German school assessment terminology
 */
export const STANDARD_ALTERNATIVE_SCALE: AlternativeGradingScale = {
  name: 'Standard (German)',
  description: 'Qualitative assessment scale: excellent to insufficient',
  grades: [
    {
      type: '++',
      label: '++',
      description: 'Excellent (sehr gut)',
      pointsMultiplier: 1.0, // 100% of max points
      color: '#28a745',
      emoji: '⭐⭐'
    },
    {
      type: '+',
      label: '+',
      description: 'Good (gut)',
      pointsMultiplier: 0.85, // 85% of max points
      color: '#20c997',
      emoji: '⭐'
    },
    {
      type: '0',
      label: '0',
      description: 'Satisfactory (befriedigend)',
      pointsMultiplier: 0.65, // 65% of max points
      color: '#ffc107',
      emoji: '◯'
    },
    {
      type: '-',
      label: '-',
      description: 'Weak (schwach)',
      pointsMultiplier: 0.45, // 45% of max points
      color: '#fd7e14',
      emoji: '◐'
    },
    {
      type: '--',
      label: '--',
      description: 'Insufficient (nicht ausreichend)',
      pointsMultiplier: 0.0, // 0 points
      color: '#dc3545',
      emoji: '✗'
    }
  ]
};

/**
 * Simplified Alternative Grading Scale (3-point)
 * Useful for quick assessments with fewer categories
 */
export const SIMPLIFIED_ALTERNATIVE_SCALE: AlternativeGradingScale = {
  name: 'Simplified',
  description: 'Quick assessment with 3 levels',
  grades: [
    {
      type: '++',
      label: '+',
      description: 'Good (bestanden)',
      pointsMultiplier: 1.0,
      color: '#28a745',
      emoji: '✓'
    },
    {
      type: '0',
      label: '0',
      description: 'Neutral (neutral)',
      pointsMultiplier: 0.5,
      color: '#ffc107',
      emoji: '◯'
    },
    {
      type: '--',
      label: '-',
      description: 'Insufficient (nicht bestanden)',
      pointsMultiplier: 0.0,
      color: '#dc3545',
      emoji: '✗'
    }
  ]
};

export class AlternativeGradingService {
  /**
   * Convert alternative grade to numeric points
   * @param grade Alternative grade type
   * @param maxPoints Maximum points available for the task
   * @param scale Alternative grading scale config
   * @returns Calculated numeric points
   */
  static toNumericPoints(
    grade: AlternativeGradeType,
    maxPoints: number,
    scale: AlternativeGradingScale = STANDARD_ALTERNATIVE_SCALE
  ): number {
    const config = scale.grades.find(g => g.type === grade);
    if (!config) {
      throw new Error(`Unknown alternative grade type: ${grade}`);
    }
    return Math.round(maxPoints * config.pointsMultiplier);
  }

  /**
   * Convert numeric points to closest alternative grade
   * @param points Numeric points earned
   * @param maxPoints Maximum points possible
   * @param scale Alternative grading scale config
   * @returns Closest alternative grade type
   */
  static fromNumericPoints(
    points: number,
    maxPoints: number,
    scale: AlternativeGradingScale = STANDARD_ALTERNATIVE_SCALE
  ): AlternativeGradeType {
    if (maxPoints === 0) return '--';

    const percentage = points / maxPoints;

    // Find closest match by percentage
    let closest: AlternativeGradeConfig = scale.grades[0];
    let minDiff = Math.abs(percentage - closest.pointsMultiplier);

    for (const grade of scale.grades) {
      const diff = Math.abs(percentage - grade.pointsMultiplier);
      if (diff < minDiff) {
        minDiff = diff;
        closest = grade;
      }
    }

    return closest.type;
  }

  /**
   * Get configuration for a specific alternative grade
   */
  static getGradeConfig(
    grade: AlternativeGradeType,
    scale: AlternativeGradingScale = STANDARD_ALTERNATIVE_SCALE
  ): AlternativeGradingConfig {
    const config = scale.grades.find(g => g.type === grade);
    if (!config) {
      throw new Error(`Unknown alternative grade type: ${grade}`);
    }
    return config;
  }

  /**
   * Create alternative grading entry
   */
  static createAlternativeGrading(
    type: AlternativeGradeType,
    maxPoints: number,
    scale: AlternativeGradingScale = STANDARD_ALTERNATIVE_SCALE
  ): Exams.AlternativeGrading {
    return {
      type,
      points: this.toNumericPoints(type, maxPoints, scale)
    };
  }

  /**
   * Calculate weighted average of alternative grades
   * Useful for compound scoring
   */
  static calculateWeightedAverage(
    scores: Array<{ grade: AlternativeGradeType; weight: number }>,
    scale: AlternativeGradingScale = STANDARD_ALTERNATIVE_SCALE
  ): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const score of scores) {
      const config = scale.grades.find(g => g.type === score.grade);
      if (config) {
        weightedSum += config.pointsMultiplier * score.weight;
        totalWeight += score.weight;
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Get all available alternative grading scales
   */
  static getAvailableScales(): AlternativeGradingScale[] {
    return [STANDARD_ALTERNATIVE_SCALE, SIMPLIFIED_ALTERNATIVE_SCALE];
  }

  /**
   * Validate alternative grade type
   */
  static isValidGradeType(value: string): value is AlternativeGradeType {
    const validTypes: AlternativeGradeType[] = ['++', '+', '0', '-', '--'];
    return validTypes.includes(value as AlternativeGradeType);
  }

  /**
   * Format alternative grade with description
   */
  static formatGrade(
    grade: AlternativeGradeType,
    scale: AlternativeGradingScale = STANDARD_ALTERNATIVE_SCALE
  ): string {
    const config = this.getGradeConfig(grade, scale);
    return `${config.emoji} ${config.label} (${config.description})`;
  }
}

/**
 * Helper class for alternative grading in forms
 */
export class AlternativeGradingUIHelper {
  /**
   * Get styled button properties for a grade
   */
  static getGradeButtonProps(
    grade: AlternativeGradeType,
    scale: AlternativeGradingScale = STANDARD_ALTERNATIVE_SCALE
  ) {
    const config = AlternativeGradingService.getGradeConfig(grade, scale);
    return {
      label: config.emoji,
      title: config.description,
      className: `alternative-grade-${grade}`,
      backgroundColor: config.color,
      borderColor: config.color
    };
  }

  /**
   * Get all grade buttons for rendering
   */
  static getAllGradeButtons(scale: AlternativeGradingScale = STANDARD_ALTERNATIVE_SCALE) {
    return scale.grades.map(config => ({
      type: config.type,
      ...this.getGradeButtonProps(config.type, scale)
    }));
  }
}
