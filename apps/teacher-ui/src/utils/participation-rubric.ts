import type { Sport } from '@viccoboard/core'

export const PARTICIPATION_RUBRIC_ID = 'sport-participation-sek1-v1'

export const PARTICIPATION_CRITERIA = [
  { id: 'preparation', label: 'Vorbereitung', description: 'Pünktlichkeit, Sportsachen, Schmuck' },
  { id: 'discussion', label: 'Unterrichtsgespräche', description: 'Kognitive Phasen und Beteiligung' },
  { id: 'effort', label: 'Anstrengung', description: 'Anstrengungs- und Übungsbereitschaft' },
  { id: 'independence', label: 'Selbstständigkeit', description: 'Arbeit in Kleingruppen' },
  { id: 'interaction', label: 'Interaktion', description: 'Regeln und Umgang mit Mitschülern' }
] as const

export type ParticipationCriterionId = string
export type ParticipationScores = Record<string, number>
export interface ParticipationAssessment {
  rubric: string
  selfAssessment: ParticipationScores
  teacherAssessment: ParticipationScores
  bonusPoint: boolean
  refused?: boolean
}

export const DEFAULT_PARTICIPATION_RUBRIC: Sport.ParticipationRubricDefinition = {
  id: PARTICIPATION_RUBRIC_ID,
  criteria: PARTICIPATION_CRITERIA.map(criterion => ({
    ...criterion,
    levels: [0, 1, 2, 3].map(value => ({ value, description: `${value} Punkte` }))
  })),
  bonusPoints: 1,
  bonusLabel: 'Zusatzpunkt für besonderes Engagement',
  gradeThresholds: [
    { minPoints: 14.5, grade: 1 },
    { minPoints: 12, grade: 2 },
    { minPoints: 9, grade: 3 },
    { minPoints: 7, grade: 4 },
    { minPoints: 2.5, grade: 5 }
  ],
  fallbackGrade: 5,
  refusalGrade: 6
}

export function parseParticipationRubric(input: unknown): { name: string; rubric: Sport.ParticipationRubricDefinition } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Ungültige Rasterdatei.')
  const file = input as Record<string, unknown>
  if (file.format !== 'viccoboard-participation-rubric' || file.version !== 1 ||
      typeof file.name !== 'string' || !file.name.trim() || file.name.length > 100) {
    throw new Error('Unbekanntes Rasterformat, Version oder fehlender Name.')
  }
  const raw = file.rubric
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Rasterdefinition fehlt.')
  const rubric = raw as Record<string, unknown>
  if (typeof rubric.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(rubric.id)) {
    throw new Error('Ungültige Raster-ID.')
  }
  if (!Array.isArray(rubric.criteria) || rubric.criteria.length < 1 || rubric.criteria.length > 12) {
    throw new Error('Ein Raster muss 1 bis 12 Kriterien enthalten.')
  }
  const ids = new Set<string>()
  for (const rawCriterion of rubric.criteria) {
    if (!rawCriterion || typeof rawCriterion !== 'object' || Array.isArray(rawCriterion)) throw new Error('Ungültiges Kriterium.')
    const criterion = rawCriterion as Record<string, unknown>
    if (typeof criterion.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(criterion.id) ||
        ids.has(criterion.id) || ['__proto__', 'constructor', 'prototype'].includes(criterion.id) ||
        typeof criterion.label !== 'string' || !criterion.label.trim() ||
        criterion.label.length > 120 || typeof criterion.description !== 'string' || criterion.description.length > 500) {
      throw new Error('Kriterien-IDs müssen eindeutig sein; Bezeichnung/Beschreibung fehlen oder sind zu lang.')
    }
    ids.add(criterion.id)
    if (!Array.isArray(criterion.levels) || criterion.levels.length < 2 || criterion.levels.length > 16) {
      throw new Error(`Kriterium ${criterion.id}: 2 bis 16 Bewertungsstufen erforderlich.`)
    }
    for (const [index, rawLevel] of criterion.levels.entries()) {
      if (!rawLevel || typeof rawLevel !== 'object' || Array.isArray(rawLevel)) throw new Error('Ungültige Bewertungsstufe.')
      const level = rawLevel as Record<string, unknown>
      if (level.value !== index || typeof level.description !== 'string' ||
          !level.description.trim() || level.description.length > 1000) {
        throw new Error(`Kriterium ${criterion.id}: Stufen müssen lückenlos bei 0 beginnen und beschrieben sein.`)
      }
    }
  }
  if (rubric.bonusPoints !== 0 && rubric.bonusPoints !== 1) throw new Error('Bonus muss 0 oder 1 sein.')
  if (typeof rubric.bonusLabel !== 'string' || rubric.bonusLabel.length > 120) throw new Error('Ungültige Bonusbezeichnung.')
  const isGrade = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 15
  if (!isGrade(rubric.fallbackGrade) || !isGrade(rubric.refusalGrade)) throw new Error('Ungültige Notenwerte.')
  const maxPoints = rubric.criteria.reduce((sum: number, c: { levels: unknown[] }) => sum + c.levels.length - 1, rubric.bonusPoints as number)
  if (!Array.isArray(rubric.gradeThresholds) || rubric.gradeThresholds.length < 1 || rubric.gradeThresholds.length > 16) {
    throw new Error('Notengrenzen fehlen.')
  }
  let previous = maxPoints + 1
  const grades = new Set<number>()
  for (const rawThreshold of rubric.gradeThresholds) {
    if (!rawThreshold || typeof rawThreshold !== 'object') throw new Error('Ungültige Notengrenze.')
    const threshold = rawThreshold as Record<string, unknown>
    if (typeof threshold.minPoints !== 'number' || !Number.isFinite(threshold.minPoints) ||
        threshold.minPoints < 0 || threshold.minPoints > maxPoints || threshold.minPoints >= previous ||
        !isGrade(threshold.grade) || grades.has(threshold.grade as number)) {
      throw new Error('Notengrenzen müssen absteigend, eindeutig und im gültigen Punktebereich liegen.')
    }
    previous = threshold.minPoints
    grades.add(threshold.grade as number)
  }
  return { name: file.name.trim(), rubric: rubric as unknown as Sport.ParticipationRubricDefinition }
}

export function createParticipationCategoryConfiguration(
  rubric: Sport.ParticipationRubricDefinition = DEFAULT_PARTICIPATION_RUBRIC
): Sport.VerbalAssessmentConfig {
  return {
    type: 'verbal',
    fields: rubric.criteria.map(criterion => ({
      id: criterion.id,
      label: criterion.label,
      type: 'scale',
      required: true
    })),
    scales: [{
      id: 'participation-points',
      name: 'Mitarbeit',
      levels: [...new Set(rubric.criteria.flatMap(criterion => criterion.levels.map(level => level.value)))]
        .sort((a, b) => a - b)
        .map(value => ({ value, label: `${value} Punkte` }))
    }],
    exportFormat: 'structured',
    participationRubric: rubric
  }
}

export function hasCompleteTeacherAssessment(
  assessment: ParticipationAssessment,
  rubric: Sport.ParticipationRubricDefinition = DEFAULT_PARTICIPATION_RUBRIC
): boolean {
  return rubric.criteria.every(criterion => {
    const value = assessment.teacherAssessment[criterion.id]
    return criterion.levels.some(level => level.value === value)
  })
}

export function emptyParticipationAssessment(rubricId = PARTICIPATION_RUBRIC_ID): ParticipationAssessment {
  return { rubric: rubricId, selfAssessment: {}, teacherAssessment: {}, bonusPoint: false, refused: false }
}

export function isParticipationAssessment(value: unknown): value is ParticipationAssessment {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const assessment = value as Partial<ParticipationAssessment>
  return typeof assessment.rubric === 'string' && !!assessment.selfAssessment &&
    !!assessment.teacherAssessment && typeof assessment.bonusPoint === 'boolean' &&
    (assessment.refused === undefined || typeof assessment.refused === 'boolean')
}

export function participationTotal(
  assessment: ParticipationAssessment,
  rubric: Sport.ParticipationRubricDefinition = DEFAULT_PARTICIPATION_RUBRIC
): number {
  return rubric.criteria.reduce((total, criterion) => {
    const score = assessment.teacherAssessment[criterion.id]
    return total + (criterion.levels.some(level => level.value === score) ? score : 0)
  }, 0) + (assessment.bonusPoint ? rubric.bonusPoints : 0)
}

export function participationGrade(
  total: number,
  rubric: Sport.ParticipationRubricDefinition = DEFAULT_PARTICIPATION_RUBRIC,
  refused = false
): number {
  if (refused) return rubric.refusalGrade
  return rubric.gradeThresholds.find(boundary => total >= boundary.minPoints)?.grade ?? rubric.fallbackGrade
}
