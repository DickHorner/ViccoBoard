/**
 * Basketball-Leistungsabnahmen nach LISUM, Leistungsermittlung und
 * Leistungsbewertung im Sportunterricht, 2. Auflage (2020), S. 108–114.
 * CC BY-SA 4.0 DE; Beobachtungshilfen sind sinngemäß formuliert.
 */
import { Sport } from '@viccoboard/core';

export interface BasketballCriterion {
  id: string;
  name: string;
  description: string;
  choices: readonly number[];
  levels?: readonly { value: number; description: string }[];
}

export interface BasketballAssessment {
  id: 'passing-d' | 'dribbling-d';
  title: string;
  type: 'points' | 'holistic';
  sourceId: string;
  sourcePages: string;
  task: string;
  instructions: readonly string[];
  criteria: readonly BasketballCriterion[];
  gradeThresholds?: readonly { minimum: number; grade: number }[];
}

export interface BasketballAssessmentResult {
  totalPoints?: number;
  maxPoints?: number;
  percentage?: number;
  grade?: string;
}

export const BASKETBALL_ASSESSMENTS: readonly BasketballAssessment[] = [
  {
    id: 'passing-d',
    title: 'Basketball · Annehmen und Abspielen (D)',
    type: 'points',
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
    ]
  },
  {
    id: 'dribbling-d',
    title: 'Basketball · Spielobjekt führen (D)',
    type: 'holistic',
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
  }
];

export function findBasketballAssessment(category: Sport.GradeCategory): BasketballAssessment | undefined {
  if (category.configuration.type !== 'criteria') return undefined;
  return BASKETBALL_ASSESSMENTS.find((assessment) =>
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

export function evaluateBasketballAssessment(
  assessment: BasketballAssessment,
  scores: Readonly<Record<string, number>>
): BasketballAssessmentResult | null {
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
