/**
 * Prüfungsbeispiele nach LISUM, Leistungsermittlung und Leistungsbewertung
 * im Sportunterricht, 2. überarbeitete Auflage (2020).
 * Quellenangabe: LISUM, CC BY-SA 4.0 DE; Hinweise sind sinngemäß formuliert.
 */
import { Sport } from '@viccoboard/core';

export interface SportAssessmentCriterion {
  id: string;
  name: string;
  description: string;
  choices: readonly number[];
  levels?: readonly { value: number; description: string }[];
}

export interface SportAssessment {
  id: string;
  sport: 'Basketball' | 'Volleyball';
  title: string;
  type: 'points' | 'holistic';
  diagram?: 'passing' | 'dribbling' | 'shooting' | 'serving';
  sourceId: string;
  sourcePages: string;
  task: string;
  instructions: readonly string[];
  criteria: readonly SportAssessmentCriterion[];
  scoreLabel?: string;
  noGradeReason?: string;
  gradeThresholds?: readonly { minimum: number; grade: number }[];
}

export interface SportAssessmentResult {
  totalPoints?: number;
  maxPoints?: number;
  percentage?: number;
  grade?: string;
}

const volleyballGradeThresholds = [
  { minimum: 9, grade: 1 },
  { minimum: 7, grade: 2 },
  { minimum: 5, grade: 3 },
  { minimum: 4, grade: 4 },
  { minimum: 2, grade: 5 },
  { minimum: 0, grade: 6 }
];

export const SPORT_ASSESSMENTS: readonly SportAssessment[] = [
  {
    id: 'passing-d',
    sport: 'Basketball',
    title: 'Basketball · Annehmen und Abspielen (D)',
    type: 'points',
    diagram: 'passing',
    sourceId: 'lisum-basketball-passing-d-2020',
    sourcePages: '108–111',
    task: 'Zwei Lernende laufen im vereinbarten Abstand nebeneinander von einer Grundlinie zur anderen und zurück. Während des Zweierlaufs passen und fangen sie den Ball.',
    instructions: [
      'Den seitlichen Abstand auf dem Hallenboden markieren; er muss Pässe in Bewegung ermöglichen.',
      'Strecke so wählen, dass jede Person mindestens vier Pässe pro Seite spielt.',
      'In beide Richtungen passen; beide Körperseiten sollen zum Einsatz kommen.',
      'Den Lauf beim Annehmen und Abspielen nicht unterbrechen.'
    ],
    criteria: [
      { id: 'bb-d-pass-accuracy', name: 'Präzision allgemein', description: 'Beobachte, ob der Ball kontrolliert und für die mitlaufende Person gut erreichbar zugespielt wird.', choices: [0, 1, 2] },
      { id: 'bb-d-pass-hands', name: 'Handhaltung', description: 'Beim Fangen werden die Hände trichterförmig vor den Ball gebracht, die Arme gestreckt und anschließend zum Abfedern gebeugt.', choices: [0, 1, 2] },
      { id: 'bb-d-pass-position', name: 'Position des Balles', description: 'Der Druckpass beginnt vor der Brust. Nach dem Fangen wird der Ball kontrolliert vor den Oberkörper geführt.', choices: [0, 1, 2] },
      { id: 'bb-d-pass-extension', name: 'Streckung Ellenbogen/Handgelenk', description: 'Beim Brustpass werden Ellenbogen und Handgelenke deutlich gestreckt; die Handgelenke klappen in Passrichtung ab.', choices: [0, 1, 2] },
      { id: 'bb-d-pass-shoulder', name: 'Drehung der Schulterachse', description: 'Die Schulterachse richtet sich zum Mitspieler beziehungsweise zur Mitspielerin aus.', choices: [0, 1, 2] },
      { id: 'bb-d-pass-steps', name: 'Regelkonforme Schritte', description: 'Während der Ball gehalten wird, werden höchstens zwei Schritte ausgeführt.', choices: [0, 1, 2] },
      { id: 'bb-d-pass-dynamics', name: 'Dynamik', description: 'Der Lauf bleibt auch bei Ballkontakten flüssig; Tempo und seitlicher Abstand bleiben erhalten. Dieses Merkmal ist mit maximal vier Punkten gewichtet.', choices: [0, 2, 4] }
    ],
    gradeThresholds: [
      { minimum: 15, grade: 1 },
      { minimum: 13, grade: 2 },
      { minimum: 10, grade: 3 },
      { minimum: 7, grade: 4 },
      { minimum: 3, grade: 5 }
    ],
    noGradeReason: 'Für 0–2 Punkte enthält Tabelle 62 keine ausdrückliche Note.'
  },
  {
    id: 'dribbling-d',
    sport: 'Basketball',
    title: 'Basketball · Spielobjekt führen (D)',
    type: 'holistic',
    diagram: 'dribbling',
    sourceId: 'lisum-basketball-dribbling-d-2020',
    sourcePages: '113–114',
    task: 'Dribble den Ball möglichst schnell und regelkonform von der Startlinie um eine Wendemarke herum zur Start-/Ziellinie zurück.',
    instructions: [
      'Startlinie und Wendemarke aufbauen; die Strecke muss eine klare Richtungsänderung enthalten.',
      'Regelkonformität, Dynamik und Ballsicherheit über den gesamten Weg beobachten.',
      'Die Handreichung nennt Zeitmessung als Alternative, aber hier keinen Zeit-Notenschlüssel.'
    ],
    criteria: [
      {
        id: 'bb-d-dribbling-rating',
        name: 'Qualitative Gesamtbeurteilung',
        description: 'Beurteile den gesamten Bewegungsablauf: kein Doppeldribbling oder erneutes Dribbling nach Festhalten, möglichst flüssige Richtungswechsel und sichere körpernahe Ballführung.',
        choices: [1, 2, 3, 4, 5],
        levels: [
          { value: 1, description: 'Keine erkennbaren Regelverstöße, sehr dynamische schnelle Bewegung auch an der Wendemarke, sichere körpernahe Ballführung ohne Ballverlust.' },
          { value: 2, description: 'Weitgehend regelkonform, überwiegend dynamisch und schnell, Ballführung überwiegend sicher.' },
          { value: 3, description: 'Nur vereinzelte Regelverstöße, langsamer, aber grundsätzlich dynamischer Ablauf und meist kontrollierte Ballführung.' },
          { value: 4, description: 'Häufige Regelverstöße, deutliches Abstoppen, mehrere Unsicherheiten oder Ballverluste.' },
          { value: 5, description: 'Deutliche Regelverstöße, häufiges Anhalten, keine sichere Ballkontrolle.' }
        ]
      }
    ]
  },
  {
    id: 'shooting-d',
    sport: 'Basketball',
    title: 'Basketball · Abschließen / Korbwürfe (D)',
    type: 'points',
    diagram: 'shooting',
    sourceId: 'lisum-basketball-shooting-d-2020',
    sourcePages: '115–118',
    task: 'Von fünf markierten Positionen A–E jeweils zweimal nach Anlauf mit Dribbling auf den Korb werfen: insgesamt zehn Würfe.',
    instructions: [
      'Die Abwurfpunkte A–E wie in Abbildung 23 markieren.',
      'Von jeder Position zwei Korbwürfe durchführen (insgesamt zehn).',
      'Für einen Korbtreffer zwei Punkte zählen, für einen Ringtreffer von oben einen Punkt, sonst null.',
      'Für Niveaustufe D ist in Tabelle 64 keine verbindliche quantitative Notenzuordnung angegeben.'
    ],
    criteria: ['A', 'B', 'C', 'D', 'E'].flatMap((position) =>
      [1, 2].map((attempt) => ({
        id: `bb-d-shot-${position.toLowerCase()}-${attempt}`,
        name: `Position ${position} · Wurf ${attempt}`,
        description: '2 Punkte: Korbtreffer. 1 Punkt: Ringtreffer von oben ohne Korberfolg. 0 Punkte: kein Treffer.',
        choices: [0, 1, 2]
      }))
    ),
    noGradeReason: 'Für Niveaustufe D ist in Tabelle 64 kein quantitativer Notenschlüssel aufgeführt.'
  },
  {
    id: 'tactics-d',
    sport: 'Basketball',
    title: 'Basketball · Taktisches Verhalten (D)',
    type: 'holistic',
    sourceId: 'lisum-basketball-tactics-d-2020',
    sourcePages: '118–120',
    task: 'Das taktische Verhalten während realer Spielsituationen beobachten: Defensivverhalten, Freilaufen und situationsgerechte Reaktionen.',
    instructions: [
      'Die Bewertung nach Tabelle 65 als qualitative Gesamtbeurteilung vornehmen, keine künstliche Punkteaddition.',
      'Mehrere Spielsituationen und möglichst unterschiedliche Gruppenkonstellationen beobachten.',
      'Die Beobachtung bei Bedarf an einem anderen Testtag fortsetzen.'
    ],
    criteria: [
      {
        id: 'bb-d-tactics-rating',
        name: 'Qualitative Gesamtbeurteilung',
        description: 'Beobachte, ob die Person defensiv mit dem Gegenspielenden mitläuft, sich offensiv freiläuft und Bewegungen anderer Spielender wahrnimmt und darauf angemessen reagiert.',
        choices: [1, 2, 3, 4, 5],
        levels: [
          { value: 1, description: 'In der Defensive konsequent mitlaufen, offensiv durchgängig freilaufen und Bewegungen häufig erkennen und sinnvoll beantworten.' },
          { value: 2, description: 'Defensiv und offensiv überwiegend aktiv, häufig situationsgerecht reagieren.' },
          { value: 3, description: 'Defensiv grundsätzlich mitlaufen, wiederholt freilaufen und meist angemessen reagieren.' },
          { value: 4, description: 'Nur vereinzelt defensiv folgen und offensiv freilaufen; selten passende Reaktionen erkennbar.' },
          { value: 5, description: 'Keine erkennbaren taktischen Aktionen, jedoch grundsätzliche Teilnahme am Spiel.' }
        ]
      }
    ]
  },
  {
    id: 'volleyball-serve-ef',
    sport: 'Volleyball',
    title: 'Volleyball · Aufschlag von unten (E/F)',
    type: 'points',
    diagram: 'serving',
    scoreLabel: 'Treffer',
    sourceId: 'lisum-volleyball-underhand-serve-ef-2020',
    sourcePages: '96',
    task: 'Zehn Aufschläge von unten in das gegnerische Spielfeld spielen; die Anzahl der gelungenen Aufschläge zählen.',
    instructions: [
      'Der Ball soll regelgerecht in das gesamte gegnerische Feld gespielt werden.',
      'Die Aufschlaglinie kann auf Niveaustufe E nach vorne verlegt werden, um die Distanz zu verringern.',
      'Zehn Versuche durchführen; 1 = Feld getroffen, 0 = nicht getroffen.',
      'Bewertung der Summe gemäß Tabelle 48, Niveaustufen E/F.'
    ],
    criteria: Array.from({ length: 10 }, (_, index) => ({
      id: `vb-ef-serve-${index + 1}`,
      name: `Aufschlag ${index + 1}`,
      description: '1 Treffer: Ball regelgerecht ins gegnerische Feld gespielt. 0 Treffer: Feld nicht erreicht oder anderer Fehlversuch.',
      choices: [0, 1]
    })),
    gradeThresholds: volleyballGradeThresholds
  },
  {
    id: 'volleyball-serve-gh',
    sport: 'Volleyball',
    title: 'Volleyball · Aufschlag von unten (G/H)',
    type: 'points',
    diagram: 'serving',
    scoreLabel: 'Treffer',
    sourceId: 'lisum-volleyball-underhand-serve-gh-2020',
    sourcePages: '96',
    task: 'Fünf Aufschläge von unten gerade in die vorgegebene Spielfeldhälfte, fünf diagonal in die andere Zielhälfte spielen.',
    instructions: [
      'Das gegenüberliegende Feld für die Bewertung in zwei Zielhälften unterteilen.',
      'Fünf Aufschläge gerade und fünf Aufschläge diagonal ausführen.',
      'Nur regelgerechte Aufschläge in die jeweils vorgegebene Hälfte zählen.',
      'Bewertung der zehn Versuche gemäß Tabelle 48, Niveaustufen G/H.'
    ],
    criteria: Array.from({ length: 10 }, (_, index) => ({
      id: `vb-gh-serve-${index + 1}`,
      name: `Aufschlag ${index + 1} · ${index < 5 ? 'gerade' : 'diagonal'}`,
      description: '1 Treffer: Aufschlag regelgerecht in die verlangte Spielfeldhälfte. 0 Treffer: kein gültiger Treffer im Zielfeld.',
      choices: [0, 1]
    })),
    gradeThresholds: volleyballGradeThresholds
  }
];

export function findSportAssessment(category: Sport.GradeCategory): SportAssessment | undefined {
  if (category.configuration.type !== 'criteria') return undefined;
  return SPORT_ASSESSMENTS.find((assessment) =>
    category.description === assessment.sourceId &&
    category.configuration.type === 'criteria' &&
    category.configuration.criteria.length === assessment.criteria.length &&
    category.configuration.criteria.every((criterion, index) =>
      criterion.id === assessment.criteria[index].id &&
      criterion.name === assessment.criteria[index].name &&
      criterion.description === assessment.criteria[index].description &&
      criterion.minValue === assessment.criteria[index].choices[0] &&
      criterion.maxValue === assessment.criteria[index].choices[assessment.criteria[index].choices.length - 1] &&
      criterion.weight === 1
    )
  );
}

export function evaluateSportAssessment(
  assessment: SportAssessment,
  scores: Readonly<Record<string, number>>
): SportAssessmentResult | null {
  for (const criterion of assessment.criteria) {
    if (!criterion.choices.includes(scores[criterion.id])) return null;
  }
  if (assessment.type === 'holistic') {
    return { grade: String(scores[assessment.criteria[0].id]) };
  }
  const totalPoints = assessment.criteria.reduce((sum, criterion) => sum + scores[criterion.id], 0);
  const maxPoints = assessment.criteria.reduce(
    (sum, criterion) => sum + criterion.choices[criterion.choices.length - 1], 0
  );
  const threshold = assessment.gradeThresholds?.find((item) => totalPoints >= item.minimum);
  return {
    totalPoints,
    maxPoints,
    percentage: Math.round((totalPoints / maxPoints) * 10000) / 100,
    grade: threshold ? String(threshold.grade) : undefined
  };
}
