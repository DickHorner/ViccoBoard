import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_CHAPTER_5D: SeedEntry[] = [
  {
    name: 'Kempaball – nur drei Schritte mit Ball laufen',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–18 Jahre',
    material: '1 weicher Fußball; 3–5 Leibchen',
    goal: 'Doppelpass, 3er-Schritt-Regel, Kempawurf',
    description: 'Kleine Teams passen einen weichen Fußball mit maximal drei Schritten pro Ballbesitz. Ein Punkt entsteht, wenn ein Mitspieler den Ball im Sprung fängt und noch vor der Landung kontrolliert gegen die Wand spielt.',
    variation: 'Wand- und Handballtortreffer unterschiedlich werten oder verlangen, dass der Ball bereits vor der Landung weitergespielt wird.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 162.',
    sportType: 'Ballsport'
  },
  {
    name: 'Taktikball',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–18 Jahre',
    material: '1 Fußball; 3–5 Leibchen',
    goal: 'Reaktion, Taktik, variables Spielverständnis',
    description: 'Kleine Teams entscheiden situationsabhängig zwischen zwei Abschlussformen: einem direkten Kopfball gegen die Wand aus kurzer Distanz oder einem Kempawurf, bei dem der Ball im Sprung gefangen und vor der Landung gegen die Wand gespielt wird. Mit Ball sind maximal drei Schritte erlaubt.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 164.',
    sportType: 'Ballsport'
  },
  {
    name: 'Rugby – „Touch Down“ auf der Matte',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–18 Jahre',
    material: '2 Weichbodenmatten; 1 Medizinball oder 1 Rugby-Ball',
    goal: 'Freilaufen, sicheres Zuspiel zum Mitspieler sowie Freilaufen für das Rückspiel',
    description: 'Kleine Teams passen einen Medizin- oder Rugbyball nach vorn bzw. seitlich und dürfen mit Ball höchstens drei Schritte laufen. Ein Touchdown zählt, wenn der Ball kontrolliert auf einer Weichbodenmatte in der gegnerischen Endzone abgelegt wird.',
    variation: 'Mehrere Zielmatten anbieten oder je Team eine feste zusätzliche Anspielstation im Mittelkreis einrichten.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 166.',
    sportType: 'Rugby'
  },
  {
    name: 'Blindball – Ball über die Matte',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 6–14 Jahre',
    material: '3–4 Weichbodenmatten; 4 Kästen; 6 Bälle',
    goal: 'Reaktion, Schnelligkeit, kreatives Passspiel (kurz vs. weit)',
    description: 'Hochgestellte Weichbodenmatten verdecken den Blick zwischen zwei Teams. Beide Seiten versuchen mit mehreren Bällen so über die Barriere zu spielen, dass die Bälle im gegnerischen Feld den Boden berühren, während die Gegenseite die Flugbahnen antizipiert und fängt.',
    variation: 'Unterschiedliche Ballarten mit jeweils passender Zuspieltechnik, Pezzibälle oder Frisbee-Scheiben verwenden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 168.',
    sportType: 'Ballsport'
  },
  {
    name: 'Fliehendes Tor',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–18 Jahre',
    material: '1 Handball oder Basketball; 5–7 Leibchen; pro Team 2 Hockeyschläger als Tor',
    goal: 'Reaktion, genaues Passspiel, Freilaufen',
    description: 'Je zwei Spielende eines Teams bilden mit einem quer gehaltenen Hockeyschläger ein bewegliches Tor. Die Feldspielenden versuchen, den Hand- oder Basketball kontrolliert durch das ständig wandernde gegnerische Tor zu spielen.',
    variation: 'Die Halle für mehrere parallele Kleinfeldspiele teilen und anschließend sportartspezifische Schrittregeln ergänzen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 170.',
    sportType: 'Ballsport'
  },
  {
    name: 'Zahlenball (Reaktionsduelle)',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–40 Jahre',
    material: '1 Basketball, 1 Handball, 1 Fußball; 5 Leibchen',
    goal: 'Reaktion, Umschalten von Angriff zu Verteidigung, Antizipation',
    description: 'Beide Teams vergeben ihren Spielenden gleiche Nummern. Die Lehrkraft ruft eine Nummer und bringt gleichzeitig einen bestimmten Ball ins Feld; die aufgerufenen Personen spielen sofort ein kurzes sportartspezifisches Duell bis zum Abschluss.',
    variation: 'Mehrere Nummern oder mehrere Ballarten gleichzeitig aufrufen; alternativ Ballfarben mit unterschiedlichen Spieltechniken verknüpfen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 172.',
    sportType: 'Ballsport'
  },
  {
    name: 'Viereck-Fußball',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–18 Jahre',
    material: '4 Fußbälle; 4 Kastenteile oder 8 Hütchen; 3–5 Leibchen pro Team',
    goal: 'schnelles Umschalten von Angriff zu Verteidigung, Reaktion, Raumüberblick',
    description: 'Vier Teams besitzen jeweils ein Tor in einer Hallenecke. Mit mehreren Fußbällen gleichzeitig greift jedes Team die drei fremden Tore an und muss zugleich das eigene Tor aus mehreren Richtungen verteidigen.',
    variation: 'Nur fest zugeordnete Gegner oder Bälle verwenden oder statt Toren erhöhte Zielbälle auf Hütchen abschießen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 174.',
    sportType: 'Fußball'
  }
];
