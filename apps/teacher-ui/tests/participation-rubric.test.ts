import { emptyParticipationAssessment, participationGrade, participationTotal } from '../src/utils/participation-rubric'

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
