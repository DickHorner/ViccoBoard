/**
 * CriteriaGradingEngine Tests
 * Validates calculation logic, edge cases, and validation rules
 */

import { CriteriaGradingEngine, CriteriaGradingInput, CriteriaScore } from '../src/grading/criteria-grading.engine';
import { Sport } from '@viccoboard/core';

type Criterion = Sport.Criterion;

describe('CriteriaGradingEngine', () => {
  let engine: CriteriaGradingEngine;

  beforeEach(() => {
    engine = new CriteriaGradingEngine();
  });

  describe('calculateGrade', () => {
    test('calculates weighted average correctly with equal weights', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Technique', weight: 1, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'Endurance', weight: 1, minValue: 0, maxValue: 100 },
        { id: 'c3', name: 'Teamwork', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const scores: CriteriaScore[] = [
        { criterionId: 'c1', value: 80 },
        { criterionId: 'c2', value: 90 },
        { criterionId: 'c3', value: 70 }
      ];

      const result = engine.calculateGrade({ criteria, scores });

      expect(result.totalWeightedScore).toBe(80); // (80 + 90 + 70) / 3 = 80
      expect(result.percentage).toBe(80);
      expect(result.displayValue).toBe('3'); // 80% is grade 3 (67-80.99%)
      expect(result.breakdown).toHaveLength(3);
    });

    test('calculates weighted average correctly with different weights', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Technique', weight: 2, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'Endurance', weight: 1, minValue: 0, maxValue: 100 },
        { id: 'c3', name: 'Teamwork', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const scores: CriteriaScore[] = [
        { criterionId: 'c1', value: 90 }, // weight 2
        { criterionId: 'c2', value: 60 }, // weight 1
        { criterionId: 'c3', value: 80 }  // weight 1
      ];

      const result = engine.calculateGrade({ criteria, scores });

      // (90*2 + 60*1 + 80*1) / 4 = 320 / 4 = 80
      expect(result.totalWeightedScore).toBe(80);
      expect(result.displayValue).toBe('3'); // 80% is grade 3 (67-80.99%)
    });

    test('handles maximum 8 criteria', () => {
      const criteria: Criterion[] = Array.from({ length: 8 }, (_, i) => ({
        id: `c${i}`,
        name: `Criterion ${i}`,
        weight: 1,
        minValue: 0,
        maxValue: 100
      }));

      const scores: CriteriaScore[] = criteria.map(c => ({
        criterionId: c.id,
        value: 75
      }));

      const result = engine.calculateGrade({ criteria, scores });

      expect(result.totalWeightedScore).toBe(75);
      expect(result.breakdown).toHaveLength(8);
    });

    test('calculates correct breakdown for each criterion', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Technique', weight: 3, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'Endurance', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const scores: CriteriaScore[] = [
        { criterionId: 'c1', value: 80 },
        { criterionId: 'c2', value: 60 }
      ];

      const result = engine.calculateGrade({ criteria, scores });

      expect(result.breakdown[0].criterionId).toBe('c1');
      expect(result.breakdown[0].criterionName).toBe('Technique');
      expect(result.breakdown[0].score).toBe(80);
      expect(result.breakdown[0].weight).toBe(3);
      expect(result.breakdown[0].normalizedScore).toBe(0.75); // 3/4
      expect(result.breakdown[0].weightedScore).toBe(60); // 80 * 0.75

      expect(result.breakdown[1].criterionId).toBe('c2');
      expect(result.breakdown[1].normalizedScore).toBe(0.25); // 1/4
      expect(result.breakdown[1].weightedScore).toBe(15); // 60 * 0.25

      expect(result.totalWeightedScore).toBe(75); // 60 + 15
    });

    test('converts scores to German grades correctly', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Test', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const testCases = [
        { score: 100, expectedGrade: '1' },
        { score: 92, expectedGrade: '1' },
        { score: 85, expectedGrade: '2' },
        { score: 70, expectedGrade: '3' },
        { score: 55, expectedGrade: '4' },
        { score: 35, expectedGrade: '5' },
        { score: 20, expectedGrade: '6' },
        { score: 0, expectedGrade: '6' }
      ];

      for (const testCase of testCases) {
        const scores: CriteriaScore[] = [
          { criterionId: 'c1', value: testCase.score }
        ];

        const result = engine.calculateGrade({ criteria, scores });
        expect(result.displayValue).toBe(testCase.expectedGrade);
      }
    });

    test('rounds total weighted score to 2 decimal places', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'A', weight: 1, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'B', weight: 1, minValue: 0, maxValue: 100 },
        { id: 'c3', name: 'C', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const scores: CriteriaScore[] = [
        { criterionId: 'c1', value: 83 },
        { criterionId: 'c2', value: 84 },
        { criterionId: 'c3', value: 85 }
      ];

      const result = engine.calculateGrade({ criteria, scores });

      // (83 + 84 + 85) / 3 = 84
      expect(result.totalWeightedScore).toBe(84);
    });
  });

  describe('validation', () => {
    test('throws error for no criteria', () => {
      const input: CriteriaGradingInput = {
        criteria: [],
        scores: []
      };

      expect(() => engine.calculateGrade(input)).toThrow('At least one criterion is required');
    });

    test('throws error for more than 8 criteria', () => {
      const criteria: Criterion[] = Array.from({ length: 9 }, (_, i) => ({
        id: `c${i}`,
        name: `Criterion ${i}`,
        weight: 1,
        minValue: 0,
        maxValue: 100
      }));

      const scores: CriteriaScore[] = criteria.map(c => ({
        criterionId: c.id,
        value: 75
      }));

      expect(() => engine.calculateGrade({ criteria, scores })).toThrow('Maximum 8 criteria allowed');
    });

    test('throws error for no scores', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Test', weight: 1, minValue: 0, maxValue: 100 }
      ];

      expect(() => engine.calculateGrade({ criteria, scores: [] })).toThrow('At least one score is required');
    });

    test('throws error for score below minimum', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Test', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const scores: CriteriaScore[] = [
        { criterionId: 'c1', value: -1 }
      ];

      expect(() => engine.calculateGrade({ criteria, scores })).toThrow('Score value must be between 0 and 100');
    });

    test('throws error for score above maximum', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Test', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const scores: CriteriaScore[] = [
        { criterionId: 'c1', value: 101 }
      ];

      expect(() => engine.calculateGrade({ criteria, scores })).toThrow('Score value must be between 0 and 100');
    });

    test('throws error for missing score for criterion', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Test', weight: 1, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'Test2', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const scores: CriteriaScore[] = [
        { criterionId: 'c1', value: 80 }
      ];

      expect(() => engine.calculateGrade({ criteria, scores })).toThrow('Missing score for criterion: Test2');
    });

    test('throws error for zero total weight', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Test', weight: 0, minValue: 0, maxValue: 100 }
      ];

      const scores: CriteriaScore[] = [
        { criterionId: 'c1', value: 80 }
      ];

      expect(() => engine.calculateGrade({ criteria, scores })).toThrow('Total weight must be greater than zero');
    });
  });

  describe('updateWeights', () => {
    test('updates weights correctly', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'A', weight: 1, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'B', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const newWeights = new Map([
        ['c1', 3],
        ['c2', 1]
      ]);

      const updated = engine.updateWeights(criteria, newWeights);

      expect(updated[0].weight).toBe(3);
      expect(updated[1].weight).toBe(1);
    });

    test('throws error for zero total weight', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'A', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const newWeights = new Map([
        ['c1', 0]
      ]);

      expect(() => engine.updateWeights(criteria, newWeights)).toThrow('Total weight must be greater than zero');
    });

    test('throws error for negative weight', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'A', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const newWeights = new Map([
        ['c1', -1]
      ]);

      expect(() => engine.updateWeights(criteria, newWeights)).toThrow('Weight for A must be non-negative');
    });

    test('keeps original weight for unspecified criteria', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'A', weight: 1, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'B', weight: 2, minValue: 0, maxValue: 100 }
      ];

      const newWeights = new Map([
        ['c1', 3]
      ]);

      const updated = engine.updateWeights(criteria, newWeights);

      expect(updated[0].weight).toBe(3);
      expect(updated[1].weight).toBe(2);
    });

    test('returns new objects for all criteria (immutability)', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'A', weight: 1, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'B', weight: 2, minValue: 0, maxValue: 100 }
      ];

      const newWeights = new Map([
        ['c1', 3]
      ]);

      const updated = engine.updateWeights(criteria, newWeights);

      // Verify new objects were created
      expect(updated[0]).not.toBe(criteria[0]);
      expect(updated[1]).not.toBe(criteria[1]);
    });
  });

  describe('validateCriteria', () => {
    test('validates correct criteria', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Test', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const result = engine.validateCriteria(criteria);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects empty criteria list', () => {
      const result = engine.validateCriteria([]);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one criterion is required');
    });

    test('detects too many criteria', () => {
      const criteria: Criterion[] = Array.from({ length: 9 }, (_, i) => ({
        id: `c${i}`,
        name: `Criterion ${i}`,
        weight: 1,
        minValue: 0,
        maxValue: 100
      }));

      const result = engine.validateCriteria(criteria);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Maximum 8 criteria allowed');
    });

    test('detects missing criterion name', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: '', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const result = engine.validateCriteria(criteria);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Criterion c1 must have a name');
    });

    test('detects negative weight', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Test', weight: -1, minValue: 0, maxValue: 100 }
      ];

      const result = engine.validateCriteria(criteria);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Weight for Test must be non-negative');
    });

    test('detects zero total weight', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Test', weight: 0, minValue: 0, maxValue: 100 }
      ];

      const result = engine.validateCriteria(criteria);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Total weight must be greater than zero');
    });

    test('detects duplicate criterion names', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Test', weight: 1, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'Test', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const result = engine.validateCriteria(criteria);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate criterion names found: test');
    });

    test('detects multiple duplicate criterion names only once each', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Test', weight: 1, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'Test', weight: 1, minValue: 0, maxValue: 100 },
        { id: 'c3', name: 'Test', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const result = engine.validateCriteria(criteria);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Duplicate criterion names found: test');
      // Verify "test" is only mentioned once, not multiple times
      const errorText = result.errors[0];
      const matches = errorText.match(/test/g);
      expect(matches?.length).toBe(1);
    });
  });

  describe('edge cases', () => {
    test('handles single criterion', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Test', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const scores: CriteriaScore[] = [
        { criterionId: 'c1', value: 75 }
      ];

      const result = engine.calculateGrade({ criteria, scores });

      expect(result.totalWeightedScore).toBe(75);
      expect(result.displayValue).toBe('3');
    });

    test('handles all zero scores', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'A', weight: 1, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'B', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const scores: CriteriaScore[] = [
        { criterionId: 'c1', value: 0 },
        { criterionId: 'c2', value: 0 }
      ];

      const result = engine.calculateGrade({ criteria, scores });

      expect(result.totalWeightedScore).toBe(0);
      expect(result.displayValue).toBe('6');
    });

    test('handles all maximum scores', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'A', weight: 1, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'B', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const scores: CriteriaScore[] = [
        { criterionId: 'c1', value: 100 },
        { criterionId: 'c2', value: 100 }
      ];

      const result = engine.calculateGrade({ criteria, scores });

      expect(result.totalWeightedScore).toBe(100);
      expect(result.displayValue).toBe('1');
    });

    test('handles very small weights', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'A', weight: 0.1, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'B', weight: 0.2, minValue: 0, maxValue: 100 }
      ];

      const scores: CriteriaScore[] = [
        { criterionId: 'c1', value: 60 },
        { criterionId: 'c2', value: 90 }
      ];

      const result = engine.calculateGrade({ criteria, scores });

      // (60 * 0.1 + 90 * 0.2) / 0.3 = (6 + 18) / 0.3 = 80
      expect(result.totalWeightedScore).toBe(80);
    });

    test('handles large weights', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'A', weight: 100, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'B', weight: 200, minValue: 0, maxValue: 100 }
      ];

      const scores: CriteriaScore[] = [
        { criterionId: 'c1', value: 60 },
        { criterionId: 'c2', value: 90 }
      ];

      const result = engine.calculateGrade({ criteria, scores });

      // (60 * 100 + 90 * 200) / 300 = (6000 + 18000) / 300 = 80
      expect(result.totalWeightedScore).toBe(80);
    });

    test('handles floating point precision with repeating decimals', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'A', weight: 1/3, minValue: 0, maxValue: 100 },
        { id: 'c2', name: 'B', weight: 1/3, minValue: 0, maxValue: 100 },
        { id: 'c3', name: 'C', weight: 1/3, minValue: 0, maxValue: 100 }
      ];

      const scores: CriteriaScore[] = [
        { criterionId: 'c1', value: 85 },
        { criterionId: 'c2', value: 85 },
        { criterionId: 'c3', value: 85 }
      ];

      const result = engine.calculateGrade({ criteria, scores });

      // Should handle floating point correctly and return 85
      expect(result.totalWeightedScore).toBe(85);
      expect(result.displayValue).toBe('2');
    });

    test('handles grade boundary precision at exact threshold', () => {
      const criteria: Criterion[] = [
        { id: 'c1', name: 'Test', weight: 1, minValue: 0, maxValue: 100 }
      ];

      const boundaryTests = [
        { score: 92.00, expectedGrade: '1' },
        { score: 91.99, expectedGrade: '2' },
        { score: 81.00, expectedGrade: '2' },
        { score: 80.99, expectedGrade: '3' },
        { score: 67.00, expectedGrade: '3' },
        { score: 66.99, expectedGrade: '4' },
        { score: 50.00, expectedGrade: '4' },
        { score: 49.99, expectedGrade: '5' },
        { score: 30.00, expectedGrade: '5' },
        { score: 29.99, expectedGrade: '6' }
      ];

      for (const test of boundaryTests) {
        const scores: CriteriaScore[] = [{ criterionId: 'c1', value: test.score }];
        const result = engine.calculateGrade({ criteria, scores });
        expect(result.displayValue).toBe(test.expectedGrade);
      }
    });
  });
});
