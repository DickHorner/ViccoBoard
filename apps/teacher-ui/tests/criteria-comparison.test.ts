import type { Sport } from '@viccoboard/core'
import { compareCriterionScores } from '../src/utils/criteria-comparison'

const criteria: Sport.Criterion[] = [
  { id: 'effort', name: 'Anstrengung', minValue: 0, maxValue: 3, weight: 1 },
  { id: 'cooperation', name: 'Zusammenarbeit', minValue: 0, maxValue: 3, weight: 1 },
  { id: 'initiative', name: 'Eigeninitiative', minValue: 1, maxValue: 5, weight: 1 }
]

describe('criteria self/teacher comparison', () => {
  test('compares all criteria and marks matching values with zero difference', () => {
    const rows = compareCriterionScores(
      criteria,
      { effort: 3, cooperation: 2, initiative: 4 },
      { effort: 2, cooperation: 2, initiative: 5 }
    )

    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({ selfRatio: 1, teacherRatio: 2 / 3, difference: 1 })
    expect(rows[1]).toMatchObject({ difference: 0, selfRatio: 2 / 3, teacherRatio: 2 / 3 })
    expect(rows[2]).toMatchObject({ selfRatio: 0.75, teacherRatio: 1, difference: -1 })
  })

  test('rejects an incomplete self assessment rather than interpreting missing as zero', () => {
    expect(() => compareCriterionScores(
      criteria,
      { effort: 0, cooperation: 1 },
      { effort: 2, cooperation: 2, initiative: 3 }
    )).toThrow('Eigeninitiative')
  })

  test('rejects out-of-range scores', () => {
    expect(() => compareCriterionScores(
      criteria,
      { effort: 4, cooperation: 2, initiative: 3 },
      { effort: 2, cooperation: 2, initiative: 3 }
    )).toThrow('Anstrengung')
  })

  test('rejects a criterion with an invalid scoring range', () => {
    expect(() => compareCriterionScores(
      [{ id: 'bad', name: 'Ungültig', minValue: 3, maxValue: 3, weight: 1 }],
      { bad: 3 },
      { bad: 3 }
    )).toThrow('Ungültig')
  })
})
