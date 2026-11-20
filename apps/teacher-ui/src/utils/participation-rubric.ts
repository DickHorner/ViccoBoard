import type { Sport } from '@viccoboard/core'

export const PARTICIPATION_RUBRIC_ID = 'sport-participation-sek1-v1'

export const PARTICIPATION_CRITERIA = [
  {
    id: 'preparation',
    label: 'Vorbereitung',
    description: 'Pünktlichkeit, Sportsachen, Schmuck',
    levels: [
      'Verspätet zum Unterrichtsbeginn. Sportsachen vergessen oder Schmuck nicht abgelegt/ abgeklebt.',
      'Ca. 1 min vor Unterrichtsbeginn in der Sporthalle. Sportsachen vergessen oder Schmuck nicht abgelegt/ abgeklebt.',
      'Ca. 1 min vor Unterrichtsbeginn umgezogen in der Sporthalle.',
      'Ca. 3 Minuten vor Unterrichtsbeginn umgezogen in der Halle. Vorbereiten der Sporthalle (U-Form, Materialien).'
    ]
  },
  {
    id: 'discussion',
    label: 'Unterrichtsgespräche/kognitive Phasen',
    description: 'Kognitive Phasen und Beteiligung',
    levels: [
      'Im Unterrichtsgespräch abgelenkt. Keine Beteiligung.',
      'Aufmerksames Zuhören. Jederzeit in der Lage, nach Aufforderung eine Antwort zu geben.',
      'Aufmerksames Zuhören. Phasenweise selbstständige Beteiligung.',
      'Aufmerksames Zuhören. Regelmäßige selbstständige Beteiligung.'
    ]
  },
  {
    id: 'effort',
    label: 'Anstrengungs- und Übungsbereitschaft',
    description: 'Konzentriertes Üben und Arbeiten',
    levels: [
      'Arbeitsverweigerung oder ständige Beschäftigung mit ablenkender Tätigkeit.',
      'Nur phasenweise konzentriertes Üben und Arbeiten.',
      'Überwiegend konzentriertes Üben und Arbeiten.',
      'Stets konzentriertes, ausdauerndes Üben und Arbeiten. Einfordern und Nutzen zusätzlicher Angebote.'
    ]
  },
  {
    id: 'independence',
    label: 'Selbstständigkeit/Arbeit in Kleingruppen',
    description: 'Stationskarten und Arbeitsaufträge',
    levels: [
      'Ignorieren von Stationskarten und Arbeitsaufträgen.',
      'Oberflächliches Lesen von Stationskarten. Beim Absolvieren von Arbeitsaufträgen häufig Hilfestellung/ Erläuterung durch Lehrkraft nötig.',
      'Sorgfältiges Lesen von Stationskarten. Beim Absolvieren von Arbeitsaufträgen selten Hilfestellung/ Erläuterung durch Lehrkraft nötig.',
      'Sorgfältiges Lesen von Stationskarten und selbstständiges Absolvieren von Arbeitsaufträgen.'
    ]
  },
  {
    id: 'interaction',
    label: 'Interaktion',
    description: 'Regeln und Umgang mit Mitschülern',
    levels: [
      'Verstoßen gegen Regeln und Vorgaben. Ablehnende Mimik/ Gestik und Äußerungen gegenüber Lehrkraft/ Mitschülern.',
      'Nur phasenweise Einhalten von Regeln und verantwortungsvoller Umgang mit Mitschülern.',
      'Überwiegendes Einhalten von Regeln und verantwortungsvoller Umgang mit Mitschülern.',
      'Permanentes Einhalten von Regeln. Verantwortungsvoller Umgang mit und Unterstützen von Mitschülern.'
    ]
  }
] as const

export type ParticipationCriterionId = typeof PARTICIPATION_CRITERIA[number]['id']
export type ParticipationScores = Partial<Record<ParticipationCriterionId, number>>
export interface ParticipationAssessment {
  rubric: typeof PARTICIPATION_RUBRIC_ID
  selfAssessment: ParticipationScores
  teacherAssessment: ParticipationScores
  bonusPoint: boolean
  refused?: boolean
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
  return { rubric: PARTICIPATION_RUBRIC_ID, selfAssessment: {}, teacherAssessment: {}, bonusPoint: false, refused: false }
}
export function isParticipationAssessment(value: unknown): value is ParticipationAssessment {
  if (!value || typeof value !== 'object') return false
  const assessment = value as Partial<ParticipationAssessment>
  return assessment.rubric === PARTICIPATION_RUBRIC_ID && !!assessment.selfAssessment && !!assessment.teacherAssessment && typeof assessment.bonusPoint === 'boolean' &&
    (assessment.refused === undefined || typeof assessment.refused === 'boolean')
}
export function participationTotal(assessment: ParticipationAssessment): number {
  return PARTICIPATION_CRITERIA.reduce((total, criterion) => {
    const score = assessment.teacherAssessment[criterion.id]
    return total + (typeof score === 'number' && score >= 0 && score <= 3 ? score : 0)
  }, 0) + (assessment.bonusPoint ? 1 : 0)
}
export function participationGrade(total: number, refused = false): number {
  if (refused) return 6
  if (total >= 14.5) return 1
  if (total >= 12) return 2
  if (total >= 9) return 3
  if (total >= 7) return 4
  return 5
}
