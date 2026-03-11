export interface NavItem {
  to: string
  label: string
  hint: string
}

export interface NavSection {
  id: string
  title: string
  items: NavItem[]
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
    id: 'organisation',
    title: 'Organisation',
    items: [
      { to: '/schedule', label: 'Stundenplan', hint: 'Tages- und Stundenuebersicht' },
      { to: '/classes', label: 'Klassen', hint: 'Klassen und Gruppen' },
      { to: '/students', label: 'Schueler', hint: 'Zentrale Verwaltung' },
      { to: '/lessons', label: 'Stunden', hint: 'Eintraege und Verlauf' },
      { to: '/attendance', label: 'Anwesenheit', hint: 'Status und Dokumentation' },
      { to: '/settings', label: 'Einstellungen', hint: 'App und Konfiguration' }
    ]
  },
  {
    id: 'subjects',
    title: 'Faecher',
    items: [
      { to: '/subjects/sport', label: 'Sport', hint: 'Bewertung, Tests, Tools' },
      { to: '/subjects/kbr', label: 'KBR', hint: 'Pruefungen und Korrektur' }
    ]
  }
]

