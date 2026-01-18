/**
 * Criteria-Based Grading Engine
 * Handles calculation of grades based on weighted criteria with slider input (0-100)
 */

import { Sport, Grade } from '@viccoboard/core';

type Criterion = Sport.Criterion;

export interface CriteriaScore {
  criterionId: string;
  value: number; // 0-100 from slider
}

export interface CriteriaGradingInput {
  scores: CriteriaScore[];
  criteria: Criterion[];
}

export interface CriteriaGradingResult extends Grade {
  breakdown: CriteriaBreakdown[];
  totalWeightedScore: number;
}

export interface CriteriaBreakdown {
  criterionId: string;
  criterionName: string;
  score: number;
  weight: number;
  weightedScore: number;
  normalizedScore: number;
}

export class CriteriaGradingEngine {
  private static readonly MAX_CRITERIA = 8;
  private static readonly MIN_SCORE = 0;
  private static readonly MAX_SCORE = 100;

  /**
   * Calculate grade from criteria scores
   * @param input Criteria scores and definitions
   * @returns Calculated grade with breakdown
   */
  calculateGrade(input: CriteriaGradingInput): CriteriaGradingResult {
    // Validate input
    this.validateInput(input);

    // Build breakdown with weighted scores
    const breakdown = this.buildBreakdown(input.scores, input.criteria);

    // Calculate total weighted score (0-100)
    const totalWeightedScore = this.calculateTotalWeightedScore(breakdown);

    // Convert to grade display value
    const displayValue = this.convertToGradeDisplay(totalWeightedScore);

    return {
      value: totalWeightedScore,
      displayValue,
      percentage: totalWeightedScore,
      breakdown,
      totalWeightedScore
    };
  }

  /**
   * Validate grading input
   */
  private validateInput(input: CriteriaGradingInput): void {
    if (!input.criteria || input.criteria.length === 0) {
      throw new Error('At least one criterion is required');
    }

    if (input.criteria.length > CriteriaGradingEngine.MAX_CRITERIA) {
      throw new Error(`Maximum ${CriteriaGradingEngine.MAX_CRITERIA} criteria allowed`);
    }

    if (!input.scores || input.scores.length === 0) {
      throw new Error('At least one score is required');
    }

    // Validate each score is within bounds
    for (const score of input.scores) {
      if (score.value < CriteriaGradingEngine.MIN_SCORE || score.value > CriteriaGradingEngine.MAX_SCORE) {
        throw new Error(`Score value must be between ${CriteriaGradingEngine.MIN_SCORE} and ${CriteriaGradingEngine.MAX_SCORE}`);
      }
    }

    // Validate all criteria have scores
    const scoreMap = new Map(input.scores.map(s => [s.criterionId, s.value]));
    for (const criterion of input.criteria) {
      if (!scoreMap.has(criterion.id)) {
        throw new Error(`Missing score for criterion: ${criterion.name || criterion.id}`);
      }
    }

    // Validate weights
    const totalWeight = input.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight <= 0) {
      throw new Error('Total weight must be greater than zero');
    }
  }

  /**
   * Build breakdown of weighted scores for each criterion
   */
  private buildBreakdown(scores: CriteriaScore[], criteria: Criterion[]): CriteriaBreakdown[] {
    const scoreMap = new Map(scores.map(s => [s.criterionId, s.value]));
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

    return criteria.map(criterion => {
      const score = scoreMap.get(criterion.id) || 0;
      const normalizedWeight = criterion.weight / totalWeight;
      const weightedScore = score * normalizedWeight;

      return {
        criterionId: criterion.id,
        criterionName: criterion.name,
        score,
        weight: criterion.weight,
        weightedScore,
        normalizedScore: normalizedWeight
      };
    });
  }

  /**
   * Calculate total weighted score from breakdown
   */
  private calculateTotalWeightedScore(breakdown: CriteriaBreakdown[]): number {
    const total = breakdown.reduce((sum, item) => sum + item.weightedScore, 0);
    // Round to 2 decimal places
    return Math.round(total * 100) / 100;
  }

  /**
   * Convert percentage score to grade display value
   * Uses German grading system: 1 (best) to 6 (worst)
   */
  private convertToGradeDisplay(percentage: number): string {
    if (percentage >= 92) return '1';
    if (percentage >= 81) return '2';
    if (percentage >= 67) return '3';
    if (percentage >= 50) return '4';
    if (percentage >= 30) return '5';
    return '6';
  }

  /**
   * Update weights for criteria
   * Validates that new weights are valid
   */
  updateWeights(criteria: Criterion[], newWeights: Map<string, number>): Criterion[] {
    // Check for negative weights first
    newWeights.forEach((weight, criterionId) => {
      if (weight < 0) {
        const criterion = criteria.find(c => c.id === criterionId);
        const name = criterion?.name || criterionId;
        throw new Error(`Weight for ${name} must be non-negative`);
      }
    });

    const totalWeight = Array.from(newWeights.values()).reduce((sum, w) => sum + w, 0);
    
    if (totalWeight <= 0) {
      throw new Error('Total weight must be greater than zero');
    }

    return criteria.map(criterion => {
      const newWeight = newWeights.get(criterion.id);
      if (newWeight !== undefined) {
        return { ...criterion, weight: newWeight };
      }
      return criterion;
    });
  }

  /**
   * Validate criteria configuration
   */
  validateCriteria(criteria: Criterion[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (criteria.length === 0) {
      errors.push('At least one criterion is required');
    }

    if (criteria.length > CriteriaGradingEngine.MAX_CRITERIA) {
      errors.push(`Maximum ${CriteriaGradingEngine.MAX_CRITERIA} criteria allowed`);
    }

    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight <= 0) {
      errors.push('Total weight must be greater than zero');
    }

    for (const criterion of criteria) {
      if (!criterion.name || criterion.name.trim() === '') {
        errors.push(`Criterion ${criterion.id} must have a name`);
      }
      if (criterion.weight < 0) {
        errors.push(`Weight for ${criterion.name} must be non-negative`);
      }
    }

    // Check for duplicate names
    const names = criteria.map(c => c.name.toLowerCase());
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate criterion names found: ${duplicates.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
