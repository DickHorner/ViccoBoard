import {
  createParticipationCategoryConfiguration,
  emptyParticipationAssessment,
  hasCompleteTeacherAssessment,
  participationGrade,
  participationTotal
} from '../src/utils/participation-rubric'

describe('participation rubric', () => {
  it('calculates the PDF maximum including its optional bonus point', () => {
    const assessment = emptyParticipationAssessment()
    assessment.teacherAssessment = { preparation: 3, discussion: 3, effort: 3, independence: 2, interaction: 3 }
    assessment.bonusPoint = true
    expect(participationTotal(assessment)).toBe(15)
    expect(participationGrade(participationTotal(assessment))).toBe(1)
  })
  it.each([[14.5, 1], [12, 2], [9, 3], [7, 4], [2.5, 5], [2, 6]])('maps %s points to grade %s', (points, grade) => expect(participationGrade(points)).toBe(grade))
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

  it('does not treat absent teacher scores as grade six', () => {
    const assessment = emptyParticipationAssessment()
    expect(hasCompleteTeacherAssessment(assessment)).toBe(false)
    assessment.teacherAssessment = {
      preparation: 0, discussion: 0, effort: 0, independence: 0, interaction: 0
    }
    expect(hasCompleteTeacherAssessment(assessment)).toBe(true)
    expect(participationGrade(participationTotal(assessment))).toBe(6)
    delete assessment.teacherAssessment.preparation
    expect(hasCompleteTeacherAssessment(assessment)).toBe(false)
  })
})
