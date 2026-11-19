import { Sport } from '@viccoboard/core';
import {
  SPORT_ASSESSMENTS,
  evaluateSportAssessment,
  findSportAssessment
} from '../src/templates/sport-assessments.template';

const passing = SPORT_ASSESSMENTS[0];
const dribbling = SPORT_ASSESSMENTS[1];

function passingScores(points: number[]): Record<string, number> {
  return Object.fromEntries(passing.criteria.map((criterion, index) => [criterion.id, points[index]]));
}

describe('LISUM-Basketballvorlagen, Niveaustufe D', () => {
  test.each([
    [[2, 2, 2, 2, 2, 2, 4], '1'],
    [[2, 2, 2, 2, 2, 1, 2], '2'],
    [[2, 2, 2, 2, 1, 1, 0], '3'],
    [[1, 1, 1, 1, 1, 0, 2], '4'],
    [[1, 1, 1, 0, 0, 0, 0], '5']
  ])('uses the printed passing thresholds', (points, grade) => {
    expect(evaluateSportAssessment(passing, passingScores(points as number[]))?.grade).toBe(grade);
  });

  test('does not invent a grade for 0–2 points', () => {
    const result = evaluateSportAssessment(passing, passingScores([1, 1, 0, 0, 0, 0, 0]));
    expect(result).toMatchObject({ totalPoints: 2, maxPoints: 16 });
    expect(result?.grade).toBeUndefined();
  });

  test('rejects incomplete or invalid score combinations', () => {
    expect(evaluateSportAssessment(passing, {})).toBeNull();
    expect(evaluateSportAssessment(passing, passingScores([2, 2, 2, 2, 2, 2, 3]))).toBeNull();
  });

  test('dribbling note is a qualitative grade, not a sum of points', () => {
    expect(evaluateSportAssessment(dribbling, { 'bb-d-dribbling-rating': 1 })?.grade).toBe('1');
    expect(evaluateSportAssessment(dribbling, { 'bb-d-dribbling-rating': 5 })?.grade).toBe('5');
    expect(evaluateSportAssessment(dribbling, { 'bb-d-dribbling-rating': 6 })).toBeNull();
  });

  test('recognizes the unchanged rubric, but not a modified one', () => {
    const rubric: Sport.GradeCategory = {
      id: 'cat', classGroupId: 'class', name: passing.title, description: passing.sourceId,
      type: Sport.GradeCategoryType.Criteria, weight: 0,
      configuration: {
        type: 'criteria', allowSelfAssessment: false, selfAssessmentViaWOW: false,
        criteria: passing.criteria.map((criterion) => ({
          id: criterion.id, name: criterion.name, description: criterion.description,
          minValue: criterion.choices[0],
          maxValue: criterion.choices[criterion.choices.length - 1], weight: 1
        }))
      },
      createdAt: new Date(), lastModified: new Date()
    };
    expect(findSportAssessment(rubric)?.id).toBe(passing.id);
    const config = rubric.configuration as Sport.CriteriaGradingConfig;
    expect(findSportAssessment({
      ...rubric, configuration: { ...config, criteria: config.criteria.slice(1) }
    })).toBeUndefined();
  });
});

describe('Weitere Leistungsabnahmen aus der Handreichung', () => {
  const shooting = SPORT_ASSESSMENTS.find((item) => item.id === 'shooting-d')!;
  const tactics = SPORT_ASSESSMENTS.find((item) => item.id === 'tactics-d')!;
  const serveEF = SPORT_ASSESSMENTS.find((item) => item.id === 'volleyball-serve-ef')!;
  const serveGH = SPORT_ASSESSMENTS.find((item) => item.id === 'volleyball-serve-gh')!;

  test('ten basketball shots preserve the ring/basket distinction without inventing a grade for D', () => {
    const scores = Object.fromEntries(shooting.criteria.map((criterion, index) => [criterion.id, index < 5 ? 2 : 1]));
    const result = evaluateSportAssessment(shooting, scores);
    expect(result).toMatchObject({ totalPoints: 15, maxPoints: 20, percentage: 75 });
    expect(result?.grade).toBeUndefined();
    expect(evaluateSportAssessment(shooting, { ...scores, [shooting.criteria[0].id]: 3 })).toBeNull();
  });

  test('qualitative basketball tactics retain the full grading scale', () => {
    expect(evaluateSportAssessment(tactics, { 'bb-d-tactics-rating': 1 })?.grade).toBe('1');
    expect(evaluateSportAssessment(tactics, { 'bb-d-tactics-rating': 5 })?.grade).toBe('5');
  });

  test.each([
    [0, '6'], [1, '6'], [2, '5'], [3, '5'], [4, '4'], [5, '3'],
    [6, '3'], [7, '2'], [8, '2'], [9, '1'], [10, '1']
  ])('volleyball E/F assigns %s successes to grade %s, table 48', (hits, grade) => {
    const scores = Object.fromEntries(serveEF.criteria.map((criterion, index) => [criterion.id, index < hits ? 1 : 0]));
    expect(evaluateSportAssessment(serveEF, scores)?.grade).toBe(grade);
  });

  test('volleyball G/H distinguishes five straight and five diagonal serves', () => {
    expect(serveGH.criteria).toHaveLength(10);
    expect(serveGH.criteria[0].name).toContain('gerade');
    expect(serveGH.criteria[9].name).toContain('diagonal');
    const all = Object.fromEntries(serveGH.criteria.map((criterion) => [criterion.id, 1]));
    expect(evaluateSportAssessment(serveGH, all)).toMatchObject({ totalPoints: 10, grade: '1' });
  });
});
