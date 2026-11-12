import type { Sport } from '@viccoboard/core'

export interface CriterionComparison {
  id: string
  name: string
  minValue: number
  maxValue: number
  selfValue: number
  teacherValue: number
  selfRatio: number
  teacherRatio: number
  difference: number
}

export function compareCriterionScores(
  criteria: Sport.Criterion[],
  selfScores: Record<string, number>,
  teacherScores: Record<string, number>
): CriterionComparison[] {
  return criteria.map((criterion) => {
    const selfValue = selfScores[criterion.id]
    const teacherValue = teacherScores[criterion.id]
    const range = criterion.maxValue - criterion.minValue

    if (
      !Number.isFinite(range) || range <= 0 ||
      !Number.isFinite(selfValue) ||
      !Number.isFinite(teacherValue) ||
      selfValue < criterion.minValue || selfValue > criterion.maxValue ||
      teacherValue < criterion.minValue || teacherValue > criterion.maxValue
    ) {
      throw new Error(`Unvollständige oder ungültige Bewertung für ${criterion.name}`)
    }

    return {
      id: criterion.id,
      name: criterion.name,
      minValue: criterion.minValue,
      maxValue: criterion.maxValue,
      selfValue,
      teacherValue,
      selfRatio: (selfValue - criterion.minValue) / range,
      teacherRatio: (teacherValue - criterion.minValue) / range,
      difference: selfValue - teacherValue
    }
  })
}
