import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_CHAPTER_8: SeedEntry[] = [
  {
    name: 'B-A-S-Ko-K – Beweglichkeit',
    category: 'beweglichkeit',
    phase: 'hauptteil',
    difficulty: 'unbekannt',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'flexibles Maßband, Wand, Langbank oder Kasten, Turnmatte',
    goal: 'Aktive Beweglichkeit von Brustwirbelsäule, Schulter-/Brustbereich, hinterer Muskelkette und Hüfte erfassen',
    description: 'Die Testbatterie kombiniert fünf Messungen: Atemdifferenz im Brustkorbbereich, Arm-Wand-Abstand, Finger-Boden-Abstand, Finger-Wand-Abstand im Langsitz sowie aktive Hüftbeugung im Links-Rechts-Vergleich.',
    variation: 'Die gesamte Batterie oder einzelne Testelemente können für Gruppenvergleiche und zur Verlaufskontrolle wiederholt werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 270. Teil des B-A-S-Ko-K-Tests.',
    sportType: 'B-A-S-Ko-K-Test'
  },
  {
    name: 'B-A-S-Ko-K – Ausdauer',
    category: 'ausdauer',
    phase: 'hauptteil',
    difficulty: 'unbekannt',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: '400-m-Bahn oder markierter Rundkurs, Stoppuhr, Möglichkeit zur Pulsmessung, Borg-Skala',
    goal: 'Ausdauerleistung und individuelles Belastungsempfinden mit unterschiedlichen Lauf- und Walkingtests erfassen',
    description: 'Fünf Testformen stehen zur Auswahl: ein stufenweise gesteuerter 800-Meter-Individualtest mit Herzfrequenz und Borg-Wert, 12-Minuten-Lauf, 1000-Meter-Lauf, 800-Meter-Lauf sowie 2000-Meter-Walking. Bei längeren Belastungen können zusätzlich Erholungs-Herzfrequenzen dokumentiert werden.',
    variation: 'Je nach Alter, Belastbarkeit und Zielsetzung kann die passende Testform einzeln gewählt oder im Verlauf erneut durchgeführt werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 272. Teil des B-A-S-Ko-K-Tests.',
    sportType: 'B-A-S-Ko-K-Test'
  },
  {
    name: 'B-A-S-Ko-K – Schnelligkeit',
    category: 'schnelligkeit',
    phase: 'hauptteil',
    difficulty: 'unbekannt',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Wand, Maßband, 4 Hütchen, 9 × 9 m Feld, Stoppuhr',
    goal: 'Sprint- und Sprungleistung in vertikaler, horizontaler und richtungswechselnder Bewegung erfassen',
    description: 'Die Batterie umfasst Jump and Reach, beidbeinigen Weitsprung, einbeinigen Diagonalsprung sowie zwei 30-Sekunden-Sprinttests: Viereck-Sprint und Mitte-Ecke-Sprint. Gemessen werden je nach Test Sprunghöhe, Sprungweite, Strecke oder Wiederholungen.',
    variation: 'Einzelne Tests können separat eingesetzt und zu späteren Zeitpunkten unter gleichen Bedingungen wiederholt werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 274. Teil des B-A-S-Ko-K-Tests.',
    sportType: 'B-A-S-Ko-K-Test'
  },
  {
    name: 'B-A-S-Ko-K – Koordination',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'unbekannt',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Turnmatte, 9-m-Linie, Stoppuhr',
    goal: 'Statische und dynamische Koordination sowie Rumpf- und Standstabilität vergleichen',
    description: 'Fünf 30-Sekunden-Aufgaben prüfen unterschiedliche koordinative Anforderungen: ipsilateraler Vierfüßler, ipsilateraler Unterarmstütz, Einbeinstand mit gegenläufiger Arm-/Beinbewegung, Einbeinstandwaage sowie Hopserlauf vorwärts und rückwärts. Die Ausführungsqualität wird im Links-Rechts-Vergleich bewertet, soweit der Test dies vorsieht.',
    variation: 'Die Aufgaben können einzeln genutzt oder als vollständige Koordinationsbatterie dokumentiert werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 276. Teil des B-A-S-Ko-K-Tests.',
    sportType: 'B-A-S-Ko-K-Test'
  },
  {
    name: 'B-A-S-Ko-K – Kraft',
    category: 'kraft',
    phase: 'hauptteil',
    difficulty: 'unbekannt',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Reckstange oder Barrenholm, Turnmatte, kleiner Kasten, Sprossenwand, Stoppuhr',
    goal: 'Rumpf-, Schulter-/Arm-, Rücken- und Beinkraft mit standardisierten 30-Sekunden-Aufgaben erfassen',
    description: 'Die Kraftbatterie besteht aus schrägem Klimmzug, wechselndem langen Seitstütz, langem Liegestütz, einbeiniger Kniebeuge vom kleinen Kasten und langem Beinheben an der Sprossenwand. Gewertet werden korrekte Wiederholungen beziehungsweise der Seitenvergleich.',
    variation: 'Einzelne Krafttests können separat oder gemeinsam als Batterie zur wiederholten Leistungskontrolle eingesetzt werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 278. Teil des B-A-S-Ko-K-Tests.',
    sportType: 'B-A-S-Ko-K-Test'
  }
];
