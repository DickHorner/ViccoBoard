import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_CHAPTER_3: SeedEntry[] = [
  {
    name: 'Gassenaufstellung – paarweise ohne Ball',
    category: 'reaktionsspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–60 Jahre',
    goal: 'Koordination, Timing',
    description: 'Paare stehen sich in einer Gasse gegenüber. Auf wechselnde Kommandos springen beide gleichzeitig, berühren sich in der Luft und variieren anschließend Landung, Handkontakt, Drehung, Armeinsatz oder Gleichgewicht.',
    variation: 'Seiten- und Landekommandos indirekt über Zahlen oder Begriffe codieren und bei geeignetem Niveau einzelne Aufgaben mit geschlossenen Augen ausführen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 54.',
    sportType: 'Allgemein'
  },
  {
    name: 'Gassenaufstellung – paarweise mit einem Ball',
    category: 'reaktionsspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–60 Jahre',
    material: '1 Basketball, Handball, Fußball, Volleyball oder Gymnastikball pro Paar',
    goal: 'Reaktion, Timing, Ballgefühl und Sprungkraft',
    description: 'Paare stehen drei bis fünf Meter gegenüber und kombinieren Ballzuspiel mit Reaktions- und Sprungaufgaben. Begonnen wird mit leichteren indirekten Pässen über den Boden, danach werden direkte Zuspiele und weitere Kommandos ergänzt.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 56.',
    sportType: 'Allgemein'
  },
  {
    name: 'Gassenaufstellung – paarweise mit zwei Bällen',
    category: 'reaktionsspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–60 Jahre',
    material: '1 Ball pro TN',
    goal: 'Reaktion, Timing, Koordination',
    description: 'Beide Partner besitzen einen Ball und spielen gleichzeitig, ohne dass sich die Flug- oder Rollwege kreuzen. Ein gemeinsames akustisches Timing unterstützt synchrones Passen und Fangen.',
    variation: 'Direkte und indirekte Pässe, Einbeinstand, Hand-/Fußzuspiel oder gezielt kreuzende Zuspielmuster kombinieren.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 58.',
    sportType: 'Allgemein'
  },
  {
    name: 'Vorübungen zum Fangen über Kreuz',
    category: 'reaktionsspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–60 Jahre',
    material: '2 Tücher, 2 Tennisbälle, 2 Sandbällchen oder 2 Gymnastikbälle pro TN',
    goal: 'das Fangen von 2 Bällen über Kreuz selbstständig üben',
    description: 'Das Überkreuzfangen wird zunächst mit langsam fallenden Tüchern eingeübt. Anschließend folgen zwei parallel aufspringende bzw. hochgeworfene Bälle, die mit gekreuzten Armen kontrolliert gefangen werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 60.',
    sportType: 'Allgemein'
  },
  {
    name: 'Gassenaufstellung – paarweise mit Tüchern',
    category: 'reaktionsspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–60 Jahre',
    material: '3–5 verschiedenfarbige Tücher pro Paar',
    goal: 'Reaktion und Koordination',
    description: 'Mehrere verschiedenfarbige Tücher werden gleichzeitig hoch zum Partner geworfen. Mit dem Wurf wird eine Farbe angesagt; nur das passende Tuch darf gefangen werden, die übrigen werden ignoriert.',
    variation: 'Mehrere Farben, vorgegebene Fanghand oder Standbein sowie andere Signalträger wie Ballons oder Bälle einsetzen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 62.',
    sportType: 'Allgemein'
  },
  {
    name: '„Give and Go“ (Pass und Rückpass/Doppelpass)',
    category: 'reaktionsspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–60 Jahre',
    material: '1 Gymnastikball oder Basketball, Handball, Fußball oder Volleyball für die Hälfte der TN',
    goal: 'Konzentration, Reaktion, zielgenaues Zuspiel',
    description: 'Eine Gassenseite passt gleichzeitig und rückt danach um eine Position weiter. Die Gegenseite bleibt stehen und spielt den Ball sofort zum jeweils neu gegenüberstehenden Partner zurück; am Reihenende wird zur freien Startposition gesprintet.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 64.',
    sportType: 'Allgemein'
  },
  {
    name: 'Zick-Zack-Pässe',
    category: 'reaktionsspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–60 Jahre',
    material: '4–8 unterschiedliche Bälle (Fußbälle, Basketbälle, Handbälle, Volleybälle)',
    goal: 'Konzentration, Reaktion, genaues Zuspiel',
    description: 'In der Gasse wird nicht gerade zum Gegenüber, sondern diagonal zum jeweils versetzten Partner gepasst. Nach sicherem Ablauf werden mehrere Bälle und unterschiedliche sportartspezifische Zuspieltechniken gleichzeitig eingesetzt.',
    variation: 'Ballfarben mit festen Passformen wie direkt, hoch, indirekt oder Fußpass verknüpfen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 66.',
    sportType: 'Allgemein'
  },
  {
    name: 'Kegelball',
    category: 'reaktionsspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–60 Jahre',
    material: '1 Ball pro Paar sowie 1 Basketball, Handball oder Fußball',
    goal: 'Konzentration, Timing, genaues Zuspiel',
    description: 'Ein Ball rollt längs durch die Gasse. Die gegenüberstehenden Paare passen gleichzeitig quer und versuchen den rollenden Ball mit ihrem Zuspiel zu treffen, ohne die vorgegebene Passrichtung zu verlassen.',
    variation: 'Basketball-, Handball- oder Fußballtechnik für die Querpässe verwenden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 68.',
    sportType: 'Allgemein'
  }
];
