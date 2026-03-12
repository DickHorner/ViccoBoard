export interface SettingsCard {
  title: string
  description: string
  status: string
  to: string | null
}

export const settingsCards: SettingsCard[] = [
  {
    title: 'Sicherheit & App-Sperre',
    description: 'PIN, Passwort, Timeout und weitere Schutzmechanismen werden hier gebündelt.',
    status: 'in Aufbau',
    to: null
  },
  {
    title: 'Backups & Wiederherstellung',
    description: 'Export, Import und Backup-Status für die iPad-Safari-Realität.',
    status: 'in Aufbau',
    to: null
  },
  {
    title: 'Sprache & Einrichtung',
    description: 'Sprachwahl, Hilfen für den Einstieg und spätere Onboarding-Optionen.',
    status: 'in Aufbau',
    to: null
  },
  {
    title: 'Katalogverwaltung',
    description: 'Status- und Kriterienkataloge für Anwesenheit, Mitarbeit und Verhalten konfigurieren, sortieren und aktivieren/deaktivieren.',
    status: 'verfügbar',
    to: '/settings/catalogs'
  },
  {
    title: 'Sport-Konfiguration',
    description: 'Shuttle-Run-Konfigurationen, Status-Katalog, Tabellen und weitere fachspezifische Einstellungen.',
    status: 'aktiv',
    to: '/settings/sport'
  }
]
