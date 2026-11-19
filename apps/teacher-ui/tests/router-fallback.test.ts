import router, { getSafeBackNavigationTarget, resolveBackFallbackPath } from '../src/router'

describe('router fallback navigation', () => {
  it('preserves class and lesson context across Unterricht navigation', () => {
    const group = router.resolve('/classes/class-7')
    expect(group.name).toBe('class-detail')

    const lessons = router.resolve({ path: '/lessons', query: { classId: 'class-7' } })
    expect(lessons.name).toBe('lessons')
    expect(lessons.query.classId).toBe('class-7')

    const workspace = router.resolve('/lessons/lesson-12/workspace')
    expect(workspace.name).toBe('lesson-workspace')
    expect(workspace.params.id).toBe('lesson-12')

    const attendance = router.resolve({
      path: '/attendance',
      query: { classId: 'class-7', lessonId: 'lesson-12' }
    })
    expect(attendance.name).toBe('attendance')
    expect(attendance.query).toEqual({ classId: 'class-7', lessonId: 'lesson-12' })
    expect(resolveBackFallbackPath(attendance)).toBe('/lessons')
  })

  it('keeps attendance accessible without an existing lesson', () => {
    const attendance = router.resolve({ path: '/attendance', query: { classId: 'class-7' } })
    expect(attendance.name).toBe('attendance')
    expect(attendance.query).toEqual({ classId: 'class-7' })
    expect(router.resolve('/attendance').name).toBe('attendance')
  })

  it('resolves grading detail routes back to the grading overview', () => {
    const route = router.resolve('/grading/tables')

    expect(resolveBackFallbackPath(route)).toBe('/grading')
  })

  it('resolves sport tool routes back to the sport hub', () => {
    const route = router.resolve('/tools/scoreboard')

    expect(resolveBackFallbackPath(route)).toBe('/subjects/sport')
  })

  it('resolves the independent KBR sheet designer without changing exam edit or export routes', () => {
    expect(router.resolve('/exams?workflow=design').name).toBe('exams')
    const designer = router.resolve('/exams/exam-1/sheet-design')
    expect(designer.name).toBe('exam-sheet-design')
    expect(resolveBackFallbackPath(designer)).toBe('/exams')
    expect(router.resolve('/exams/exam-1').name).toBe('exam-edit')
    expect(router.resolve('/exams/exam-1/export').name).toBe('exam-export')
  })


  it('opens the reusable sheet library without an exam id', () => {
    const library = router.resolve('/sheet-templates')

    expect(library.name).toBe('sheet-templates')
    expect(library.params.id).toBeUndefined()
    expect(resolveBackFallbackPath(library)).toBe('/subjects/kbr')
    expect(router.resolve('/exams/exam-1/sheet-design').name).toBe('exam-sheet-design')
    expect(router.resolve('/exams?workflow=design').name).toBe('exams')
  })

  it('keeps the exam workspace distinct from legacy edit and deep links', () => {
    const workspace = router.resolve('/exams/exam-1/workspace')
    expect(workspace.name).toBe('exam-workspace')
    expect(workspace.params.id).toBe('exam-1')
    expect(resolveBackFallbackPath(workspace)).toBe('/exams')

    expect(router.resolve('/exams/exam-1').name).toBe('exam-edit')
    expect(router.resolve('/exams/exam-1/correct').name).toBe('exam-correct')
    expect(router.resolve('/exams/exam-1/analysis').name).toBe('exam-analysis')
    expect(router.resolve('/exams/exam-1/sheet-design').name).toBe('exam-sheet-design')
    expect(router.resolve('/exams/exam-1/export').name).toBe('exam-export')

    const correction = router.resolve('/exams/exam-1/correct?candidateId=candidate-1')
    expect(correction.params.id).toBe('exam-1')
    expect(correction.query.candidateId).toBe('candidate-1')
  })

  it('resolves KBR workflow entry and its existing destinations', () => {
    for (const workflow of ['correct', 'sheets', 'analysis']) {
      expect(router.resolve(`/exams?workflow=${workflow}`).name).toBe('exams')
    }
    expect(router.resolve('/exams/demo/correct').name).toBe('exam-correct')
    expect(router.resolve('/exams/demo/export').name).toBe('exam-export')
    expect(router.resolve('/exams/demo/analysis').name).toBe('exam-analysis')
  })

  it('resolves the new KBR export route back to the exams overview', () => {
    const route = router.resolve('/exams/demo/export')

    expect(route.name).toBe('exam-export')
    expect(resolveBackFallbackPath(route)).toBe('/exams')
  })

  it('uses the declared route parent for in-app back navigation', () => {
    const route = router.resolve('/settings/catalogs')

    expect(getSafeBackNavigationTarget(route)).toBe('/settings')
  })

  it('ignores chronological browser history for hierarchical in-app back navigation', () => {
    const route = router.resolve('/tools/scoreboard')

    expect(getSafeBackNavigationTarget(route)).toBe('/subjects/sport')
  })

  it('keeps native browser-back behavior available on routes without a parent', () => {
    const route = router.resolve('/')

    expect(getSafeBackNavigationTarget(route)).toBeNull()
  })
})
