import { primaryNavSections } from '../src/navigation'

describe('primary navigation', () => {
  it('organizes the app into start, organisation, and subjects', () => {
    expect(primaryNavSections.map((section) => section.id)).toEqual([
      'start',
      'organisation',
      'subjects'
    ])
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

  it('keeps sport tools out of the primary navigation', () => {
    const targets = primaryNavSections.flatMap((section) => section.items.map((item) => item.to))

    expect(targets).not.toContain('/tools/timer')
    expect(targets).not.toContain('/tools/scoreboard')
    expect(targets).not.toContain('/tools/teams')
  })
})
