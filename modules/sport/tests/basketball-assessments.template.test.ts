import { Sport } from '@viccoboard/core';
import {
  BASKETBALL_ASSESSMENTS,
  evaluateBasketballAssessment,
  findBasketballAssessment
} from '../src/templates/basketball-assessments.template';

const passing = BASKETBALL_ASSESSMENTS[0];
const dribbling = BASKETBALL_ASSESSMENTS[1];

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
    expect(evaluateBasketballAssessment(passing, passingScores(points as number[]))?.grade).toBe(grade);
  });

  test('does not invent a grade for 0–2 points', () => {
    const result = evaluateBasketballAssessment(passing, passingScores([1, 1, 0, 0, 0, 0, 0]));
    expect(result).toMatchObject({ totalPoints: 2, maxPoints: 16 });
    expect(result?.grade).toBeUndefined();
  });

  test('rejects incomplete or invalid score combinations', () => {
    expect(evaluateBasketballAssessment(passing, {})).toBeNull();
    expect(evaluateBasketballAssessment(passing, passingScores([2, 2, 2, 2, 2, 2, 3]))).toBeNull();
  });

  test('dribbling note is a qualitative grade, not a sum of points', () => {
    expect(evaluateBasketballAssessment(dribbling, { 'bb-d-dribbling-rating': 1 })?.grade).toBe('1');
    expect(evaluateBasketballAssessment(dribbling, { 'bb-d-dribbling-rating': 5 })?.grade).toBe('5');
    expect(evaluateBasketballAssessment(dribbling, { 'bb-d-dribbling-rating': 6 })).toBeNull();
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
    expect(findBasketballAssessment(rubric)?.id).toBe(passing.id);
    const config = rubric.configuration as Sport.CriteriaGradingConfig;
    expect(findBasketballAssessment({
      ...rubric, configuration: { ...config, criteria: config.criteria.slice(1) }
    })).toBeUndefined();
  });
});
