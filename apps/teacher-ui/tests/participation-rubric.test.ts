import {
  PARTICIPATION_CRITERIA,
  createParticipationCategoryConfiguration,
  emptyParticipationAssessment,
  hasCompleteTeacherAssessment,
  isParticipationAssessment,
  participationGrade,
  participationTotal
} from '../src/utils/participation-rubric'

describe('participation rubric', () => {
  it('contains all 20 Fachkonferenz descriptors for five criteria', () => {
    expect(PARTICIPATION_CRITERIA).toHaveLength(5)
    for (const criterion of PARTICIPATION_CRITERIA) {
      expect(criterion.levels).toHaveLength(4)
      expect(criterion.levels.every(description => description.length > 0)).toBe(true)
    }
    expect(PARTICIPATION_CRITERIA[0].levels[3]).toContain('Vorbereiten der Sporthalle')
    expect(PARTICIPATION_CRITERIA[4].levels[3]).toContain('Unterstützen von Mitschülern')
  })

  it('calculates the PDF maximum including its optional bonus point', () => {
    const assessment = emptyParticipationAssessment()
    assessment.teacherAssessment = { preparation: 3, discussion: 3, effort: 3, independence: 2, interaction: 3 }
    assessment.bonusPoint = true
    expect(participationTotal(assessment)).toBe(15)
    expect(participationGrade(participationTotal(assessment))).toBe(1)
  })
  it.each([[14.5, 1], [12, 2], [9, 3], [7, 4], [2.5, 5], [2, 5], [0, 5]])('maps %s points to grade %s', (points, grade) => expect(participationGrade(points)).toBe(grade))
})

describe('participation entry readiness', () => {
  it('uses the same default rubric for new verbal categories', () => {
    const config = createParticipationCategoryConfiguration()
    expect(config.type).toBe('verbal')
    expect(config.fields.map(field => field.id)).toEqual([
      'preparation', 'discussion', 'effort', 'independence', 'interaction'
    ])
    expect(config.scales[0].levels.map(level => level.value)).toEqual([0, 1, 2, 3])
  })

  it('uses grade six only for an explicit refusal, including incomplete point scoring', () => {
    const assessment = emptyParticipationAssessment()
    expect(assessment.refused).toBe(false)
    expect(participationGrade(0)).toBe(5)
    assessment.refused = true
    expect(isParticipationAssessment(assessment)).toBe(true)
    expect(participationGrade(participationTotal(assessment), assessment.refused)).toBe(6)
    assessment.refused = false
    expect(participationGrade(participationTotal(assessment), assessment.refused)).toBe(5)
  })

  it('restores saved assessments without a refusal flag', () => {
    const saved = emptyParticipationAssessment()
    delete saved.refused
    expect(isParticipationAssessment(saved)).toBe(true)
    expect(participationGrade(participationTotal(saved), saved.refused)).toBe(5)
  })

  it('does not treat absent teacher scores as grade six', () => {
    const assessment = emptyParticipationAssessment()
    expect(hasCompleteTeacherAssessment(assessment)).toBe(false)
    assessment.teacherAssessment = {
      preparation: 0, discussion: 0, effort: 0, independence: 0, interaction: 0
    }
    expect(hasCompleteTeacherAssessment(assessment)).toBe(true)
    expect(participationGrade(participationTotal(assessment))).toBe(5)
    delete assessment.teacherAssessment.preparation
    expect(hasCompleteTeacherAssessment(assessment)).toBe(false)
  })
})
