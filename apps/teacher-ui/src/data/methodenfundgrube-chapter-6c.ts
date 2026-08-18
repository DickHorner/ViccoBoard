import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_CHAPTER_6C: SeedEntry[] = [
  {
    name: 'Zahlen sagen an',
    category: 'laufspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    goal: 'Sprintschnelligkeit, Reaktion, Brain Fitness',
    description: 'Eine zweistellige Zahl steuert zwei unterschiedlich lange Sprintstrecken: Die erste Ziffer bestimmt Wiederholungen bis zur näheren Linie, die zweite bis zur weiter entfernten Linie. Entscheidend ist die geschriebene Ziffernfolge, nicht die Reihenfolge der gesprochenen Zahlwörter.',
    variation: 'Gerade und ungerade Ziffern zusätzlich mit Vorwärts- bzw. Rückwärtssprints koppeln.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 210.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Sprinte nach dem Ball!',
    category: 'laufspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 14–40 Jahre',
    material: '1 Ball pro Paar',
    goal: 'Schnelligkeit, Reaktion, Antizipation',
    description: 'Eine Person wirft den Ball aus gemeinsamer Startposition mehrere Meter in Laufrichtung, die Partnerperson sprintet hinterher und versucht ihn vor einer festgelegten Anzahl von Bodenkontakten zu erreichen.',
    variation: 'Erlaubte Bodenkontakte schrittweise reduzieren, Ball seitlich spielen oder werfen lassen, ohne die Aktion vorher anzusagen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 212.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Zuspiel über die Wand',
    category: 'laufspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    material: '1 Ball pro Gruppe',
    goal: 'genaues Passspiel, Schnelligkeit',
    description: 'Eine Gruppe steht hintereinander vor der Hallenwand. Die vorderste Person spielt den Ball kontrolliert über Boden und Wand zur nächsten Person, weicht seitlich aus und reiht sich hinten wieder ein.',
    variation: 'Direkte Wandpässe mit verschiedenen Ballarten oder Ballannahme und Weiterspiel in der Luft durchführen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 214.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Rundlauf',
    category: 'laufspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    material: '1 Ball pro Gruppe',
    goal: 'genaues Passspiel, Timing, Schnelligkeit',
    description: 'Zwei Gruppen stehen sich gegenüber. Nach jedem Zuspiel sprintet die werfende bzw. passende Person zur gegenüberliegenden Seite und reiht sich dort ein; die Laufrichtung bleibt für alle gleich.',
    variation: 'Vorgegebene Lauf-ABC-Formen einsetzen oder Pässe über Hallenwand bzw. Basketballbrett spielen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 216.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Drei zu vier (Volleyballfeld, 9 x 9 m)',
    category: 'laufspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–40 Jahre',
    material: '1 Ball pro Gruppe',
    goal: 'Schnelligkeit',
    description: 'Drei Personen besetzen drei Ecken eines Quadrats. Nach einem Pass sprintet die passgebende Person in die freie vierte Ecke; anschließend wird nach demselben Prinzip weitergespielt.',
    variation: 'Pass unmittelbar nach Ballannahme erlauben oder Laufwege mit Seitstepps, Anfersen, Kniehebelauf bzw. Sprint kombinieren.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 218.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Reifen besetzt',
    category: 'laufspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–40 Jahre',
    material: '1 Reifen pro TN',
    goal: 'Schnelligkeit, Reaktion, Antizipation',
    description: 'Fast alle Reifen eines Kreises sind besetzt, ein Reifen bleibt frei. Eine Person versucht den freien Platz zu erreichen, während die übrigen durch schnelle Positionswechsel verhindern, dass der freie Reifen erfolgreich übernommen wird.',
    variation: 'Angreifende Person innerhalb statt außerhalb des Kreises, mehrere Suchende oder nummerierte Reifen mit Ball- und Zahlensignal verwenden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 220.',
    sportType: 'Leichtathletik'
  }
];
