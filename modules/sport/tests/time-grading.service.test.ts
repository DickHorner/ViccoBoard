/**
 * TimeGradingService Tests
 * Tests for time-based grading with linear mapping
 */

import { TimeGradingService } from '../src/services/time-grading.service';
import { Sport} from '@viccoboard/core';

type TimeGradingConfig = Sport.TimeGradingConfig;

describe('TimeGradingService', () => {
  let service: TimeGradingService;

  beforeEach(() => {
    service = new TimeGradingService();
  });

  describe('createDefaultConfig', () => {
    test('creates a valid configuration', () => {
      const config = service.createDefaultConfig(60, 120, 1, 6);

      expect(config.type).toBe('time');
      expect(config.bestGrade).toBe(1);
      expect(config.worstGrade).toBe(6);
      expect(config.linearMapping).toBe(true);
      expect(config.adjustableAfterwards).toBe(true);
      expect(config.customBoundaries).toHaveLength(2);
      expect(config.customBoundaries![0]).toEqual({ time: 60, grade: 1 });
      expect(config.customBoundaries![1]).toEqual({ time: 120, grade: 6 });
    });

    test('throws error if best time is greater than or equal to worst time', () => {
      expect(() => service.createDefaultConfig(120, 60, 1, 6)).toThrow(
        'Best time must be less than worst time'
      );
      expect(() => service.createDefaultConfig(100, 100, 1, 6)).toThrow(
        'Best time must be less than worst time'
      );
    });
  });

  describe('validateConfig', () => {
    test('validates a correct configuration', () => {
      const config: TimeGradingConfig = {
        type: 'time',
        bestGrade: 1,
        worstGrade: 6,
        linearMapping: true,
        adjustableAfterwards: true,
        customBoundaries: [
          { time: 60, grade: 1 },
          { time: 120, grade: 6 }
        ]
      };

      expect(service.validateConfig(config)).toBe(true);
    });

    test('throws error for incorrect type', () => {
      const config = {
        type: 'criteria',
        bestGrade: 1,
        worstGrade: 6,
        linearMapping: true,
        adjustableAfterwards: true
      } as any;

      expect(() => service.validateConfig(config)).toThrow('Configuration type must be "time"');
    });

    test('throws error for non-linear mapping', () => {
      const config: TimeGradingConfig = {
        type: 'time',
        bestGrade: 1,
        worstGrade: 6,
        linearMapping: false,
        adjustableAfterwards: true
      };

      expect(() => service.validateConfig(config)).toThrow(
        'Only linear mapping is currently supported'
      );
    });

    test('throws error for missing best grade', () => {
      const config = {
        type: 'time',
        worstGrade: 6,
        linearMapping: true,
        adjustableAfterwards: true
      } as any;

      expect(() => service.validateConfig(config)).toThrow('Best and worst grades must be defined');
    });

    test('throws error for less than 2 boundaries', () => {
      const config: TimeGradingConfig = {
        type: 'time',
        bestGrade: 1,
        worstGrade: 6,
        linearMapping: true,
        adjustableAfterwards: true,
        customBoundaries: [{ time: 60, grade: 1 }]
      };

      expect(() => service.validateConfig(config)).toThrow('At least 2 boundaries are required');
    });

    test('throws error for duplicate times', () => {
      const config: TimeGradingConfig = {
        type: 'time',
        bestGrade: 1,
        worstGrade: 6,
        linearMapping: true,
        adjustableAfterwards: true,
        customBoundaries: [
          { time: 60, grade: 1 },
          { time: 60, grade: 3 },
          { time: 120, grade: 6 }
        ]
      };

      expect(() => service.validateConfig(config)).toThrow('Boundary times must be unique');
    });

    test('throws error for negative time values', () => {
      const config: TimeGradingConfig = {
        type: 'time',
        bestGrade: 1,
        worstGrade: 6,
        linearMapping: true,
        adjustableAfterwards: true,
        customBoundaries: [
          { time: -10, grade: 1 },
          { time: 120, grade: 6 }
        ]
      };

      expect(() => service.validateConfig(config)).toThrow('Time values must be non-negative');
    });
  });

  describe('calculateGrade', () => {
    describe('with two boundaries (simple linear mapping)', () => {
      let config: TimeGradingConfig;

      beforeEach(() => {
        // German grading system: 1 (best) to 6 (worst)
        // Best time: 60 seconds = grade 1
        // Worst time: 120 seconds = grade 6
        config = service.createDefaultConfig(60, 120, 1, 6);
      });

      test('returns best grade for time equal to best boundary', () => {
        const result = service.calculateGrade({ timeInSeconds: 60, config });

        expect(result.grade).toBe(1);
        expect(result.timeInSeconds).toBe(60);
        expect(result.bestTime).toBe(60);
        expect(result.worstTime).toBe(120);
      });

      test('returns best grade for time better than best boundary', () => {
        const result = service.calculateGrade({ timeInSeconds: 55, config });

        expect(result.grade).toBe(1);
        expect(result.timeInSeconds).toBe(55);
      });

      test('returns worst grade for time equal to worst boundary', () => {
        const result = service.calculateGrade({ timeInSeconds: 120, config });

        expect(result.grade).toBe(6);
        expect(result.timeInSeconds).toBe(120);
      });

      test('returns worst grade for time worse than worst boundary', () => {
        const result = service.calculateGrade({ timeInSeconds: 130, config });

        expect(result.grade).toBe(6);
        expect(result.timeInSeconds).toBe(130);
      });

      test('calculates correct grade for time in the middle', () => {
        const result = service.calculateGrade({ timeInSeconds: 90, config });

        // 90s is exactly halfway between 60s and 120s
        // Grade should be halfway between 1 and 6 = 3.5
        expect(result.grade).toBe(3.5);
        expect(result.timeInSeconds).toBe(90);
      });

      test('calculates correct grade for time at 25% point', () => {
        const result = service.calculateGrade({ timeInSeconds: 75, config });

        // 75s is 25% of the way from 60s to 120s
        // Grade should be 1 + 0.25 * (6 - 1) = 1 + 1.25 = 2.25
        expect(result.grade).toBe(2.25);
      });

      test('calculates correct grade for time at 75% point', () => {
        const result = service.calculateGrade({ timeInSeconds: 105, config });

        // 105s is 75% of the way from 60s to 120s
        // Grade should be 1 + 0.75 * (6 - 1) = 1 + 3.75 = 4.75
        expect(result.grade).toBe(4.75);
      });
    });

    describe('with multiple boundaries', () => {
      let config: TimeGradingConfig;

      beforeEach(() => {
        // German grading system with intermediate boundaries
        config = {
          type: 'time',
          bestGrade: 1,
          worstGrade: 6,
          linearMapping: true,
          adjustableAfterwards: true,
          customBoundaries: [
            { time: 60, grade: 1 },
            { time: 80, grade: 2 },
            { time: 100, grade: 4 },
            { time: 120, grade: 6 }
          ]
        };
      });

      test('returns grade from first segment', () => {
        // Time between 60 and 80 seconds
        const result = service.calculateGrade({ timeInSeconds: 70, config });

        // 70s is 50% between 60s and 80s
        // Grade should be 1 + 0.5 * (2 - 1) = 1.5
        expect(result.grade).toBe(1.5);
      });

      test('returns grade from middle segment', () => {
        // Time between 80 and 100 seconds
        const result = service.calculateGrade({ timeInSeconds: 90, config });

        // 90s is 50% between 80s and 100s
        // Grade should be 2 + 0.5 * (4 - 2) = 3
        expect(result.grade).toBe(3);
      });

      test('returns grade from last segment', () => {
        // Time between 100 and 120 seconds
        const result = service.calculateGrade({ timeInSeconds: 110, config });

        // 110s is 50% between 100s and 120s
        // Grade should be 4 + 0.5 * (6 - 4) = 5
        expect(result.grade).toBe(5);
      });

      test('returns exact boundary grade', () => {
        const result = service.calculateGrade({ timeInSeconds: 80, config });

        expect(result.grade).toBe(2);
      });
    });

    describe('with string grades', () => {
      let config: TimeGradingConfig;

      beforeEach(() => {
        config = {
          type: 'time',
          bestGrade: '1.0',
          worstGrade: '6.0',
          linearMapping: true,
          adjustableAfterwards: true,
          customBoundaries: [
            { time: 60, grade: '1.0' },
            { time: 120, grade: '6.0' }
          ]
        };
      });

      test('parses string grades as numbers for interpolation', () => {
        const result = service.calculateGrade({ timeInSeconds: 90, config });

        expect(result.grade).toBe(3.5);
      });
    });

    describe('error cases', () => {
      test('throws error for non-linear mapping', () => {
        const config: TimeGradingConfig = {
          type: 'time',
          bestGrade: 1,
          worstGrade: 6,
          linearMapping: false,
          adjustableAfterwards: true
        };

        expect(() => service.calculateGrade({ timeInSeconds: 90, config })).toThrow(
          'Only linear mapping is currently supported'
        );
      });

      test('throws error for missing boundaries', () => {
        const config: TimeGradingConfig = {
          type: 'time',
          bestGrade: 1,
          worstGrade: 6,
          linearMapping: true,
          adjustableAfterwards: true
        };

        expect(() => service.calculateGrade({ timeInSeconds: 90, config })).toThrow(
          'Custom boundaries with time values are required for time-based grading'
        );
      });

      test('throws error for insufficient boundaries', () => {
        const config: TimeGradingConfig = {
          type: 'time',
          bestGrade: 1,
          worstGrade: 6,
          linearMapping: true,
          adjustableAfterwards: true,
          customBoundaries: [{ time: 60, grade: 1 }]
        };

        expect(() => service.calculateGrade({ timeInSeconds: 90, config })).toThrow(
          'At least 2 boundaries (best and worst) are required'
        );
      });
    });
  });

  describe('adjustBoundaries', () => {
    let config: TimeGradingConfig;

    beforeEach(() => {
      config = service.createDefaultConfig(60, 120, 1, 6);
    });

    test('adjusts best time', () => {
      const updatedConfig = service.adjustBoundaries({
        config,
        newBestTime: 55
      });

      expect(updatedConfig.customBoundaries![0].time).toBe(55);
      expect(updatedConfig.customBoundaries![0].grade).toBe(1);
      expect(updatedConfig.customBoundaries![1].time).toBe(120);
    });

    test('adjusts worst time', () => {
      const updatedConfig = service.adjustBoundaries({
        config,
        newWorstTime: 130
      });

      expect(updatedConfig.customBoundaries![0].time).toBe(60);
      expect(updatedConfig.customBoundaries![1].time).toBe(130);
      expect(updatedConfig.customBoundaries![1].grade).toBe(6);
    });

    test('adjusts best grade', () => {
      const updatedConfig = service.adjustBoundaries({
        config,
        newBestGrade: 0.5
      });

      expect(updatedConfig.bestGrade).toBe(0.5);
      expect(updatedConfig.customBoundaries![0].grade).toBe(0.5);
    });

    test('adjusts worst grade', () => {
      const updatedConfig = service.adjustBoundaries({
        config,
        newWorstGrade: 5.5
      });

      expect(updatedConfig.worstGrade).toBe(5.5);
      expect(updatedConfig.customBoundaries![1].grade).toBe(5.5);
    });

    test('adjusts multiple values at once', () => {
      const updatedConfig = service.adjustBoundaries({
        config,
        newBestTime: 55,
        newWorstTime: 125,
        newBestGrade: 0.5,
        newWorstGrade: 5.5
      });

      expect(updatedConfig.bestGrade).toBe(0.5);
      expect(updatedConfig.worstGrade).toBe(5.5);
      expect(updatedConfig.customBoundaries![0]).toEqual({ time: 55, grade: 0.5 });
      expect(updatedConfig.customBoundaries![1]).toEqual({ time: 125, grade: 5.5 });
    });

    test('creates boundaries if none exist', () => {
      const configWithoutBoundaries: TimeGradingConfig = {
        type: 'time',
        bestGrade: 1,
        worstGrade: 6,
        linearMapping: true,
        adjustableAfterwards: true
      };

      const updatedConfig = service.adjustBoundaries({
        config: configWithoutBoundaries,
        newBestTime: 60,
        newWorstTime: 120
      });

      expect(updatedConfig.customBoundaries).toHaveLength(2);
      expect(updatedConfig.customBoundaries![0]).toEqual({ time: 60, grade: 1 });
      expect(updatedConfig.customBoundaries![1]).toEqual({ time: 120, grade: 6 });
    });

    test('does not modify original config', () => {
      const originalBestTime = config.customBoundaries![0].time;
      
      service.adjustBoundaries({
        config,
        newBestTime: 55
      });

      expect(config.customBoundaries![0].time).toBe(originalBestTime);
    });
  });

  describe('sample data scenarios', () => {
    test('100m sprint: German grading system', () => {
      // Sample: 100m sprint times
      // Best: 13.0s = grade 1
      // Worst: 18.0s = grade 6
      const config = service.createDefaultConfig(13.0, 18.0, 1, 6);

      // Test various times
      expect(service.calculateGrade({ timeInSeconds: 12.5, config }).grade).toBe(1); // Better than best
      expect(service.calculateGrade({ timeInSeconds: 13.0, config }).grade).toBe(1); // Best
      expect(service.calculateGrade({ timeInSeconds: 14.0, config }).grade).toBe(2); // 1 + (1/5) * 5 = 2
      expect(service.calculateGrade({ timeInSeconds: 15.5, config }).grade).toBe(3.5); // Middle
      expect(service.calculateGrade({ timeInSeconds: 18.0, config }).grade).toBe(6); // Worst
      expect(service.calculateGrade({ timeInSeconds: 19.0, config }).grade).toBe(6); // Worse than worst
    });

    test('1000m run: percentage grading', () => {
      // Sample: 1000m run
      // Best: 3:20 (200s) = 100%
      // Worst: 5:00 (300s) = 50%
      const config = service.createDefaultConfig(200, 300, 100, 50);

      // Test various times
      expect(service.calculateGrade({ timeInSeconds: 200, config }).grade).toBe(100); // Best
      expect(service.calculateGrade({ timeInSeconds: 250, config }).grade).toBe(75); // Middle
      expect(service.calculateGrade({ timeInSeconds: 300, config }).grade).toBe(50); // Worst
    });

    test('shuttle run with multiple grade boundaries', () => {
      // Sample: shuttle run with specific grade thresholds
      const config: TimeGradingConfig = {
        type: 'time',
        bestGrade: 1,
        worstGrade: 6,
        linearMapping: true,
        adjustableAfterwards: true,
        customBoundaries: [
          { time: 40, grade: 1 },   // Excellent
          { time: 50, grade: 2 },   // Very good
          { time: 60, grade: 3 },   // Good
          { time: 70, grade: 4 },   // Satisfactory
          { time: 80, grade: 5 },   // Sufficient
          { time: 90, grade: 6 }    // Insufficient
        ]
      };

      expect(service.calculateGrade({ timeInSeconds: 40, config }).grade).toBe(1);
      expect(service.calculateGrade({ timeInSeconds: 45, config }).grade).toBe(1.5);
      expect(service.calculateGrade({ timeInSeconds: 55, config }).grade).toBe(2.5);
      expect(service.calculateGrade({ timeInSeconds: 75, config }).grade).toBe(4.5);
      expect(service.calculateGrade({ timeInSeconds: 90, config }).grade).toBe(6);
    });

    test('post-hoc adjustment after grading', () => {
      // Teacher initially sets boundaries
      let config = service.createDefaultConfig(60, 120, 1, 6);

      // Calculate initial grades
      const initialGrade1 = service.calculateGrade({ timeInSeconds: 90, config }).grade;
      expect(initialGrade1).toBe(3.5);

      // Teacher realizes times were too strict, adjusts boundaries
      config = service.adjustBoundaries({
        config,
        newBestTime: 70,
        newWorstTime: 130
      });

      // Same time now gets a better grade
      const adjustedGrade = service.calculateGrade({ timeInSeconds: 90, config }).grade as number;
      // 90 is now 33.3% of the way from 70 to 130
      // Grade = 1 + 0.333 * 5 = 2.67 (approximately)
      expect(adjustedGrade).toBeCloseTo(2.67, 1);
      expect(adjustedGrade).toBeLessThan(initialGrade1 as number);
    });
  });
});
