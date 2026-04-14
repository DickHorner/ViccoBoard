/**
 * Grading Key Service Tests
 */

import { describe, it, expect } from '@jest/globals';
import { Exams } from '@viccoboard/core';
import {
  GradingKeyService,
  GERMAN_1_6_PRESET,
  GERMAN_0_15_PRESET,
  KBR_GRADING_PRESETS
} from '../src/services/grading-key.service';

describe('GradingKeyService', () => {
  describe('calculateGrade', () => {
    const gradingKey: Exams.GradingKey = {
      id: 'test-key',
      name: 'Test Key',
      type: Exams.GradingKeyType.Percentage,
      totalPoints: 100,
      gradeBoundaries: [
        { grade: 1, minPercentage: 92, displayValue: '1' },
        { grade: 2, minPercentage: 81, displayValue: '2' },
        { grade: 3, minPercentage: 70, displayValue: '3' },
        { grade: 4, minPercentage: 60, displayValue: '4' },
        { grade: 5, minPercentage: 50, displayValue: '5' },
        { grade: 6, minPercentage: 0, displayValue: '6' }
      ],
      roundingRule: { type: 'nearest', decimalPlaces: 1 },
      errorPointsToGrade: false,
      customizable: true,
      modifiedAfterCorrection: false
    };

    it('should calculate grade 1 for 95 points out of 100', () => {
      const result = GradingKeyService.calculateGrade(95, gradingKey);
      expect(result.grade).toBe('1');
      expect(result.percentage).toBe(95);
    });

    it('should calculate grade 3 for 75 points out of 100', () => {
      const result = GradingKeyService.calculateGrade(75, gradingKey);
      expect(result.grade).toBe('3');
    });

    it('should calculate grade 6 for 30 points out of 100', () => {
      const result = GradingKeyService.calculateGrade(30, gradingKey);
      expect(result.grade).toBe('6');
    });

    it('should calculate grade 1 for a perfect score (100 out of 100)', () => {
      const result = GradingKeyService.calculateGrade(100, gradingKey);
      expect(result.grade).toBe('1');
    });

    it('should handle boundary cases correctly', () => {
      // Exactly at 92 should be grade 1
      const at92 = GradingKeyService.calculateGrade(92, gradingKey);
      expect(at92.grade).toBe('1');

      // Just below 92 should be grade 2
      const below92 = GradingKeyService.calculateGrade(91.9, gradingKey);
      expect(below92.grade).toBe('2');
    });
  });

  describe('applyRounding', () => {
    it('should round up', () => {
      const result = GradingKeyService.applyRounding(3.14159, { type: 'up', decimalPlaces: 2 });
      expect(result).toBe(3.15);
    });

    it('should round down', () => {
      const result = GradingKeyService.applyRounding(3.18, { type: 'down', decimalPlaces: 1 });
      expect(result).toBe(3.1);
    });

    it('should round to nearest', () => {
      const result = GradingKeyService.applyRounding(3.14159, { type: 'nearest', decimalPlaces: 2 });
      expect(result).toBe(3.14);
    });

    it('should not round when type is none', () => {
      const result = GradingKeyService.applyRounding(3.14159, { type: 'none', decimalPlaces: 2 });
      expect(result).toBe(3.14159);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate 75%', () => {
      const result = GradingKeyService.calculatePercentage(75, 100);
      expect(result).toBe(75.0);
    });

    it('should handle edge cases', () => {
      const result = GradingKeyService.calculatePercentage(1, 3);
      expect(result).toBeCloseTo(33.3, 1);
    });

    it('should return 0 for 0 max points', () => {
      const result = GradingKeyService.calculatePercentage(10, 0);
      expect(result).toBe(0);
    });
  });

  describe('pointsToNextGrade', () => {
    const gradingKey: Exams.GradingKey = {
      id: 'test-key',
      name: 'Test Key',
      type: Exams.GradingKeyType.Percentage,
      totalPoints: 100,
      gradeBoundaries: [
        { grade: 1, minPercentage: 90, displayValue: '1' },
        { grade: 2, minPercentage: 80, displayValue: '2' },
        { grade: 3, minPercentage: 70, displayValue: '3' },
        { grade: 4, minPercentage: 60, displayValue: '4' },
        { grade: 5, minPercentage: 50, displayValue: '5' },
        { grade: 6, minPercentage: 0, displayValue: '6' }
      ],
      roundingRule: { type: 'nearest', decimalPlaces: 1 },
      errorPointsToGrade: false,
      customizable: true,
      modifiedAfterCorrection: false
    };

    it('should calculate points needed to reach next grade', () => {
      const result = GradingKeyService.pointsToNextGrade(75, gradingKey);
      // 75% = grade 3, need 80% for grade 2 = 5 more points
      expect(result).toBeGreaterThan(0);
    });

    it('should return 0 when already at highest grade', () => {
      const result = GradingKeyService.pointsToNextGrade(95, gradingKey);
      expect(result).toBe(0);
    });
  });

  describe('GERMAN_1_6_PRESET', () => {
    it('should have correct structure', () => {
      expect(GERMAN_1_6_PRESET.system).toBe('german-1-6');
      expect(GERMAN_1_6_PRESET.boundaries).toHaveLength(6);
      expect(GERMAN_1_6_PRESET.boundaries[0].grade).toBe(1);
      expect(GERMAN_1_6_PRESET.boundaries[5].grade).toBe(6);
      expect(GERMAN_1_6_PRESET.boundaries[0].minPercentage).toBe(96);
      expect(GERMAN_1_6_PRESET.boundaries[4].minPercentage).toBe(16);
    });
  });

  describe('generatePointsBoundaries', () => {
    it('should assign grade 1 for a perfect score via points-based grading', () => {
      const pointsBoundaries = GradingKeyService.generatePointsBoundaries(GERMAN_1_6_PRESET, 100);
      const pointsKey: Exams.GradingKey = {
        id: 'pts-key',
        name: 'Points Key',
        type: Exams.GradingKeyType.Points,
        totalPoints: 100,
        gradeBoundaries: pointsBoundaries,
        roundingRule: { type: 'nearest', decimalPlaces: 1 },
        errorPointsToGrade: false,
        customizable: true,
        modifiedAfterCorrection: false
      };
      const result = GradingKeyService.calculateGrade(100, pointsKey);
      expect(result.grade).toBe('1');
    });
  });

  describe('GERMAN_0_15_PRESET', () => {
    it('should have correct structure', () => {
      expect(GERMAN_0_15_PRESET.system).toBe('german-0-15');
      expect(GERMAN_0_15_PRESET.boundaries).toHaveLength(16);
      expect(GERMAN_0_15_PRESET.boundaries[0].grade).toBe(15);
      expect(GERMAN_0_15_PRESET.boundaries[15].grade).toBe(0);
      expect(GERMAN_0_15_PRESET.boundaries[12].minPercentage).toBe(33);
    });
  });

  describe('KBR_GRADING_PRESETS', () => {
    it('should expose both KBR presets for the UI', () => {
      expect(KBR_GRADING_PRESETS.map((preset) => preset.id)).toEqual([
        'german-1-6-sekundarstufe-1',
        'german-0-15-gymnasiale-oberstufe'
      ]);
    });
  });
});
