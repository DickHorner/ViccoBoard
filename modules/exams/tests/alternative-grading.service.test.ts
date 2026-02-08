/**
 * Tests for AlternativeGradingService
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  AlternativeGradingService,
  AlternativeGradingUIHelper,
  STANDARD_ALTERNATIVE_SCALE,
  SIMPLIFIED_ALTERNATIVE_SCALE,
  type AlternativeGradeType
} from '../src/services/alternative-grading.service';

describe('AlternativeGradingService', () => {
  describe('toNumericPoints', () => {
    it('should convert ++ grade to 100% of max points', () => {
      const points = AlternativeGradingService.toNumericPoints('++', 100, STANDARD_ALTERNATIVE_SCALE);
      expect(points).toBe(100);
    });

    it('should convert + grade to 85% of max points', () => {
      const points = AlternativeGradingService.toNumericPoints('+', 100, STANDARD_ALTERNATIVE_SCALE);
      expect(points).toBe(85);
    });

    it('should convert 0 grade to 65% of max points', () => {
      const points = AlternativeGradingService.toNumericPoints('0', 100, STANDARD_ALTERNATIVE_SCALE);
      expect(points).toBe(65);
    });

    it('should convert - grade to 45% of max points', () => {
      const points = AlternativeGradingService.toNumericPoints('-', 100, STANDARD_ALTERNATIVE_SCALE);
      expect(points).toBe(45);
    });

    it('should convert -- grade to 0 points', () => {
      const points = AlternativeGradingService.toNumericPoints('--', 100, STANDARD_ALTERNATIVE_SCALE);
      expect(points).toBe(0);
    });

    it('should handle fractional max points correctly', () => {
      const points = AlternativeGradingService.toNumericPoints('+', 50, STANDARD_ALTERNATIVE_SCALE);
      expect(points).toBe(43); // 50 * 0.85 = 42.5, rounds to 43
    });

    it('should throw error for invalid grade type', () => {
      expect(() => {
        AlternativeGradingService.toNumericPoints('invalid' as AlternativeGradeType, 100, STANDARD_ALTERNATIVE_SCALE);
      }).toThrow();
    });

    it('should work with simplified scale', () => {
      const points = AlternativeGradingService.toNumericPoints('++', 100, SIMPLIFIED_ALTERNATIVE_SCALE);
      expect(points).toBe(100);

      const pointsZero = AlternativeGradingService.toNumericPoints('0', 100, SIMPLIFIED_ALTERNATIVE_SCALE);
      expect(pointsZero).toBe(50);

      const pointsNeg = AlternativeGradingService.toNumericPoints('--', 100, SIMPLIFIED_ALTERNATIVE_SCALE);
      expect(pointsNeg).toBe(0);
    });
  });

  describe('fromNumericPoints', () => {
    it('should convert 100% points to ++ grade', () => {
      const grade = AlternativeGradingService.fromNumericPoints(100, 100, STANDARD_ALTERNATIVE_SCALE);
      expect(grade).toBe('++');
    });

    it('should convert 85% points to + grade', () => {
      const grade = AlternativeGradingService.fromNumericPoints(85, 100, STANDARD_ALTERNATIVE_SCALE);
      expect(grade).toBe('+');
    });

    it('should convert 65% points to 0 grade', () => {
      const grade = AlternativeGradingService.fromNumericPoints(65, 100, STANDARD_ALTERNATIVE_SCALE);
      expect(grade).toBe('0');
    });

    it('should convert 45% points to - grade', () => {
      const grade = AlternativeGradingService.fromNumericPoints(45, 100, STANDARD_ALTERNATIVE_SCALE);
      expect(grade).toBe('-');
    });

    it('should convert 0% points to -- grade', () => {
      const grade = AlternativeGradingService.fromNumericPoints(0, 100, STANDARD_ALTERNATIVE_SCALE);
      expect(grade).toBe('--');
    });

    it('should find closest match for non-exact percentages', () => {
      // 80% is closer to 85% than to 65%
      const grade = AlternativeGradingService.fromNumericPoints(80, 100, STANDARD_ALTERNATIVE_SCALE);
      expect(grade).toBe('+');

      // 70% is closer to 65% than to 85%
      const grade2 = AlternativeGradingService.fromNumericPoints(70, 100, STANDARD_ALTERNATIVE_SCALE);
      expect(grade2).toBe('0');
    });

    it('should handle zero max points', () => {
      const grade = AlternativeGradingService.fromNumericPoints(0, 0, STANDARD_ALTERNATIVE_SCALE);
      expect(grade).toBe('--');
    });

    it('should work with different max points', () => {
      const grade = AlternativeGradingService.fromNumericPoints(42.5, 50, STANDARD_ALTERNATIVE_SCALE);
      expect(grade).toBe('+'); // 85% of 50
    });
  });

  describe('getGradeConfig', () => {
    it('should return config for ++ grade', () => {
      const config = AlternativeGradingService.getGradeConfig('++', STANDARD_ALTERNATIVE_SCALE);
      expect(config.type).toBe('++');
      expect(config.pointsMultiplier).toBe(1.0);
      expect(config.color).toBe('#28a745');
    });

    it('should return config for -- grade', () => {
      const config = AlternativeGradingService.getGradeConfig('--', STANDARD_ALTERNATIVE_SCALE);
      expect(config.type).toBe('--');
      expect(config.pointsMultiplier).toBe(0.0);
      expect(config.color).toBe('#dc3545');
    });

    it('should throw error for invalid grade', () => {
      expect(() => {
        AlternativeGradingService.getGradeConfig('invalid' as AlternativeGradeType, STANDARD_ALTERNATIVE_SCALE);
      }).toThrow();
    });
  });

  describe('createAlternativeGrading', () => {
    it('should create alternative grading object', () => {
      const grading = AlternativeGradingService.createAlternativeGrading('++', 100, STANDARD_ALTERNATIVE_SCALE);
      expect(grading.type).toBe('++');
      expect(grading.points).toBe(100);
    });

    it('should set correct points for each grade', () => {
      const grades: AlternativeGradeType[] = ['++', '+', '0', '-', '--'];
      const maxPoints = 100;

      const results = grades.map(grade =>
        AlternativeGradingService.createAlternativeGrading(grade, maxPoints, STANDARD_ALTERNATIVE_SCALE)
      );

      expect(results[0].points).toBe(100); // ++
      expect(results[1].points).toBe(85); // +
      expect(results[2].points).toBe(65); // 0
      expect(results[3].points).toBe(45); // -
      expect(results[4].points).toBe(0); // --
    });
  });

  describe('calculateWeightedAverage', () => {
    it('should calculate weighted average correctly', () => {
      const scores = [
        { grade: '++' as AlternativeGradeType, weight: 2 },
        { grade: '0' as AlternativeGradeType, weight: 1 }
      ];

      const avg = AlternativeGradingService.calculateWeightedAverage(scores, STANDARD_ALTERNATIVE_SCALE);
      // (1.0 * 2 + 0.65 * 1) / (2 + 1) = 2.65 / 3 = 0.883...
      expect(avg).toBeCloseTo((1.0 * 2 + 0.65 * 1) / 3);
    });

    it('should handle single score', () => {
      const scores = [{ grade: '++' as AlternativeGradeType, weight: 1 }];
      const avg = AlternativeGradingService.calculateWeightedAverage(scores, STANDARD_ALTERNATIVE_SCALE);
      expect(avg).toBe(1.0);
    });

    it('should return 0 for empty scores', () => {
      const avg = AlternativeGradingService.calculateWeightedAverage([], STANDARD_ALTERNATIVE_SCALE);
      expect(avg).toBe(0);
    });

    it('should handle zero weights', () => {
      const scores = [
        { grade: '++' as AlternativeGradeType, weight: 0 },
        { grade: '0' as AlternativeGradeType, weight: 1 }
      ];
      const avg = AlternativeGradingService.calculateWeightedAverage(scores, STANDARD_ALTERNATIVE_SCALE);
      expect(avg).toBe(0.65);
    });
  });

  describe('isValidGradeType', () => {
    it('should validate valid grade types', () => {
      expect(AlternativeGradingService.isValidGradeType('++')).toBe(true);
      expect(AlternativeGradingService.isValidGradeType('+')).toBe(true);
      expect(AlternativeGradingService.isValidGradeType('0')).toBe(true);
      expect(AlternativeGradingService.isValidGradeType('-')).toBe(true);
      expect(AlternativeGradingService.isValidGradeType('--')).toBe(true);
    });

    it('should reject invalid grade types', () => {
      expect(AlternativeGradingService.isValidGradeType('invalid')).toBe(false);
      expect(AlternativeGradingService.isValidGradeType('')).toBe(false);
      expect(AlternativeGradingService.isValidGradeType('1')).toBe(false);
    });
  });

  describe('formatGrade', () => {
    it('should format grade with emoji and description', () => {
      const formatted = AlternativeGradingService.formatGrade('++', STANDARD_ALTERNATIVE_SCALE);
      expect(formatted).toContain('⭐⭐');
      expect(formatted).toContain('++');
      expect(formatted).toContain('sehr gut');
    });

    it('should format all grades', () => {
      const grades: AlternativeGradeType[] = ['++', '+', '0', '-', '--'];
      grades.forEach(grade => {
        const formatted = AlternativeGradingService.formatGrade(grade, STANDARD_ALTERNATIVE_SCALE);
        expect(formatted.length).toBeGreaterThan(0);
        expect(formatted).toContain(grade);
      });
    });
  });

  describe('getAvailableScales', () => {
    it('should return available scales', () => {
      const scales = AlternativeGradingService.getAvailableScales();
      expect(scales.length).toBeGreaterThanOrEqual(2);
      expect(scales.some((s: { name: string }) => s.name === 'Standard (German)')).toBe(true);
      expect(scales.some((s: { name: string }) => s.name === 'Simplified')).toBe(true);
    });
  });
});

describe('AlternativeGradingUIHelper', () => {
  it('should get grade button props', () => {
    const props = AlternativeGradingUIHelper.getGradeButtonProps('++', STANDARD_ALTERNATIVE_SCALE);
    expect(props.label).toBe('⭐⭐');
    expect(props.title).toContain('sehr gut');
    expect(props.backgroundColor).toBe('#28a745');
  });

  it('should get all grade buttons', () => {
    const buttons = AlternativeGradingUIHelper.getAllGradeButtons(STANDARD_ALTERNATIVE_SCALE);
    expect(buttons.length).toBe(5); // 5 grade types
    expect(buttons.some(b => b.type === '++')).toBe(true);
    expect(buttons.some(b => b.type === '--')).toBe(true);
  });

  it('should work with simplified scale', () => {
    const buttons = AlternativeGradingUIHelper.getAllGradeButtons(SIMPLIFIED_ALTERNATIVE_SCALE);
    expect(buttons.length).toBe(3); // 3 grade types in simplified
  });
});
