import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_CHAPTER_5A: SeedEntry[] = [
  {
    name: 'Mattenfußball',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–18 Jahre',
    material: '10–14 Turnmatten und 2 Fußbälle',
    goal: 'Taktik, genaues Fußballspiel',
    description: 'Turnmatten werden an den Hallenwänden als mehrere kleine Tore aufgestellt. Jede Person verteidigt ein Tor und versucht gleichzeitig, mit zwei Fußbällen andere Tore zu treffen, ohne das eigene ungeschützt zu lassen.',
    variation: 'Die Spielidee lässt sich mit den jeweiligen Regeln auch auf Handball oder Hockey übertragen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 114.',
    sportType: 'Fußball'
  },
  {
    name: 'Mixball',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–18 Jahre',
    material: '10–14 Turnmatten; 1 Fußball; 1 Handball',
    goal: 'Taktik, genaues Handball- und Fußballspiel',
    description: 'Aufbau wie beim Mattenfußball, jedoch werden gleichzeitig ein Fußball und ein Handball gespielt. Die Teilnehmenden müssen fortlaufend zwischen den beiden Techniken und Regelanforderungen wechseln und zugleich ihr eigenes Mattentor verteidigen.',
    variation: 'Treffer können je nach Ballart unterschiedlich gewertet werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 116.',
    sportType: 'Ballsport'
  },
  {
    name: 'Dribbel-König',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–18 Jahre',
    material: '1 Basketball, Fußball, Handball, Volleyball oder Gymnastikball pro TN',
    goal: 'Technik- und Regelschulung und Reaktionsvermögen',
    description: 'Alle dribbeln in einem begrenzten Feld mit eigenem Ball und schützen ihn, während sie versuchen, gegnerische Bälle aus dem Feld zu spielen. Wer den Ball verliert, wechselt in eine kleinere Folgerunde bzw. Zone.',
    variation: 'Nur mit einer vorgegebenen Hand oder einem Fuß dribbeln; verschiedene Ballarten oder Ballfarben gleichzeitig mit unterschiedlichen Techniken einsetzen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 118.',
    sportType: 'Ballsport'
  },
  {
    name: 'Zehnerball',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–40 Jahre',
    material: '1 Basketball, Handball oder Volleyball',
    goal: 'Mann- und Raumverteidigung bzw. Freilaufen und gezieltes Passen/Fangen',
    description: 'Ein Team versucht, zehn direkte Pässe in Folge zu spielen, ohne dass der Ball den Boden berührt. Das andere Team verteidigt eng, fängt Pässe ab und erzwingt Ballverluste. Zehn erfolgreiche Pässe ergeben einen Punkt.',
    variation: 'Andere Spielgeräte wie Frisbee, Medizinball oder Rugbyball einsetzen oder Passregeln an eine konkrete Sportart koppeln.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 120.',
    sportType: 'Ballsport'
  },
  {
    name: 'Partnerfußball',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–40 Jahre',
    material: '1 Fußball; 3–4 Leibchen, Seile oder kleine Reifen pro Team',
    goal: 'Freilaufen mit Partner bzw. Manndeckung, Timing und punktgenaues Passen',
    description: 'Fußball wird paarweise gespielt. Je zwei Spielende bleiben über ein Leibchen, Seil oder einen Reifen miteinander verbunden und müssen Laufwege, Deckung und Zuspiel gemeinsam koordinieren.',
    variation: 'Nach der Eingewöhnung kann mit zwei Fußbällen gleichzeitig gespielt werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 122.',
    sportType: 'Fußball'
  },
  {
    name: 'Mattenfußball (Zwei Teams gegeneinander)',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–40 Jahre',
    material: '10–14 Matten; 2 Fußbälle, Handbälle oder Hockeybälle; 10–14 Hockeyschläger',
    goal: 'Wechsel von Angriff zu Verteidigung, Teambildung bei „offenen“ Toren',
    description: 'Mehrere hochgestellte Turnmatten dienen als Tore. Zwei Teams verteidigen die Tore ihrer Hallenhälfte und greifen gleichzeitig die gegnerischen Tore an; bei einem Treffer wird die jeweilige Torposition gewechselt.',
    variation: 'Als Mattenhandball oder Mattenhockey spielen; alternativ paarweise organisieren.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 124.',
    sportType: 'Fußball'
  },
  {
    name: 'Brennball (Gruppenlauf)',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–18 Jahre',
    material: '6–8 Hütchen; 1 Tennisball, Frisbee-Scheibe, Fußball, Handball oder Basketball',
    goal: 'Sprintschnelligkeit und Kurzzeitausdauer sowie Raumübersicht',
    description: 'Ein Laufteam wirft den Ball ins Feld und versucht gemeinsam einen mit Hütchen markierten Rundkurs zu absolvieren. Das Feldteam bringt den Ball möglichst schnell in den Mittelkreis und schließt dort eine festgelegte Ballweitergabe ab, um den Lauf zu stoppen.',
    variation: 'Zeitlich begrenzen, kleinere Laufgruppen einsetzen oder Abschluss- und Passaufgaben an eine Ballsportart koppeln.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 126.',
    sportType: 'Ballsport'
  },
  {
    name: 'Frisbee-Golf',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–18 Jahre',
    material: '4 Frisbee-Scheiben; 4 Gymnastikmatten',
    goal: 'Kurzzeitausdauer und sicheres Werfen',
    description: 'Kleingruppen werfen eine Frisbee-Scheibe abwechselnd möglichst weit in Richtung Ziel und laufen jeweils geschlossen zur Landestelle. Von dort wirft die nächste Person weiter, bis die Zielzone erreicht ist.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 128.',
    sportType: 'Frisbee'
  }
];
