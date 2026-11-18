export interface NavItem {
  to: string
  label: string
  hint: string
  icon: string
}

export interface NavSection {
  id: string
  title: string
  items: NavItem[]
  collapsible?: boolean
  defaultExpanded?: boolean
}

export const primaryNavSections: NavSection[] = [
  {
    id: 'start',
    title: 'Start',
    items: [
      { to: '/', label: 'Dashboard', hint: 'Heute und Schnellzugriffe', icon: 'pi pi-home' }
    ]
  },
  {
    id: 'subjects',
    title: 'Unterricht',
    items: [
      { to: '/subjects/sport', label: 'Sport', hint: 'Bewertung, Tests, Tools', icon: 'pi pi-heart' },
      { to: '/subjects/kbr', label: 'KBR', hint: 'Prüfungen und Korrektur', icon: 'pi pi-file-edit' }
    ]
  },
  {
    id: 'organisation',
    title: 'Organisation',
    collapsible: true,
    defaultExpanded: false,
    items: [
      { to: '/schedule', label: 'Stundenplan', hint: 'Tages- und Stundenübersicht', icon: 'pi pi-calendar' },
      { to: '/planning', label: 'Sequenzplanung', hint: 'Themenblöcke im Schuljahr', icon: 'pi pi-sitemap' },
      { to: '/classes', label: 'Klassen', hint: 'Klassen und Gruppen', icon: 'pi pi-users' },
      { to: '/students', label: 'Schüler', hint: 'Zentrale Verwaltung', icon: 'pi pi-user' },
      { to: '/lessons', label: 'Stunden', hint: 'Einträge und Verlauf', icon: 'pi pi-book' },
      { to: '/attendance', label: 'Anwesenheit', hint: 'Status und Dokumentation', icon: 'pi pi-check-square' },
      { to: '/settings', label: 'Einstellungen', hint: 'App und Konfiguration', icon: 'pi pi-cog' }
    ]
  }
]


const navTargets = new Set(primaryNavSections.flatMap(section => section.items.map(item => item.to)))

export function resolvePrimaryNavTarget(
  path: string,
  resolveParent: (path: string) => string | undefined
): string | null {
  let current = path === '/dashboard' ? '/' : path
  const visited = new Set<string>()

  while (current && !visited.has(current)) {
    if (navTargets.has(current)) return current
    visited.add(current)
    current = resolveParent(current) ?? ''
  }

  return null
}
