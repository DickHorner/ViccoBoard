/**
 * Local Sport Game Database — Seed Data
 *
 * A curated set of 30 games / exercises covering the most common categories.
 * These are loaded at first launch if the database is empty.
 * All entries have `isCustom: false` to distinguish them from teacher-created records.
 */

import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const GAME_SEED_DATA: SeedEntry[] = [
  // ── Erwärmung ──────────────────────────────────────────────────────────────
  {
    name: 'Zahlenball',
    tags: ['Aufwärmen', 'Allgemein'],
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 5,
    ageGroup: 'Klasse 5–10',
    material: '1 Ball',
    goal: 'Aktivierung, Reaktion und Koordination zu Beginn der Stunde',
    description:
      'Alle Spieler stehen im Kreis. Der Ball wird mit einer Zahl (z. B. 3) geworfen. Die Person, die den Ball fängt, muss sofort 3 mal springen, bevor sie weiterwirft.',
    variation: 'Unterschiedliche Regeln pro Zahl festlegen (z. B. 1 = drehen, 2 = klatschen).',
  },
  {
    name: 'Kettenfangen',
    tags: ['Aufwärmen', 'Allgemein'],
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 8,
    ageGroup: 'Klasse 5–7',
    material: '',
    goal: 'Ausdauer, soziale Kooperation, Laufen',
    description:
      'Eine Person beginnt als Fänger. Jede gefangene Person hält sich an der Hand des Fängers fest, sodass eine Kette entsteht. Nur die Enden der Kette dürfen fangen.',
    variation: 'Ab 8 Personen darf sich die Kette in zwei Gruppen aufteilen.',
  },
  {
    name: 'Tigerball',
    tags: ['Aufwärmen', 'Allgemein'],
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 6,
    ageGroup: 'Klasse 5–8',
    material: '1–2 Softbälle',
    goal: 'Reaktion, Abwehren, Aufwärmen',
    description:
      'Alle bewegen sich in einem begrenzten Feld. Ein Spieler hat einen Ball und versucht, andere unterhalb der Hüfte zu treffen. Wer getroffen wird, sitzt kurz aus oder wird selbst zum Werfer.',
  },
  {
    name: 'Bewegliche Staffel',
    tags: ['Aufwärmen', 'Leichtathletik'],
    phase: 'erwaermung',
    difficulty: 'fortgeschrittene',
    duration: 10,
    ageGroup: 'Klasse 5–12',
    material: 'Hütchen, Markierungen',
    goal: 'Koordination, Reaktion, Teamarbeit',
    description:
      'Staffeln mit 4–5 Personen laufen über einen Parcours mit Hütchen, Slalom und kurzen Sprint-Abschnitten. Übergabe per Handberührung.',
    variation: 'Hindernisse variieren; rückwärts laufen; mit Ball.',
  },
  // ── Laufspiel ──────────────────────────────────────────────────────────────
  {
    name: 'Farbenlauf',
    tags: ['Laufspiel', 'Allgemein'],
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 8,
    ageGroup: 'Klasse 5–7',
    material: 'Farbige Hütchen (4 Farben)',
    goal: 'Reaktion, Ausdauer, Orientierung',
    description:
      'Vier farbige Hütchen stehen in den Ecken der Halle. Die Lehrkraft ruft eine Farbe – alle rennen dorthin. Wer zuletzt ankommt, macht 5 Liegestütze.',
    variation: 'Zwei Farben gleichzeitig nennen; rückwärts laufen.',
  },
  {
    name: 'Räuber und Gendarm',
    tags: ['Laufspiel', 'Allgemein'],
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 10,
    ageGroup: 'Klasse 5–9',
    material: 'Leibchen (2 Farben)',
    goal: 'Schnelligkeit, Strategie, Teamarbeit',
    description:
      'Zwei Teams: Räuber und Gendarmen. Gefangene Räuber stehen in einem "Gefängnis". Andere Räuber können Gefangene befreien, indem sie das Gefängnis berühren.',
  },
  {
    name: 'Schlangen fangen',
    tags: ['Laufspiel', 'Allgemein'],
    phase: 'hauptteil',
    difficulty: 'anfaenger',
    duration: 10,
    ageGroup: 'Klasse 5–7',
    material: 'Leibchen oder Bänder',
    goal: 'Reaktion, Schnelligkeit, Eins-gegen-Eins',
    description:
      'Jeder Spieler hat ein Band am Hosenbund (als "Schwanz"). Ziel ist es, fremde Bänder zu fangen, ohne den eigenen zu verlieren.',
    variation: 'Teams bilden: Welches Team hat nach 2 Minuten die meisten Bänder?',
  },
  // ── Ballspiel ──────────────────────────────────────────────────────────────
  {
    name: 'Völkerball (klassisch)',
    tags: ['Ballspiel', 'Ballsport'],
    phase: 'hauptteil',
    difficulty: 'anfaenger',
    duration: 20,
    ageGroup: 'Klasse 5–8',
    material: '2 Softbälle, Hallenfeldmarkierungen',
    goal: 'Werfen, Ausweichen, Teamstrategie',
    description:
      'Zwei Teams auf je einer Hälfte. Mit dem Ball unterkörper-treffen scheidet den Gegner aus. Getroffene gehen hinter die gegnerische Grundlinie und können dort weiter mitspielen.',
    variation:
      'Mit mehreren Bällen spielen; Getroffene werden zurückgerufen, wenn das eigene Team einen Ball fängt.',
  },
  {
    name: 'Brennball',
    tags: ['Ballspiel', 'Ballsport'],
    phase: 'hauptteil',
    difficulty: 'anfaenger',
    duration: 20,
    ageGroup: 'Klasse 5–7',
    material: '1 Ball, Hütchen als Mal',
    goal: 'Werfen, Laufen, Teamspiel',
    description:
      'Ein Team wirft, das andere fängt. Schläger wirft den Ball ins Spielfeld und läuft zur Brennbase. Das Fangteam versucht, den Ball zur Brennbase zu bringen, bevor der Läufer ankommt.',
  },
  {
    name: 'Prellball 3:3',
    tags: ['Ballspiel', 'Volleyball'],
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 20,
    ageGroup: 'Klasse 7–10',
    material: 'Volleyballnetz, Volleyball',
    goal: 'Prellen, Passen, Spielaufbau',
    description:
      'Je 3 Spieler auf einer Seite. Ball muss mindestens einmal auf dem Boden aufspringen, bevor er über das Netz gespielt wird. Maximal 3 Kontakte pro Seite.',
  },
  {
    name: 'Korbball-Staffette',
    tags: ['Ballspiel', 'Basketball'],
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 15,
    ageGroup: 'Klasse 7–10',
    material: 'Basketbälle, Körbe',
    goal: 'Dribbling, Korbwurf, Koordination',
    description:
      'Teams wechseln sich ab: Dribbling zum Korb, Layup oder Standwurf, Dribbling zurück. Das Team mit den meisten Treffern in 3 Minuten gewinnt.',
    variation: 'Verschiedene Wurfpositionen festlegen.',
  },
  {
    name: 'Torballturnier (vereinfacht)',
    tags: ['Ballspiel', 'Handball'],
    phase: 'hauptteil',
    difficulty: 'anfaenger',
    duration: 25,
    ageGroup: 'Klasse 5–8',
    material: '2 kleine Tore, 1 Handball',
    goal: 'Torschuss, Torhüten, Teamtaktik',
    description:
      'Kleinfeldspiel 4 gegen 4 mit kleinen Toren. Keine Torwartposition – jeder kann ins Tor. Fouls führen zu Freiwürfen.',
  },
  // ── Reaktionsspiel ─────────────────────────────────────────────────────────
  {
    name: 'Ampelspiel',
    tags: ['Reaktion', 'Allgemein'],
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 5,
    ageGroup: 'Klasse 5–7',
    material: 'Farbkarten (rot/gelb/grün)',
    goal: 'Reaktion, Schnelligkeit, Konzentration',
    description:
      'Grün = laufen, Gelb = gehen, Rot = stoppen. Die Lehrkraft zeigt die Karten in unregelmäßiger Reihenfolge. Wer bei Rot noch läuft, macht Liegestütze.',
    variation: 'Zusätzliche Farben mit anderen Bewegungen einführen.',
  },
  {
    name: 'Ninja-Reaktion',
    tags: ['Reaktion', 'Allgemein'],
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 8,
    ageGroup: 'Klasse 5–10',
    material: '',
    goal: 'Reaktion, Spannung, Spaß',
    description:
      'Alle stehen im Kreis, die Hände vor dem Körper. Gleichzeitig macht jeder eine einzelne Bewegung, um Hände zu vermeiden. Wer berührt wird, scheidet aus oder verliert eine Hand.',
  },
  {
    name: 'Zahlenspiel mit Körperteilen',
    tags: ['Reaktion', 'Allgemein'],
    phase: 'erwaermung',
    difficulty: 'anfaenger',
    duration: 7,
    ageGroup: 'Klasse 5–8',
    material: '',
    goal: 'Konzentration, Körperwahrnehmung, Reaktion',
    description:
      'Lehrkraft nennt eine Zahl (z. B. 3). Alle müssen sich in Gruppen mit genau dieser Anzahl zusammenfinden und 3 verschiedene Körperteile gemeinsam berühren (z. B. Ellenbogen-Knie-Fuß).',
    variation: 'Mit vorgegebenen Körperteilen; in Zeitlimit.',
  },
  // ── Koordination ───────────────────────────────────────────────────────────
  {
    name: 'Koordinationsparcours',
    tags: ['Koordination', 'Leichtathletik'],
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 15,
    ageGroup: 'Klasse 5–12',
    material: 'Koordinationsleiter, Hütchen, Reifen',
    goal: 'Koordination, Schnelligkeit, Konzentration',
    description:
      'Parcours aus Koordinationsleiter (verschiedene Schrittmuster), Hütchen-Slalom und Reifen-Sprüngen. Schüler absolvieren den Kurs in eigener Zeit, dann auf Zeit.',
    variation: 'Rückwärts laufen; mit Ball in der Hand.',
  },
  {
    name: 'Balancewettbewerb auf der Bank',
    tags: ['Koordination', 'Turnen'],
    phase: 'hauptteil',
    difficulty: 'anfaenger',
    duration: 10,
    ageGroup: 'Klasse 5–8',
    material: 'Turnbänke',
    goal: 'Gleichgewicht, Körperspannung, gegenseitiger Respekt',
    description:
      'Zwei Schüler stehen auf einer Bank und müssen aneinander vorbeigehen, ohne herunterzufallen. Sie dürfen sich gegenseitig stützen, aber nicht von der Bank schieben.',
  },
  {
    name: 'Jonglieren lernen (mit Tüchern)',
    tags: ['Koordination', 'Allgemein'],
    phase: 'hauptteil',
    difficulty: 'anfaenger',
    duration: 12,
    ageGroup: 'Klasse 5–9',
    material: '3 Jonglier-Tücher pro Schüler',
    goal: 'Auge-Hand-Koordination, Konzentration, Geduld',
    description:
      'Schrittweise Einführung: 1 Tuch werfen und fangen, dann 2 Tücher abwechselnd, schließlich 3 Tücher jonglieren. Lehrer demonstriert jeden Schritt.',
    variation: 'Mit Bällen statt Tüchern für Fortgeschrittene.',
  },
  // ── Kooperation ────────────────────────────────────────────────────────────
  {
    name: 'Menschliche Maschine',
    tags: ['Kooperation', 'Allgemein'],
    phase: 'hauptteil',
    difficulty: 'anfaenger',
    duration: 15,
    ageGroup: 'Klasse 5–10',
    material: '',
    goal: 'Kooperation, Kreativität, Körpergefühl',
    description:
      'Teams von 5–8 Personen bauen gemeinsam eine "Maschine" aus Körperbewegungen. Jede Person macht eine sich wiederholende Bewegung, alle sind miteinander verbunden.',
    variation: 'Teams präsentieren ihre Maschine; andere raten, was sie darstellt.',
  },
  {
    name: 'Blind führen',
    tags: ['Kooperation', 'Allgemein'],
    phase: 'hauptteil',
    difficulty: 'anfaenger',
    duration: 10,
    ageGroup: 'Klasse 5–10',
    material: 'Augenbinden',
    goal: 'Vertrauen, Kommunikation, Verantwortungsgefühl',
    description:
      'Ein Partner ist blind (Augenbinde), der andere führt ihn verbal und durch Berührungen durch einen Parcours. Dann Rollenwechsel.',
    notes: 'Sicherheit beachten – keine spitzen Gegenstände im Parcours.',
  },
  {
    name: 'Matte transportieren',
    tags: ['Kooperation', 'Allgemein'],
    phase: 'hauptteil',
    difficulty: 'anfaenger',
    duration: 10,
    ageGroup: 'Klasse 5–10',
    material: 'Turnmatten',
    goal: 'Teamarbeit, Krafteinsatz, Absprache',
    description:
      'Gruppen von 4–6 Schülern transportieren eine Turnmatte durch einen Parcours ohne sie abzulegen. Eine Person muss immer auf der Matte liegen/stehen.',
  },
  // ── Kraft ──────────────────────────────────────────────────────────────────
  {
    name: 'Kraftzirkel (Körpergewicht)',
    tags: ['Kraft', 'Fitness'],
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 20,
    ageGroup: 'Klasse 8–12',
    material: 'Matten, Stühle oder Kasten',
    goal: 'Grundkraftausdauer aller Muskelgruppen',
    description:
      'Zirkel mit 6–8 Stationen: Liegestütze, Kniebeugen, Ausfallschritte, Unterarmstütz (Plank), Situps, Trizepsdips, Klimmzugvariante, Bergsteiger. 30 Sek. Arbeit / 15 Sek. Wechsel.',
    variation: 'Gewichtswesten für Fortgeschrittene; Partnerübungen einbauen.',
  },
  {
    name: 'Armdrücken-Turnier',
    tags: ['Kraft', 'Fitness'],
    phase: 'hauptteil',
    difficulty: 'anfaenger',
    duration: 15,
    ageGroup: 'Klasse 7–12',
    material: 'Tische oder Boden',
    goal: 'Armkraft, Wettkampferlebnis',
    description:
      'Klassisches Armdrücken im K.-o.-System. Unterschiedliche Gewichtsklassen beachten. Alternativ: Arm drücken im Sitzen auf dem Boden (sicherer).',
    notes: 'Auf passende Gewichtsklassen achten. Nicht bei Gelenk-Vorbelastung.',
  },
  // ── Ausdauer ───────────────────────────────────────────────────────────────
  {
    name: 'Fartlek (Freies Intervallläufen)',
    tags: ['Ausdauer', 'Leichtathletik'],
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 20,
    ageGroup: 'Klasse 8–12',
    material: '',
    goal: 'Aerobe und anaerobe Ausdauer entwickeln',
    description:
      'Wechsel zwischen lockerem Dauerlauf und kurzen Sprints ohne festes Schema. Schüler wählen selbst den Zeitpunkt und die Intensität ihrer Sprints.',
    variation: 'Mit Musik: Tempo an den Beat anpassen.',
  },
  {
    name: 'Waldlauf mit Aufgaben',
    tags: ['Ausdauer', 'Leichtathletik'],
    phase: 'hauptteil',
    difficulty: 'anfaenger',
    duration: 25,
    ageGroup: 'Klasse 5–9',
    material: 'Aufgabenkarten an Stationen',
    goal: 'Ausdauer, Erholung in der Natur, Orientierung',
    description:
      'Schüler laufen durch den Wald/Park und stoppen an markierten Stationen für kurze Aufgaben (z. B. 10 Liegestütze, Gleichgewichtsübung, Kniebeugen). Tempo selbst wählen.',
    notes: 'Nur bei geeignetem Gelände. Aufsicht an Stationen.',
  },
  {
    name: 'Cooper-Test Vorbereitung',
    tags: ['Ausdauer', 'Leichtathletik'],
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 15,
    ageGroup: 'Klasse 9–12',
    material: '400-m-Bahn oder markierter Kurs',
    goal: 'Ausdauerleistung gezielt aufbauen',
    description:
      'Tempodauerlauf über 2000–2400 m mit gleichmäßigem Pace. Schüler lernen, ihr Tempo zu steuern und eine Laufstrategie zu entwickeln.',
    variation: 'Als Gruppenläufe mit Tempovorgabe.',
  },
  // ── Entspannung ────────────────────────────────────────────────────────────
  {
    name: 'Progressive Muskelentspannung',
    tags: ['Entspannung', 'Fitness'],
    phase: 'schluss',
    difficulty: 'anfaenger',
    duration: 8,
    ageGroup: 'Klasse 5–12',
    material: 'Matten',
    goal: 'Erholung, Körperwahrnehmung, Ruhe nach dem Sport',
    description:
      'Schüler liegen auf Matten. Anleitung: nacheinander Muskelgruppen maximal anspannen (5 Sek.) und dann loslassen. Von den Füßen bis zum Gesicht.',
  },
  {
    name: 'Partnerdehnprogramm',
    tags: ['Entspannung', 'Fitness'],
    phase: 'schluss',
    difficulty: 'anfaenger',
    duration: 10,
    ageGroup: 'Klasse 5–12',
    material: 'Matten',
    goal: 'Cooldown, Dehnung, Mobilität',
    description:
      'In Zweiergruppen dehnen: ein Partner hält sanft die Dehnung des anderen. Hüftbeuger, Oberschenkel vorne/hinten, Schultern, Rücken. Jede Position 20–30 Sek.',
    notes: 'Kommunikation zwischen den Partnern betonen – kein Überdehnen.',
  },
  // ── Sonstiges ──────────────────────────────────────────────────────────────
  {
    name: 'Frisbee-Golf',
    tags: ['Sonstiges', 'Freizeit'],
    phase: 'hauptteil',
    difficulty: 'anfaenger',
    duration: 25,
    ageGroup: 'Klasse 6–12',
    material: '1 Frisbee pro Schüler/Paar, Hütchen als Ziele',
    goal: 'Zielgenauigkeit, Spielfreude, draußen aktiv sein',
    description:
      'Hütchen werden als "Löcher" aufgestellt. Ziel: Frisbee in möglichst wenigen Würfen treffen. Punkte werden gezählt wie beim Golf.',
    variation: 'Teams; mit Hindernissen; indoor mit weichem Frisbee.',
  },
  {
    name: 'Dodgeball (ohne Ausscheiden)',
    tags: ['Ballspiel', 'Ballsport'],
    phase: 'hauptteil',
    difficulty: 'anfaenger',
    duration: 15,
    ageGroup: 'Klasse 5–9',
    material: '3–4 Softbälle',
    goal: 'Ausweichen, Werfen, Teamspiel, Spaß',
    description:
      'Klassisches Völkerball-Konzept, aber getroffene Schüler scheiden nicht aus – sie machen stattdessen 3 Kniebeugen und spielen weiter. Alle spielen die gesamte Zeit mit.',
    variation: 'Punkte für Treffer zählen statt Ausscheiden.',
  }
];
