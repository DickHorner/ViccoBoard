import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_CHAPTER_5B: SeedEntry[] = [
  {
    name: 'Umkehrstaffel – mit Gefühl',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–18 Jahre',
    material: '4 Frisbee-Scheiben; 4 Kästen, Matten oder Reifen',
    goal: 'Wurfgefühl und Zielgenauigkeit',
    description: 'Kleingruppen laufen staffelartig zu einer Wurflinie und versuchen, eine Frisbee-Scheibe gefühlvoll in eine definierte Zielzone zu werfen. Nach dem Wurf wird zur Gruppe zurückgelaufen und die nächste Person startet.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 130.',
    sportType: 'Ballsport'
  },
  {
    name: 'Ultimate – mit Wand oder Linie',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 14–40 Jahre',
    material: '1 Frisbee-Scheibe pro Team und 2 Handballtore oder 2 Fußballtore oder 2 Weichbodenmatten',
    goal: 'Freilaufen bzw. Raum-/Mannverteidigung und sicheres Passen/Fangen',
    description: 'Zwei Teams bewegen die Frisbee ohne Laufen mit der Scheibe über Pässe nach vorn. Punkte entstehen zunächst durch Würfe hinter eine Grundlinie oder an eine definierte Wandzone; Ballverluste wechseln den Besitz.',
    variation: 'Als anspruchsvollere Zielvorgabe können direkte Treffer in Handball- oder Fußballtore höher gewertet werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 132.',
    sportType: 'Frisbee'
  },
  {
    name: 'Ultimate in Zonen',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 14–40 Jahre',
    material: '1 Frisbee-Scheibe pro Team und 2 Handballtore oder 2 Fußballtore oder 2 Weichbodenmatten',
    goal: 'Freilaufen bzw. Raum-/Mannverteidigung und sicheres Passen/Fangen',
    description: 'Ultimate wird mit unterschiedlich wertvollen Zielzonen gespielt. Je tiefer bzw. präziser der erfolgreiche Wurf in die gegnerische Zone oder ins Tor gelangt, desto mehr Punkte erhält das Team.',
    variation: 'Später kann verlangt werden, die Scheibe innerhalb einer Zielzone kontrolliert zu fangen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 134.',
    sportType: 'Frisbee'
  },
  {
    name: 'Chaosball',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 14–40 Jahre',
    material: '1 Frisbee-Scheibe und 1 Pezziball®',
    goal: 'Reaktion, variables Spielverständnis',
    description: 'Zwei Teams spielen gleichzeitig mit einer Frisbee-Scheibe und einem Pezziball. Mit keinem Spielgerät darf gelaufen werden; beide müssen über kontrollierte Pässe im Team gehalten werden und besitzen eine eigene Passzählung.',
    variation: 'Zusätzliche Zielzonen oder Tore einführen; alternativ Frisbee mit Rugbyball kombinieren.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 136.',
    sportType: 'Ballsport'
  },
  {
    name: 'Treibball',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–18 Jahre',
    material: '3 Langbänke; 20 Hütchen und/oder Medizinbälle; ca. 10 Gymnastik-, Hand-, Fuß- oder Tennisbälle',
    goal: 'Treffsicherheit',
    description: 'Zwei Teams werfen von gegenüberliegenden Seiten auf Hütchen oder Medizinbälle, die auf Langbänken entlang der Mittellinie liegen. Ziel ist, die Gegenstände durch präzise Würfe in die gegnerische Hälfte zu bewegen.',
    variation: 'Nur indirekte Würfe über den Boden, Würfe im Einbeinstand oder Sprungwurf; alternativ mit Fußbällen schießen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 138.',
    sportType: 'Ballsport'
  },
  {
    name: 'Völkerball – so wie es jeder kennt',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 6–18 Jahre',
    material: '1 Softball',
    goal: 'Schulung des Wurfes bzw. genauen Zuspiels; Reaktion und Schnelligkeit',
    description: 'Zwei Teams stehen sich in getrennten Feldern gegenüber. Direkte Treffer schicken Spielende hinter bzw. neben das gegnerische Feld zum eigenen Strohmann; von dort können sie weiter am Abwurfspiel teilnehmen.',
    variation: 'Mit mehreren Bällen spielen oder große Pezzibälle einsetzen, wodurch Aufmerksamkeit, Taktik und Wurftechnik verändert werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 140.',
    sportType: 'Ballsport'
  },
  {
    name: 'Völkerball – mit zwei Kegeln',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 6–18 Jahre',
    material: '1 Softball; 2 Hütchen mit 2 Gymnastikbällen',
    goal: 'Schulung des Wurfes bzw. genauen Zuspiels, Reaktion und Schnelligkeit',
    description: 'Klassisches Völkerball wird um je ein Ziel im gegnerischen Feld ergänzt. Wird dieses Ziel getroffen, dürfen ausgeschiedene Mitspielende gemeinsam wieder ins Feld zurückkehren.',
    variation: 'Das Ziel darf alternativ nur aus dem Bereich hinter dem gegnerischen Feld getroffen werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 142.',
    sportType: 'Ballsport'
  },
  {
    name: 'Völkerball – mit zwei Matten',
    category: 'ballspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 6–18 Jahre',
    material: '1 Softball; 2 Turnmatten',
    goal: 'Schulung des Wurfes bzw. genauen Zuspiels, Reaktion und Schnelligkeit, Teamgeist und Taktik',
    description: 'Jedes Team hält im eigenen Feld eine Turnmatte als bewegliche Deckung aufrecht. Die Matte schützt vor Würfen, muss jedoch gemeinsam kontrolliert werden; fällt sie um, entsteht ein spielrelevanter Nachteil.',
    variation: 'Große Weichbodenmatten oder mobile Turnkästen als alternative Deckung verwenden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 144.',
    sportType: 'Ballsport'
  }
];
