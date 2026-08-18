import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_CHAPTER_1: SeedEntry[] = [
  {
    name: 'Jeder für sich',
    category: 'erwaermung',
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 0,
    ageGroup: 'ca. 6–60 Jahre, alle Sportarten sowie Breitensport, Gesundheitssport, Leistungssport',
    goal: 'allgemeines und sportartspezifisches Aufwärmen in Verbindung mit Koordination und Reaktion',
    description: 'Alle laufen frei und in individuellem Tempo durch die Halle. Auf Kommandos werden Laufstil, Einbeinstand, Sprünge in vorgegebene Richtungen und Arm-Bein-Koordination kurz variiert, bevor das freie Laufen fortgesetzt wird.',
    variation: 'Seitenangaben werden indirekt über Zahlen, Farben oder Begriffe codiert; zusätzlich können Reaktionsaufgaben mit geschlossenen Augen ausgeführt werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 20.',
    sportType: 'Allgemein'
  },
  {
    name: 'Mit wechselnden Partnern',
    category: 'erwaermung',
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 0,
    ageGroup: 'ca. 6–60 Jahre, alle Sportarten sowie Breitensport, Gesundheitssport, Leistungssport',
    goal: 'allgemeines und sportartspezifisches Aufwärmen in Verbindung mit Koordination und Reaktion',
    description: 'Die Gruppe läuft frei durch die Halle. Auf Kommando finden sich jeweils kurz zwei Personen zusammen und führen eine vorgegebene Berührungs-, Stand- oder Sprungaufgabe aus; danach laufen beide weiter und suchen beim nächsten Signal neue Partner.',
    variation: 'Seiten und Drehrichtungen können indirekt über Zahlen, Farben oder Begriffe angesagt werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 22.',
    sportType: 'Allgemein'
  },
  {
    name: 'Mit Ballübergabe im Stand',
    category: 'erwaermung',
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 0,
    ageGroup: 'ca. 6–60 Jahre, alle Sportarten sowie Breitensport, Gesundheitssport, Leistungssport',
    material: '1 Ball für die Hälfte der TN',
    goal: 'allgemeines und spezifisches Aufwärmen in Verbindung mit Koordination und Reaktion',
    description: 'Die Hälfte der Gruppe läuft mit Ball, die andere ohne. Auf Kommando wird der Ball aus der Bewegung an eine ballfreie Person übergeben; die Übergabe wird schrittweise durch Standpositionen, Torformen des Partners oder sportartspezifische Ballführung erschwert.',
    variation: 'Weitere Übergaben können über Kopf oder Oberschenkel sowie über Wandkontakte erfolgen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 24.',
    sportType: 'Allgemein'
  },
  {
    name: 'Mit Ballübergabe im Sprung',
    category: 'erwaermung',
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 0,
    ageGroup: 'ca. 6–50 Jahre, alle Sportarten sowie Breitensport, Gesundheitssport, Leistungssport',
    material: '1 Ball für die Hälfte der TN',
    goal: 'allgemeines und sportartspezifisches Aufwärmen in Verbindung mit Koordination und Reaktion',
    description: 'Die Ballübergabe aus dem freien Lauf wird in den Sprung verlagert. Handzahl, Drehung, Landebein sowie Fanghand oder Landeseite werden über Kommandos variiert und miteinander kombiniert.',
    variation: 'Fang- und Landeseiten können indirekt, etwa über gerade und ungerade Zahlen, angesagt werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 26.',
    sportType: 'Allgemein'
  }
];
