export interface NavItem {
  to: string
  label: string
  hint: string
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
      { to: '/', label: 'Dashboard', hint: 'Heute und Schnellzugriffe' }
    ]
  },
  {
    id: 'subjects',
    title: 'Unterricht',
    items: [
      { to: '/subjects/sport', label: 'Sport', hint: 'Bewertung, Tests, Tools' },
      { to: '/subjects/kbr', label: 'KBR', hint: 'Prüfungen und Korrektur' }
    ]
  },
  {
    id: 'organisation',
    title: 'Organisation',
    collapsible: true,
    defaultExpanded: false,
    items: [
      { to: '/schedule', label: 'Stundenplan', hint: 'Tages- und Stundenübersicht' },
      { to: '/classes', label: 'Klassen', hint: 'Klassen und Gruppen' },
      { to: '/students', label: 'Schüler', hint: 'Zentrale Verwaltung' },
      { to: '/lessons', label: 'Stunden', hint: 'Einträge und Verlauf' },
      { to: '/attendance', label: 'Anwesenheit', hint: 'Status und Dokumentation' },
      { to: '/settings', label: 'Einstellungen', hint: 'App und Konfiguration' }
    ]
  }
]

