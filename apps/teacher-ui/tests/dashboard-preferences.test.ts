import {
  defaultDashboardPreferences,
  normalizeDashboardPreferences
} from '../src/utils/dashboard-preferences'

const availablePaths = new Set([
  '/subjects/sport', '/subjects/kbr', '/schedule', '/classes', '/students',
  '/settings', '/attendance', '/?createClass=1', '/tools/timer'
])

describe('dashboard preferences', () => {
  it('uses independent defaults for absent or invalid preferences', () => {
    const first = normalizeDashboardPreferences(null, availablePaths)
    first.links.shortcuts.push('/tools/timer')

    expect(normalizeDashboardPreferences('invalid', availablePaths)).toEqual(defaultDashboardPreferences)
  })

  it('preserves empty selections and removes obsolete or duplicated panel IDs', () => {
    const saved = {
      panels: ['next', 'classes', 'next', 'shortcuts'],
      links: { shortcuts: [] }
    }

    expect(normalizeDashboardPreferences(saved, availablePaths)).toEqual({
      panels: ['next', 'shortcuts'],
      links: {
        ...defaultDashboardPreferences.links,
        shortcuts: []
      }
    })
  })

  it('ignores unknown and duplicate routes instead of restoring arbitrary URLs', () => {
    const saved = {
      panels: ['organization'],
      links: {
        organization: ['/students', 'https://example.com', '/students', '/tools/timer'],
        teaching: 'invalid'
      }
    }
    const result = normalizeDashboardPreferences(saved, availablePaths)

    expect(result.links.organization).toEqual(['/students', '/tools/timer'])
    expect(result.links.teaching).toEqual(defaultDashboardPreferences.links.teaching)
  })
})
