import { primaryNavSections, resolvePrimaryNavTarget } from '../src/navigation'
import router from '../src/router'

describe('primary navigation', () => {
  it('organizes the app into start, unterricht, and organisation', () => {
    expect(primaryNavSections.map((section) => section.id)).toEqual([
      'start',
      'subjects',
      'organisation'
    ])
  })

  it('keeps organisation as a collapsed summary section by default', () => {
    const organization = primaryNavSections.find((section) => section.id === 'organisation')

    expect(organization).toEqual(expect.objectContaining({
      collapsible: true,
      defaultExpanded: false
    }))
  })

  it('includes the new top-level workspace entry points', () => {
    const targets = primaryNavSections.flatMap((section) => section.items.map((item) => item.to))

    expect(targets).toEqual(expect.arrayContaining([
      '/',
      '/schedule',
      '/classes',
      '/students',
      '/lessons',
      '/attendance',
      '/settings',
      '/subjects/sport',
      '/subjects/kbr'
    ]))
  })

  it('provides a unique icon and destination for every workspace link', () => {
    const items = primaryNavSections.flatMap(section => section.items)

    expect(new Set(items.map(item => item.to)).size).toBe(items.length)
    expect(items.every(item => item.icon.startsWith('pi pi-') && item.label.length > 0)).toBe(true)
  })

  it('selects the closest primary nav entry from declared router parents', () => {
    const parentOf = (path: string) => router.resolve(path).meta.parent

    expect(resolvePrimaryNavTarget('/dashboard', parentOf)).toBe('/')
    expect(resolvePrimaryNavTarget('/subjects/sport/statistics', parentOf)).toBe('/subjects/sport')
    expect(resolvePrimaryNavTarget('/grading/time/example', parentOf)).toBe('/subjects/sport')
    expect(resolvePrimaryNavTarget('/tools/timer', parentOf)).toBe('/subjects/sport')
    expect(resolvePrimaryNavTarget('/exams/example/workspace', parentOf)).toBe('/subjects/kbr')
    expect(resolvePrimaryNavTarget('/exams/example/correct', parentOf)).toBe('/subjects/kbr')
    expect(resolvePrimaryNavTarget('/support-tips', parentOf)).toBe('/subjects/kbr')
    expect(resolvePrimaryNavTarget('/students/example', parentOf)).toBe('/students')
    expect(resolvePrimaryNavTarget('/classes/example', parentOf)).toBe('/classes')
    expect(resolvePrimaryNavTarget('/lessons/example/workspace', parentOf)).toBe('/lessons')
    expect(resolvePrimaryNavTarget('/settings/catalogs', parentOf)).toBe('/settings')
    expect(resolvePrimaryNavTarget('/attendance', parentOf)).toBe('/attendance')
  })

  it('has an active navigation destination for every registered view', () => {
    const parentOf = (path: string) => router.resolve(path).meta.parent
    const unresolvedPaths = router.getRoutes()
      .map(record => record.path.replace(/:[^/]+/g, 'sample'))
      .filter(path => resolvePrimaryNavTarget(path, parentOf) === null)

    expect(unresolvedPaths).toEqual([])
  })

  it('does not loop forever when unknown routes refer back to themselves', () => {
    expect(resolvePrimaryNavTarget('/unknown', () => '/unknown')).toBeNull()
  })

  it('keeps sport tools out of the primary navigation', () => {
    const targets = primaryNavSections.flatMap((section) => section.items.map((item) => item.to))

    expect(targets).not.toContain('/tools/timer')
    expect(targets).not.toContain('/tools/scoreboard')
    expect(targets).not.toContain('/tools/teams')
  })
})
