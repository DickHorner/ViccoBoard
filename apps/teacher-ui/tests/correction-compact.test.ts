/**
 * P6-2: Compact Correction UI — Logic Tests
 *
 * Tests the core computations used in CorrectionCompact.vue:
 * - totalPoints aggregation from task scores
 * - percentageScore calculation
 * - pointsToNextGrade boundary math
 * - alternativeGrading → numeric points conversion
 */

import { describe, it, expect } from '@jest/globals';

// -----------------------------------------------------------------------
// Inline types (mirrors Exams.AlternativeGrading['type'])
// -----------------------------------------------------------------------

type AlternativeGradeOption = '++' | '+' | '0' | '-' | '--';

interface GradeBoundary {
  grade: number | string;
  minPercentage?: number;
  displayValue: string;
}

// -----------------------------------------------------------------------
// Helpers: mirror computations in CorrectionCompact.vue
// -----------------------------------------------------------------------

function calcTotalPoints(taskScores: Record<string, number>, taskIds: string[]): number {
  return taskIds.reduce((sum, id) => sum + (taskScores[id] || 0), 0);
}

function calcPercentageScore(total: number, max: number): number {
  return max > 0 ? (total / max) * 100 : 0;
}

function alternativeToPoints(maxPoints: number, option: AlternativeGradeOption): number {
  switch (option) {
    case '++': return maxPoints;
    case '+':  return maxPoints * 0.75;
    case '0':  return maxPoints * 0.5;
    case '-':  return maxPoints * 0.25;
    case '--': return 0;
    default:   return 0;
  }
}

/**
 * Mirror of GradingKeyService.pointsToNextGrade for percentage-based keys.
 * Used in pointsToNextGrade computed in CorrectionCompact.vue.
 */
function pointsToNextGradeCalc(
  currentPoints: number,
  totalPoints: number,
  boundaries: GradeBoundary[],
): number {
  const currentPct = calcPercentageScore(currentPoints, totalPoints);
  const sorted = [...boundaries].sort((a, b) => (a.minPercentage ?? 0) - (b.minPercentage ?? 0));
  const next = sorted.find(b => (b.minPercentage ?? 0) > currentPct);
  if (!next) return 0;
  const nextMinPts = ((next.minPercentage ?? 0) / 100) * totalPoints;
  return Math.max(Math.ceil(nextMinPts - currentPoints), 0);
}

// -----------------------------------------------------------------------
// Tests: totalPoints aggregation
// -----------------------------------------------------------------------

describe('CorrectionCompact — totalPoints', () => {
  it('sums all task scores', () => {
    const scores = { 'task-1': 8, 'task-2': 12.5, 'task-3': 5 };
    expect(calcTotalPoints(scores, ['task-1', 'task-2', 'task-3'])).toBeCloseTo(25.5);
  });

  it('treats missing entries as 0', () => {
    expect(calcTotalPoints({ 'task-1': 10 }, ['task-1', 'task-2'])).toBe(10);
  });

  it('returns 0 for empty score map', () => {
    expect(calcTotalPoints({}, ['task-1', 'task-2'])).toBe(0);
  });
});

// -----------------------------------------------------------------------
// Tests: percentageScore
// -----------------------------------------------------------------------

describe('CorrectionCompact — percentageScore', () => {
  it('calculates 80% for 20/25', () => {
    expect(calcPercentageScore(20, 25)).toBeCloseTo(80);
  });

  it('returns 0 when max is 0 (guards division by zero)', () => {
    expect(calcPercentageScore(10, 0)).toBe(0);
  });

  it('returns 100 for full marks', () => {
    expect(calcPercentageScore(50, 50)).toBe(100);
  });
});

// -----------------------------------------------------------------------
// Tests: alternativeGrading → numeric points
// -----------------------------------------------------------------------

describe('CorrectionCompact — alternativeToPoints', () => {
  const max = 20;

  it('++ maps to full points', ()  => expect(alternativeToPoints(max, '++')).toBe(20));
  it('+  maps to 75%',           ()  => expect(alternativeToPoints(max, '+')).toBe(15));
  it('0  maps to 50%',           ()  => expect(alternativeToPoints(max, '0')).toBe(10));
  it('-  maps to 25%',           ()  => expect(alternativeToPoints(max, '-')).toBe(5));
  it('-- maps to 0',             ()  => expect(alternativeToPoints(max, '--')).toBe(0));
});

// -----------------------------------------------------------------------
// Tests: pointsToNextGrade (boundary math for real-time grade display)
// -----------------------------------------------------------------------

describe('CorrectionCompact — pointsToNextGrade', () => {
  const boundaries: GradeBoundary[] = [
    { grade: 1, minPercentage: 92, displayValue: '1' },
    { grade: 2, minPercentage: 81, displayValue: '2' },
    { grade: 3, minPercentage: 70, displayValue: '3' },
    { grade: 4, minPercentage: 60, displayValue: '4' },
    { grade: 5, minPercentage: 50, displayValue: '5' },
    { grade: 6, minPercentage: 0,  displayValue: '6' },
  ];
  const total = 100;

  it('at 85 pts needs 7 pts to reach grade 1 (92% threshold)', () => {
    // 92% of 100 = 92; 92 - 85 = 7
    expect(pointsToNextGradeCalc(85, total, boundaries)).toBe(7);
  });

  it('at 92 pts (already grade 1) returns 0', () => {
    expect(pointsToNextGradeCalc(92, total, boundaries)).toBe(0);
  });

  it('at 60 pts needs 10 pts to reach grade 3 (70% threshold)', () => {
    // 70% of 100 = 70; 70 - 60 = 10
    expect(pointsToNextGradeCalc(60, total, boundaries)).toBe(10);
  });

  it('at 0 pts needs 50 pts to reach grade 5 (50% threshold)', () => {
    expect(pointsToNextGradeCalc(0, total, boundaries)).toBe(50);
  });
});

