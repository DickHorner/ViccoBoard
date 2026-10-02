import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_CHAPTER_1: SeedEntry[] = [
  {
    name: 'Jeder für sich',
    tags: ['Aufwärmen', 'Allgemein'],
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 0,
    ageGroup: 'ca. 6–60 Jahre, alle Sportarten sowie Breitensport, Gesundheitssport, Leistungssport',
    goal: 'allgemeines und sportartspezifisches Aufwärmen in Verbindung mit Koordination und Reaktion',
    description: 'Alle laufen frei und in individuellem Tempo durch die Halle, zunächst auch einmal bewusst „betont leise“, um Unterschiede im eigenen Laufstil wahrzunehmen. Danach folgen auf Zuruf jeweils nur ein bis zwei Sekunden lange Reaktions- und Stabilisationsaufgaben wie Einbeinstand, Sprünge in bestimmte Richtungen oder Arm-Bein-Kombinationen; anschließend wird direkt weitergelaufen. Später werden die Seiten nicht mehr direkt genannt, sondern etwa über gerade/ungerade Zahlen, Farben oder Begriffe codiert.',
    variation: 'Seitenangaben werden indirekt über Zahlen, Farben oder Begriffe codiert; zusätzlich können Reaktionsaufgaben mit geschlossenen Augen ausgeführt werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 20.',
  },
  {
    name: 'Mit wechselnden Partnern',
    tags: ['Aufwärmen', 'Allgemein'],
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 0,
    ageGroup: 'ca. 6–60 Jahre, alle Sportarten sowie Breitensport, Gesundheitssport, Leistungssport',
    goal: 'allgemeines und sportartspezifisches Aufwärmen in Verbindung mit Koordination und Reaktion',
    description: 'Alle laufen frei durch die Halle. Auf ein Kommando finden sich spontan zwei Personen zusammen, führen eine kurze vorgegebene Partneraktion aus und laufen sofort wieder weiter, sodass beim nächsten Signal neue Paare entstehen. Möglich sind Hand-, Schulter-, Fuß- oder Kniekontakte sowie Stand- und Sprungpositionen; die angesagte Seite kann zusätzlich über Zahlen, Farben oder Begriffe verschlüsselt werden.',
    variation: 'Seiten und Drehrichtungen können indirekt über Zahlen, Farben oder Begriffe angesagt werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 22.',
  },
  {
    name: 'Mit Ballübergabe im Stand',
    tags: ['Aufwärmen', 'Allgemein'],
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 0,
    ageGroup: 'ca. 6–60 Jahre, alle Sportarten sowie Breitensport, Gesundheitssport, Leistungssport',
    material: '1 Ball für die Hälfte der TN',
    goal: 'allgemeines und spezifisches Aufwärmen in Verbindung mit Koordination und Reaktion',
    description: 'Die Gruppe läuft frei durch die Halle, etwa die Hälfte mit Ball. Auf Kommando wird der Ball an eine ballfreie Person übergeben; dabei wird die Übergabe schrittweise anspruchsvoller: zunächst in vorgegebenen Standpositionen oder nach einer Zusatzbewegung, später durch von der Partnerperson gebildete „Tore“ wie Ausfallschritt, Grätsche oder Liegestütz. Anschließend kann auf Ballführung mit dem Fuß gewechselt werden, sodass Annahme- und Zuspielseite sowie weitere Zuspielarten vorgegeben werden.',
    variation: 'Weitere Übergaben können über Kopf oder Oberschenkel sowie über Wandkontakte erfolgen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 24.',
  },
  {
    name: 'Mit Ballübergabe im Sprung',
    tags: ['Aufwärmen', 'Allgemein'],
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 0,
    ageGroup: 'ca. 6–50 Jahre, alle Sportarten sowie Breitensport, Gesundheitssport, Leistungssport',
    material: '1 Ball für die Hälfte der TN',
    goal: 'allgemeines und sportartspezifisches Aufwärmen in Verbindung mit Koordination und Reaktion',
    description: 'Die Gruppe läuft frei durch die Halle, etwa die Hälfte mit Ball. Die Übergabe erfolgt auf Kommando im Sprung an eine ballfreie Person und wird schrittweise variiert: ein- oder beidhändig, mit Drehung, als Seitwärtsbewegung sowie mit ein- oder beidbeiniger Landung. Zusätzlich können Fanghand und Landeseite angesagt oder indirekt über Zahlen bzw. andere Codes bestimmt werden.',
    variation: 'Fang- und Landeseiten können indirekt, etwa über gerade und ungerade Zahlen, angesagt werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 26.',
  }
];
