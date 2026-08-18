/**
 * Built-in sport exercises adapted from Christian Koch,
 * Die große Methodenfundgrube Sport (Verlag an der Ruhr, 2015).
 *
 * Source records intentionally keep unknown duration/difficulty explicit instead of inventing values.
 */

import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_SEED_DATA: SeedEntry[] = [
  {
    name: 'Jeder für sich',
    category: 'erwaermung',
    phase: 'erwaermung',
    difficulty: 'unbekannt',
    duration: 0,
    ageGroup: 'ca. 6–60 Jahre',
    goal: 'Allgemeines und sportartspezifisches Aufwärmen mit Koordination und Reaktion',
    description:
      'Die Gruppe läuft frei in der Halle im jeweils eigenen Tempo. Auf Zuruf werden kurze Einbein-, Sprung- und Arm-Bein-Koordinationsaufgaben eingebaut; danach wird unmittelbar weitergelaufen.',
    variation:
      'Seiten nicht direkt ansagen, sondern über vereinbarte Codes wie gerade/ungerade Zahlen, Farben oder Begriffe verschlüsseln. Reaktionsaufgaben können zusätzlich mit geschlossenen Augen ausgeführt werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 20–21. Gruppengröße: ca. 10–30 TN.',
    sportType: 'Allgemein'
  },
  {
    name: 'Mit wechselnden Partnern',
    category: 'erwaermung',
    phase: 'erwaermung',
    difficulty: 'unbekannt',
    duration: 0,
    ageGroup: 'ca. 6–60 Jahre',
    goal: 'Allgemeines und sportartspezifisches Aufwärmen mit Koordination und Reaktion',
    description:
      'Alle laufen frei durch die Halle. Auf Kommando finden sich jeweils zwei Personen kurz zusammen und führen eine vorgegebene Kontakt- oder Koordinationsaufgabe aus, etwa Hand-, Fuß- oder Kniekontakt. Danach laufen beide weiter und suchen für das nächste Kommando neue Partner.',
    variation:
      'Die Kontaktaufgaben in Sprünge mit einbeiniger Landung, Drehungen oder seitlichen Sprüngen überführen. Seiten und Drehrichtungen können über Zahlen, Farben oder Begriffe codiert werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 22–23. Gruppengröße: ca. 10–30 TN.',
    sportType: 'Allgemein'
  },
  {
    name: 'Mit Ballübergabe im Stand',
    category: 'erwaermung',
    phase: 'erwaermung',
    difficulty: 'unbekannt',
    duration: 0,
    ageGroup: 'ca. 6–60 Jahre',
    material: '1 Ball für die Hälfte der TN',
    goal: 'Allgemeines und sportartspezifisches Aufwärmen mit Koordination und Reaktion',
    description:
      'Die Hälfte der Gruppe läuft mit Ball, die andere ohne. Auf Kommando wird der Ball an eine freie Person übergeben; die Übergabe wird mit vorgegebenen Stand-, Bein- oder Körperpositionen kombiniert. Im weiteren Verlauf können Zuspiele durch von Partnern gebildete Tore sowie Ballführung und Passformen mit dem Fuß hinzukommen.',
    variation:
      'Weitere Übergabe- und Zuspielwege einbauen, beispielsweise über Kopf, über den Oberschenkel oder indirekt über die Hallenwand.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 24–25. Gruppengröße: ca. 10–30 TN.',
    sportType: 'Allgemein'
  },
  {
    name: 'Mit Ballübergabe im Sprung',
    category: 'erwaermung',
    phase: 'erwaermung',
    difficulty: 'unbekannt',
    duration: 0,
    ageGroup: 'ca. 6–50 Jahre',
    material: '1 Ball für die Hälfte der TN',
    goal: 'Allgemeines und sportartspezifisches Aufwärmen mit Koordination und Reaktion',
    description:
      'Die Gruppe läuft frei; jede zweite Person trägt einen Ball. Auf Kommando erfolgt die Ballübergabe im Sprung an eine Person ohne Ball. Handwahl, Drehung, Fanghand und ein- oder beidbeinige Landung werden schrittweise variiert.',
    variation:
      'Fanghand und Landeseite nicht direkt nennen, sondern über vorher vereinbarte Zahlen- oder Begriffscodes auslösen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 26–27. Gruppengröße: ca. 10–30 TN.',
    sportType: 'Allgemein'
  }
];
