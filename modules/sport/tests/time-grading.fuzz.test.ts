import fc from 'fast-check';

import { TimeGradingService } from '../src/services/time-grading.service';

describe('TimeGradingService property-based fuzzing', () => {
  const service = new TimeGradingService();

  test('is monotonic for numeric default configs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 600 }),
        fc.integer({ min: 1, max: 600 }),
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        (bestTime, spread, ratioA, ratioB) => {
          const worstTime = bestTime + spread;
          const bestGrade = 1;
          const worstGrade = 6;
          const config = service.createDefaultConfig(bestTime, worstTime, bestGrade, worstGrade);

          const lowerRatio = Math.min(ratioA, ratioB);
          const upperRatio = Math.max(ratioA, ratioB);
          const timeA = bestTime + lowerRatio * spread;
          const timeB = bestTime + upperRatio * spread;

          const gradeA = service.calculateGrade({ timeInSeconds: timeA, config }).grade;
          const gradeB = service.calculateGrade({ timeInSeconds: timeB, config }).grade;

          expect(typeof gradeA).toBe('number');
          expect(typeof gradeB).toBe('number');

          const numA = gradeA as number;
          const numB = gradeB as number;
          const epsilon = 1e-9;

          expect(numA).toBeGreaterThanOrEqual(bestGrade - epsilon);
          expect(numB).toBeLessThanOrEqual(worstGrade + epsilon);
          expect(numA).toBeLessThanOrEqual(numB + epsilon);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('clamps values outside configured boundaries', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 600 }),
        fc.integer({ min: 1, max: 600 }),
        fc.integer({ min: 1, max: 600 }),
        fc.integer({ min: 1, max: 600 }),
        (bestTime, spread, earlyOffset, lateOffset) => {
          const worstTime = bestTime + spread;
          const bestGrade = 1;
          const worstGrade = 6;
          const config = service.createDefaultConfig(bestTime, worstTime, bestGrade, worstGrade);

          const early = service.calculateGrade({
            timeInSeconds: bestTime - earlyOffset,
            config
          }).grade;

          const late = service.calculateGrade({
            timeInSeconds: worstTime + lateOffset,
            config
          }).grade;

          expect(early).toBe(bestGrade);
          expect(late).toBe(worstGrade);
        }
      ),
      { numRuns: 120 }
    );
  });
});