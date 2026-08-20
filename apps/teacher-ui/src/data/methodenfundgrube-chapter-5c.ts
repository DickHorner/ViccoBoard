import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_CHAPTER_5C: SeedEntry[] = [
  {
    name: 'Völkerball – mit Zonen',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 6–18 Jahre',
    material: '1 Softball',
    goal: 'Schulung des Wurfes bzw. genauen Zuspiels, Reaktion und Schnelligkeit',
    description: 'Das Völkerballfeld wird in unterschiedliche Abwurfzonen gegliedert. Je nach Aufenthaltsbereich gelten verschiedene Regeln dafür, ob Spielende frontal aus dem Feld oder von außen getroffen werden dürfen.',
    variation: 'Die Zuständigkeit der Zonen kann umgekehrt werden, sodass Außen- und Feldspielende andere Zielbereiche erhalten.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 146.',
    sportType: 'Ballsport'
  },
  {
    name: 'Völkerball – anders herum',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 6–18 Jahre',
    material: '1 Softball',
    goal: 'Schulung des Wurfes bzw. genauen Zuspiels, Reaktion und Schnelligkeit',
    description: 'Zu Beginn stehen die Teams außerhalb ihres eigenen Feldes; zunächst befindet sich nur ein Strohmann darin. Wer einen gegnerischen Strohmann bzw. Feldspieler erfolgreich abwirft, darf ins eigene Feld wechseln. Gewonnen hat das Team, das zuerst vollständig im eigenen Feld steht.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 148.',
    sportType: 'Ballsport'
  },
  {
    name: 'Fußballtennis',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    material: '3 Langbänke und 1 Pezziball®',
    goal: 'Ballgefühl, sicheres Zuspiel; Reaktion',
    description: 'Eine methodische Fußballtennis-Variante beginnt mit niedrigen Langbänken als Netz und einem langsam springenden Pezziball. Dadurch bleibt mehr Zeit für Positionierung und kontrolliertes Zuspiel, bevor Material und Regeln schrittweise sportartspezifischer werden.',
    variation: 'Zielzonen und Netz-/Hindernishöhe steigern; anschließend auf weichen Fußball oder Volleyball und schließlich ein Volleyballnetz wechseln.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 150.',
    sportType: 'Fußball'
  },
  {
    name: 'Fußball nur mit Partner – ein Tor für den Angriff',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    material: 'Pezziball®; 2 Tore; 3–4 Leibchen je Farbe; 1 Fußball',
    goal: 'Timing, genaues Passspiel',
    description: 'Fußball wird ausschließlich in verbundenen Paaren gespielt; auch die Torwartposition ist paarweise organisiert. Zur Eingewöhnung dient zunächst ein Pezziball, später ein Fußball.',
    variation: 'Ein zusätzliches kleineres, nicht direkt betretbares Zieltor schafft weitere Angriffsoptionen und verändert die Raumaufteilung.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 152.',
    sportType: 'Fußball'
  },
  {
    name: 'Fußball klassisch – auf zwei Tore',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    material: '4 Tore; 2 Fußbälle; Leibchen für die Hälfte der TN',
    goal: 'Taktik, Raumübersicht',
    description: 'Reguläres Fußballspiel wird durch zwei unterschiedlich angeordnete Tore je Team oder zwei gleichzeitig eingesetzte Bälle erweitert. Dadurch bleiben Technik, Raumübersicht und taktische Entscheidungen trotz höherem Spieltempo im Vordergrund.',
    variation: 'Große und kleine Tore kombinieren, Tore an Rück- und Seitenwänden verteilen oder mit zwei Fußbällen spielen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 154.',
    sportType: 'Fußball'
  },
  {
    name: 'Basketball – Königball',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 8–14 Jahre, sportartspezifisch (Basketballhinführung) oder sportartunabhängig (Warm-up)',
    material: '2 Kästen oder Matten; 1 Basketball; 6 Leibchen',
    goal: 'Basketballregeln; weniger dribbeln vs. mehr passen sowie freilaufen',
    description: 'Zu jedem Team gehört ein „König“ in einer abgegrenzten Zielzone beim gegnerischen Korb; zusätzlich kann eine neutrale Anspielperson im Mittelkreis stehen. Diese sicheren Anspielstationen fördern Freilaufen und Passspiel gegenüber dauerhaftem Dribbling.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 156.',
    sportType: 'Basketball'
  },
  {
    name: 'Basketball – Zonenball',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 8–14 Jahre, sportartspezifisch (Basketballhinführung) oder sportartunabhängig (Warm-up)',
    material: '1 Basketball; 5 Leibchen',
    goal: 'keine Fernwürfe, Pass-/Dribbelspiel nah zum Basketballkorb',
    description: 'Basketball wird nach regulären Grundregeln gespielt, ein Korbwurf ist jedoch erst erlaubt, nachdem der Angriff den Ball in eine festgelegte Zone nahe der Grundlinie gebracht hat. Dadurch werden Freilaufen, Passen und Abschlüsse aus Korbnähe erzwungen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 158.',
    sportType: 'Basketball'
  },
  {
    name: 'Köpfchenball – nur zwei Schritte mit Ball laufen',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–18 Jahre',
    material: '1 weicher Fußball und 5 Leibchen',
    goal: 'Doppelpassspiel, Freilaufen vs. Manndecken',
    description: 'Kleine Teams passen einen weichen Fußball mit den Händen und dürfen mit Ball höchstens zwei Schritte laufen. Ein Punkt entsteht, wenn ein Mitspieler nahe der Wand so angespielt wird, dass er den Ball kontrolliert gegen die Wand köpfen kann.',
    variation: 'Drei Schritte erlauben, Tor- und Wandtreffer unterschiedlich werten oder das eigene Vorlegen zum Kopfball zulassen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 160.',
    sportType: 'Ballsport'
  }
];
