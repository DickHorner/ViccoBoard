import router, { getSafeBackNavigationTarget, resolveBackFallbackPath } from '../src/router'

describe('router fallback navigation', () => {
  it('resolves grading detail routes back to the grading overview', () => {
    const route = router.resolve('/grading/tables')

    expect(resolveBackFallbackPath(route)).toBe('/grading')
  })

  it('resolves sport tool routes back to the sport hub', () => {
    const route = router.resolve('/tools/scoreboard')

    expect(resolveBackFallbackPath(route)).toBe('/subjects/sport')
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
