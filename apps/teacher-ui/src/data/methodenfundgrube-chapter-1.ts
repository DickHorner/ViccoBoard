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
    description: 'Jeder TN läuft für sich, aber nicht im Kreis, sondern durcheinander und jeder in seinem individuellen Tempo. Nach einigen Minuten gibt der ÜL das Kommando, „betont leise“ zu laufen. Dabei sollen die TN bewusst die Unterschiede in ihrem Laufstil wahrnehmen (z. B. kürzere Schrittlänge, bewusstes Abrollen über die Fußsohle, reduziertes Tempo, stärkere Beugung in Hüfte und Knie etc.). Nach ein bis zwei Minuten bewegt jeder TN sich wieder in seinem individuellen Tempo und Laufstil.',
    variation: 'Bei den Reaktions- und Stabilisationsübungen wird die Seite nicht mehr direkt angegeben, sondern „verschlüsselt“: Hierbei stehen z. B. gerade Zahlen für das rechte Standbein. Ebenso können Farben (z. B. Rot für das linke Standbein) oder Obst- und Gemüsesorten (z. B.',
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
    description: 'Die TN laufen durcheinander durch die Halle, jeder in seinem individuellen Laufstil und Tempo. Idealerweise haben sie bereits eine kurze Aufwärmübung ohne Partner absolviert (S. 18). Auf ein Kommando des ÜLs hin nehmen jeweils zwei TN eine kurze Berührung im Stand vor, laufen dann weiter und wiederholen die Übung mit neuen Partnern, bis der ÜL eine neue Berührungsaufgabe ankündigt. Beispielhafte Aufgaben: Rechte Hand/Schulter zu rechter Hand/Schulter Rechte Fußspitze/Ferse/Fußsohle zu rechter Fußspitze/Ferse/Fußsohle Rechtes, angewinkeltes Außenknie zu rechtem Außenknie (ohne Druck) Linkes, angewinkeltes Innenknie zu linkem Innenknie (mit Dru…',
    variation: 'Die Seitenangabe kann indirekt angegeben werden, z. B. über Zahlen (gerade Zahl = rechtes Standbein), Farben (rot = linkes Standbein) oder Obst/Gemüse (Gurke = Drehung rechtsherum).',
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
    description: 'Die TN bewegen sich in ihrem individuellen Laufstil und Tempo in der Halle. Die Hälfte der TN erhält dabei einen Ball. Auf Kommando wird nun der Ball immer aus der Laufbewegung an einen ballfreien TN übergeben. Das Kommando gibt dabei die Position bzw. Art und Weise der Übergabe vor und kann vom ÜL stetig gesteigert werden. 1. Der Ball wird übergeben und nicht geworfen, z. B.: „auf dem rechten Bein stehen“, „Ball unter dem rechten Bein übergeben“, „einmal vor der Übergabe um die Hüfte führen“. 2. Die ballfreien TN begeben sich nun auf Kommando in eine „Torposition“, z.',
    variation: 'Weitere Zuspielvarianten sind über den Kopf oder über den Oberschenkel möglich.',
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
    description: 'Diese Übung baut auf den vorangegangenen Aufwärmübungen auf, sollte also idealerweise damit verknüpft werden. Die TN laufen in ihrem individuellen Stil und Tempo durch die Halle. Die Hälfte der Gruppe trägt dabei einen Ball. Auf Kommando des ÜLs folgt die Ballübergabe an einen ballfreien TN im Sprung. Art und Weise der Übergabe wird dabei vom ÜL angesagt und kontinuierlich gesteigert: Mit beiden Händen Mit einer Hand Die Landung erfolgt auf einem Bein („1, 2, 3 und Sprung und rechts!“) Sprünge mit Drehungen Seitsprünge („Scheibenwischer“) mit Landung auf beiden oder auf nur einem Bein Fangen des Balls nach Seitenansage des Zuspielers Fangen u…',
    variation: 'Alle Seitenansagen des Ballzuspielers können auch indirekt vorgenommen werden (z. B. rechte Fanghand = gerade Zahl, linke Fanghand = ungerade Zahl).',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 26.',
    sportType: 'Allgemein'
  },
];
