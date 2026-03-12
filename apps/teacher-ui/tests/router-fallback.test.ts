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

  it('uses the parent fallback when no internal history target exists', () => {
    const route = router.resolve('/settings/catalogs')

    expect(getSafeBackNavigationTarget(route, false)).toBe('/settings')
  })

  it('keeps browser back behavior when an internal history target exists', () => {
    const route = router.resolve('/settings/catalogs')

    expect(getSafeBackNavigationTarget(route, true)).toBeNull()
  })
})
