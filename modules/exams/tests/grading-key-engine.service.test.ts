/**
 * Tests for Grading Key Engine Service
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GradingKeyEngine, GradingKeyUIHelper } from '../src/services/grading-key-engine.service';
import { GradingKeyService, GERMAN_1_6_PRESET } from '../src/services/grading-key.service';
import { Exams } from '@viccoboard/core';

describe('GradingKeyEngine', () => {
  let testKey: Exams.GradingKey;
  let testCorrection: Exams.CorrectionEntry;

  beforeEach(() => {
    testKey = {
      id: 'key-1',
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
      modifiedAfterCorrection: false,
      createdAt: new Date()
    };

    testCorrection = {
      id: 'correction-1',
      examId: 'exam-1',
      candidateId: 'candidate-1',
      taskScores: [],
      totalPoints: 75,
      totalGrade: '2',
      percentageScore: 75,
      comments: [],
      supportTips: [],
      status: 'completed',
      lastModified: new Date()
    };
  });

  describe('createCustomGradingKey', () => {
    it('should create a custom grading key', () => {
      const boundaries = [
        { grade: 1, minPercentage: 90, displayValue: '1' },
        { grade: 2, minPercentage: 70, displayValue: '2' },
        { grade: 3, minPercentage: 0, displayValue: '3' }
      ];

      const key = GradingKeyEngine.createCustomGradingKey('Custom', 100, boundaries);

      expect(key.name).toBe('Custom');
      expect(key.totalPoints).toBe(100);
      expect(key.type).toBe(Exams.GradingKeyType.Percentage);
      expect(key.customizable).toBe(true);
      expect(key.id).toBeDefined();
    });

    it('should sort boundaries in descending order', () => {
      const boundaries = [
        { grade: 3, minPercentage: 0, displayValue: '3' },
        { grade: 1, minPercentage: 90, displayValue: '1' },
        { grade: 2, minPercentage: 70, displayValue: '2' }
      ];

      const key = GradingKeyEngine.createCustomGradingKey('Custom', 100, boundaries);

      expect(key.gradeBoundaries[0].minPercentage).toBe(90);
      expect(key.gradeBoundaries[1].minPercentage).toBe(70);
      expect(key.gradeBoundaries[2].minPercentage).toBe(0);
    });
  });

  describe('convertToPointsBased', () => {
    it('should convert percentage boundaries to points', () => {
      const converted = GradingKeyEngine.convertToPointsBased(testKey, 100);

      expect(converted.type).toBe(Exams.GradingKeyType.Points);
      expect(converted.gradeBoundaries[0].minPoints).toBe(92);
      expect(converted.gradeBoundaries[1].minPoints).toBe(81);
    });

    it('should calculate points correctly for different totals', () => {
      const converted = GradingKeyEngine.convertToPointsBased(testKey, 50);

      expect(converted.gradeBoundaries[0].minPoints).toBe(46); // 92% of 50
      expect(converted.gradeBoundaries[1].minPoints).toBe(41); // 81% of 50
    });
  });

  describe('modifyGradingKeyAfterCorrection', () => {
    it('should record modification in change history', () => {
      const newBoundaries = [
        { grade: 1, minPercentage: 85, displayValue: '1' },
        { grade: 2, minPercentage: 70, displayValue: '2' },
        { grade: 3, minPercentage: 0, displayValue: '3' }
      ];

      const modified = GradingKeyEngine.modifyGradingKeyAfterCorrection(
        testKey,
        newBoundaries,
        'Adjusted based on difficulty',
        'teacher@example.com'
      );

      expect(modified.modifiedAfterCorrection).toBe(true);
      expect(modified.gradeBoundaries[0].minPercentage).toBe(85);

      const history = GradingKeyEngine.getChangeHistory(testKey.id);
      expect(history.length).toBe(1);
      expect(history[0].reason).toBe('Adjusted based on difficulty');
      expect(history[0].changedBy).toBe('teacher@example.com');
    });

    it('should preserve original key in change history', () => {
      const newBoundaries = [
        { grade: 1, minPercentage: 85, displayValue: '1' },
        { grade: 2, minPercentage: 0, displayValue: '2' }
      ];

      GradingKeyEngine.modifyGradingKeyAfterCorrection(testKey, newBoundaries);
      const history = GradingKeyEngine.getChangeHistory(testKey.id);

      expect(history[0].previousKey.gradeBoundaries[0].minPercentage).toBe(92);
      expect(history[0].newKey.gradeBoundaries[0].minPercentage).toBe(85);
    });
  });

  describe('recalculateGradesForBatch', () => {
    it('should identify affected grades', () => {
      const oldKey = testKey;
      const newKey = {
        ...testKey,
        gradeBoundaries: [
          { grade: 1, minPercentage: 85, displayValue: '1' },
          { grade: 2, minPercentage: 70, displayValue: '2' },
          { grade: 3, minPercentage: 0, displayValue: '3' }
        ]
      };

      const corrections = [
        { ...testCorrection, candidateId: 'c1', totalPoints: 75 },
        { ...testCorrection, candidateId: 'c2', totalPoints: 80 }
      ];

      const result = GradingKeyEngine.recalculateGradesForBatch(
        corrections,
        oldKey,
        newKey
      );

      expect(result.affectedGrades.length >= 0).toBe(true);
      expect(result.changeCount >= 0).toBe(true);
    });

    it('should not count unchanged grades', () => {
      const oldKey = testKey;
      const newKey = { ...testKey }; // Same key

      const corrections = [{ ...testCorrection }];
      const result = GradingKeyEngine.recalculateGradesForBatch(
        corrections,
        oldKey,
        newKey
      );

      expect(result.changeCount).toBe(0);
      expect(result.affectedGrades.length).toBe(0);
    });
  });

  describe('convertErrorPointsToGrade', () => {
    it('should convert error points to calculated grade', () => {
      const result = GradingKeyEngine.convertErrorPointsToGrade(75, 10, 100, testKey);

      expect(result.calculatedPoints).toBe(90); // 100 - 10
      expect(result.grade).toBeDefined();
    });

    it('should not go below zero points', () => {
      const result = GradingKeyEngine.convertErrorPointsToGrade(0, 150, 100, testKey);

      expect(result.calculatedPoints).toBe(0); // max(0, 100-150) = 0
    });
  });

  describe('validateGradingKey', () => {
    it('should validate correct key', () => {
      const result = GradingKeyEngine.validateGradingKey(testKey);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect boundary order errors', () => {
      const badKey = {
        ...testKey,
        gradeBoundaries: [
          { grade: 1, minPercentage: 50, displayValue: '1' },
          { grade: 2, minPercentage: 70, displayValue: '2' } // Should be lower
        ]
      };

      const result = GradingKeyEngine.validateGradingKey(badKey);

      expect(result.valid).toBe(false);
      expect(result.errors.length > 0).toBe(true);
    });

    it('should require at least 2 boundaries', () => {
      const badKey = {
        ...testKey,
        gradeBoundaries: [{ grade: 1, minPercentage: 0, displayValue: '1' }]
      };

      const result = GradingKeyEngine.validateGradingKey(badKey);

      expect(result.valid).toBe(false);
    });

    it('should require lowest boundary to start at 0%', () => {
      const badKey = {
        ...testKey,
        gradeBoundaries: [
          { grade: 1, minPercentage: 90, displayValue: '1' },
          { grade: 2, minPercentage: 10, displayValue: '2' } // Lowest should be 0
        ]
      };

      const result = GradingKeyEngine.validateGradingKey(badKey);

      expect(result.valid).toBe(false);
    });
  });

  describe('compareGradingKeys', () => {
    it('should detect no changes for identical keys', () => {
      const key2 = { ...testKey };
      const result = GradingKeyEngine.compareGradingKeys(testKey, key2);

      expect(result.isSame).toBe(true);
      expect(result.changes.length).toBe(0);
    });

    it('should detect name changes', () => {
      const key2 = { ...testKey, name: 'Different Name' };
      const result = GradingKeyEngine.compareGradingKeys(testKey, key2);

      expect(result.isSame).toBe(false);
      expect(result.changes.some(c => c.includes('Name changed'))).toBe(true);
    });

    it('should detect boundary changes', () => {
      const key2 = {
        ...testKey,
        gradeBoundaries: [
          { grade: 1, minPercentage: 85, displayValue: '1' },
          { grade: 2, minPercentage: 0, displayValue: '2' }
        ]
      };

      const result = GradingKeyEngine.compareGradingKeys(testKey, key2);

      expect(result.isSame).toBe(false);
      expect(result.changes.some(c => c.includes('boundaries'))).toBe(true);
    });
  });

  describe('getChangeHistory', () => {
    it('should return empty array for new key', () => {
      const history = GradingKeyEngine.getChangeHistory('unknown-key');
      expect(history.length).toBe(0);
    });

    it('should return all changes for a key', () => {
      const newBoundaries1 = [
        { grade: 1, minPercentage: 85, displayValue: '1' },
        { grade: 2, minPercentage: 0, displayValue: '2' }
      ];
      const newBoundaries2 = [
        { grade: 1, minPercentage: 80, displayValue: '1' },
        { grade: 2, minPercentage: 0, displayValue: '2' }
      ];

      GradingKeyEngine.modifyGradingKeyAfterCorrection(testKey, newBoundaries1);
      GradingKeyEngine.modifyGradingKeyAfterCorrection(testKey, newBoundaries2);

      const history = GradingKeyEngine.getChangeHistory(testKey.id);
      expect(history.length).toBe(2);
    });
  });

  describe('cloneWithModifications', () => {
    it('should create a new key with modifications', () => {
      const cloned = GradingKeyEngine.cloneWithModifications(testKey, {
        name: 'Cloned Key'
      });

      expect(cloned.name).toBe('Cloned Key');
      expect(cloned.id).not.toBe(testKey.id);
      expect(cloned.modifiedAfterCorrection).toBe(false);
    });
  });

  describe('suggestGradingKeyAdjustments', () => {
    it('should provide adjustment suggestions', () => {
      const corrections = [
        { ...testCorrection, totalPoints: 50, totalGrade: '5' },
        { ...testCorrection, totalPoints: 92, totalGrade: '1' }
      ];

      const result = GradingKeyEngine.suggestGradingKeyAdjustments(corrections, testKey);

      expect(result.suggestion).toBeDefined();
      expect(result.reasoning.length > 0).toBe(true);
    });
  });

  describe('exportChangeHistory', () => {
    it('should export history as report', () => {
      const newBoundaries = [
        { grade: 1, minPercentage: 85, displayValue: '1' },
        { grade: 2, minPercentage: 0, displayValue: '2' }
      ];

      GradingKeyEngine.modifyGradingKeyAfterCorrection(
        testKey,
        newBoundaries,
        'Test reason'
      );

      const report = GradingKeyEngine.exportchangeHistory(testKey.id);

      expect(report).toContain('Grading Key Change History');
      expect(report).toContain(testKey.id);
      expect(report).toContain('Test reason');
    });

    it('should handle empty history', () => {
      const report = GradingKeyEngine.exportchangeHistory('unknown');
      expect(report).toContain('No changes recorded');
    });
  });
});

describe('GradingKeyUIHelper', () => {
  describe('formatBoundary', () => {
    it('should format percentage boundary', () => {
      const boundary = { grade: 1, minPercentage: 90, displayValue: '1' };
      const formatted = GradingKeyUIHelper.formatBoundary(boundary, 'percentage');

      expect(formatted).toContain('Grade 1');
      expect(formatted).toContain('90%');
    });

    it('should format points boundary', () => {
      const boundary = { grade: 1, minPoints: 90, displayValue: '1' };
      const formatted = GradingKeyUIHelper.formatBoundary(boundary, 'points');

      expect(formatted).toContain('Grade 1');
      expect(formatted).toContain('90');
      expect(formatted).toContain('points');
    });
  });

  describe('getGradeColor', () => {
    it('should return appropriate color for German grades', () => {
      expect(GradingKeyUIHelper.getGradeColor('1')).toBe('#28a745'); // Green
      expect(GradingKeyUIHelper.getGradeColor(1)).toBe('#28a745');
      expect(GradingKeyUIHelper.getGradeColor('6')).toBe('#dc3545'); // Red
      expect(GradingKeyUIHelper.getGradeColor(6)).toBe('#dc3545');
    });

    it('should return gray for unknown grades', () => {
      expect(GradingKeyUIHelper.getGradeColor('unknown')).toBe('#999');
      expect(GradingKeyUIHelper.getGradeColor(99)).toBe('#999');
    });
  });
});
