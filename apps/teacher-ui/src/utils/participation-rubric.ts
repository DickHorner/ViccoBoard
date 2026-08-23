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
