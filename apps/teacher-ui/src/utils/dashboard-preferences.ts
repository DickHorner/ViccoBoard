export const dashboardPanels = [
  { id: 'next', label: 'Jetzt / Als Nächstes' },
  { id: 'teaching', label: 'Unterricht' },
  { id: 'organization', label: 'Organisation' },
  { id: 'today', label: 'Heute' },
  { id: 'shortcuts', label: 'Schnellzugriffe' },
  { id: 'activity', label: 'Letzte Aktivitäten' }
] as const

export type DashboardPanelId = (typeof dashboardPanels)[number]['id']
export type DashboardLinkGroup = 'teaching' | 'organization' | 'shortcuts'

export interface DashboardPreferences {
  panels: DashboardPanelId[]
  links: Record<DashboardLinkGroup, string[]>
}

export const defaultDashboardPreferences: DashboardPreferences = {
  panels: dashboardPanels.map(panel => panel.id),
  links: {
    teaching: ['/subjects/sport', '/subjects/kbr'],
    organization: ['/schedule', '/classes', '/students', '/settings'],
    shortcuts: ['/?createClass=1', '/students', '/attendance']
  }
}

const groups: DashboardLinkGroup[] = ['teaching', 'organization', 'shortcuts']
const panelIds = new Set<string>(dashboardPanels.map(panel => panel.id))

export function normalizeDashboardPreferences(
  input: unknown,
  availablePaths: ReadonlySet<string>
): DashboardPreferences {
  const preferences: DashboardPreferences = {
    panels: [...defaultDashboardPreferences.panels],
    links: {
      teaching: [...defaultDashboardPreferences.links.teaching],
      organization: [...defaultDashboardPreferences.links.organization],
      shortcuts: [...defaultDashboardPreferences.links.shortcuts]
    }
  }

  if (!input || typeof input !== 'object' || Array.isArray(input)) return preferences

  const saved = input as Record<string, unknown>
  if (Array.isArray(saved.panels)) {
    preferences.panels = Array.from(new Set(
      saved.panels.filter((id): id is DashboardPanelId => typeof id === 'string' && panelIds.has(id))
    ))
  }

  if (saved.links && typeof saved.links === 'object' && !Array.isArray(saved.links)) {
    const savedLinks = saved.links as Record<string, unknown>
    for (const group of groups) {
      const values = savedLinks[group]
      if (!Array.isArray(values)) continue
      preferences.links[group] = Array.from(new Set(
        values.filter((path): path is string => typeof path === 'string' && availablePaths.has(path))
      ))
    }
  }

  return preferences
}
