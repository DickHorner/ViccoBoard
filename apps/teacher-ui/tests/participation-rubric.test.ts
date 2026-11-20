import {
  createParticipationCategoryConfiguration,
  parseParticipationRubric,
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

describe('locally imported participation rubrics', () => {
  const example = {
    format: 'viccoboard-participation-rubric',
    version: 1,
    name: 'Individuelles Raster',
    rubric: {
      id: 'local-test',
      criteria: [
        { id: 'criterion-a', label: 'A', description: '', levels: [
          { value: 0, description: 'Nicht gezeigt' },
          { value: 1, description: 'Teilweise gezeigt' },
          { value: 2, description: 'Gezeigt' }
        ] }
      ],
      bonusPoints: 1,
      bonusLabel: 'Zusatz',
      gradeThresholds: [
        { minPoints: 3, grade: 15 },
        { minPoints: 2, grade: 12 },
        { minPoints: 1, grade: 8 }
      ],
      fallbackGrade: 0,
      refusalGrade: 0
    }
  }

  it('parses custom score levels and Oberstufe grades', () => {
    const { rubric, name } = parseParticipationRubric(example)
    expect(name).toBe('Individuelles Raster')
    const assessment = emptyParticipationAssessment(rubric.id)
    assessment.teacherAssessment['criterion-a'] = 2
    assessment.bonusPoint = true
    expect(hasCompleteTeacherAssessment(assessment, rubric)).toBe(true)
    expect(participationTotal(assessment, rubric)).toBe(3)
    expect(participationGrade(3, rubric)).toBe(15)
    expect(participationGrade(1, rubric)).toBe(8)
    expect(participationGrade(0, rubric)).toBe(0)
    expect(participationGrade(3, rubric, true)).toBe(0)
    expect(createParticipationCategoryConfiguration(rubric).participationRubric?.id).toBe('local-test')
  })

  it('rejects duplicate criterion IDs and malformed/unsorted boundaries', () => {
    expect(() => parseParticipationRubric({
      ...example, rubric: {
        ...example.rubric, criteria: [example.rubric.criteria[0], example.rubric.criteria[0]]
      }
    })).toThrow()
    expect(() => parseParticipationRubric({
      ...example, rubric: {
        ...example.rubric, gradeThresholds: [
          { minPoints: 1, grade: 15 }, { minPoints: 2, grade: 12 }
        ]
      }
    })).toThrow()
  })

  it('rejects nonconsecutive levels, unsupported formats, and invalid bonus values', () => {
    expect(() => parseParticipationRubric({ ...example, version: 2 })).toThrow()
    expect(() => parseParticipationRubric({
      ...example, rubric: {
        ...example.rubric, bonusPoints: 4
      }
    })).toThrow()
    expect(() => parseParticipationRubric({
      ...example, rubric: {
        ...example.rubric, criteria: [
          { ...example.rubric.criteria[0], levels: [
            { value: 0, description: '0' }, { value: 3, description: '3' }
          ] }
        ]
      }
    })).toThrow()
  })

  it('does not assign a grade until teacher scores are complete', () => {
    const { rubric } = parseParticipationRubric(example)
    const assessment = emptyParticipationAssessment(rubric.id)
    expect(hasCompleteTeacherAssessment(assessment, rubric)).toBe(false)
    assessment.teacherAssessment['criterion-a'] = 0
    expect(hasCompleteTeacherAssessment(assessment, rubric)).toBe(true)
    expect(participationGrade(0, rubric)).toBe(0)
  })
})
