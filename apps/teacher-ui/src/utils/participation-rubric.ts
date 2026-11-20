import type { Sport } from '@viccoboard/core'

export const PARTICIPATION_RUBRIC_ID = 'sport-participation-sek1-v1'

export const PARTICIPATION_CRITERIA = [
  { id: 'preparation', label: 'Vorbereitung', description: 'Pünktlichkeit, Sportsachen, Schmuck' },
  { id: 'discussion', label: 'Unterrichtsgespräche', description: 'Kognitive Phasen und Beteiligung' },
  { id: 'effort', label: 'Anstrengung', description: 'Anstrengungs- und Übungsbereitschaft' },
  { id: 'independence', label: 'Selbstständigkeit', description: 'Arbeit in Kleingruppen' },
  { id: 'interaction', label: 'Interaktion', description: 'Regeln und Umgang mit Mitschülern' }
] as const

export type ParticipationCriterionId = typeof PARTICIPATION_CRITERIA[number]['id']
export type ParticipationScores = Partial<Record<ParticipationCriterionId, number>>
export interface ParticipationAssessment {
  rubric: typeof PARTICIPATION_RUBRIC_ID
  selfAssessment: ParticipationScores
  teacherAssessment: ParticipationScores
  bonusPoint: boolean
}
export function createParticipationCategoryConfiguration(): Sport.VerbalAssessmentConfig {
  return {
    type: 'verbal',
    fields: PARTICIPATION_CRITERIA.map(criterion => ({
      id: criterion.id,
      label: criterion.label,
      type: 'scale',
      required: true
    })),
    scales: [{
      id: 'participation-0-3',
      name: 'Mitarbeit 0–3 Punkte',
      levels: [0, 1, 2, 3].map(value => ({ value, label: `${value} Punkte` }))
    }],
    exportFormat: 'structured'
  }
}

export function hasCompleteTeacherAssessment(assessment: ParticipationAssessment): boolean {
  return PARTICIPATION_CRITERIA.every(criterion => {
    const value = assessment.teacherAssessment[criterion.id]
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 3
  })
}

export function emptyParticipationAssessment(): ParticipationAssessment {
  return { rubric: PARTICIPATION_RUBRIC_ID, selfAssessment: {}, teacherAssessment: {}, bonusPoint: false }
}
export function isParticipationAssessment(value: unknown): value is ParticipationAssessment {
  if (!value || typeof value !== 'object') return false
  const assessment = value as Partial<ParticipationAssessment>
  return assessment.rubric === PARTICIPATION_RUBRIC_ID && !!assessment.selfAssessment && !!assessment.teacherAssessment && typeof assessment.bonusPoint === 'boolean'
}
export function participationTotal(assessment: ParticipationAssessment): number {
  return PARTICIPATION_CRITERIA.reduce((total, criterion) => {
    const score = assessment.teacherAssessment[criterion.id]
    return total + (typeof score === 'number' && score >= 0 && score <= 3 ? score : 0)
  }, 0) + (assessment.bonusPoint ? 1 : 0)
}
export function participationGrade(total: number): number {
  if (total >= 14.5) return 1
  if (total >= 12) return 2
  if (total >= 9) return 3
  if (total >= 7) return 4
  if (total >= 2.5) return 5
  return 6
}
