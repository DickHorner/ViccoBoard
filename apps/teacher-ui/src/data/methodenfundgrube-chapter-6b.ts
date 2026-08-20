import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_CHAPTER_6B: SeedEntry[] = [
  {
    name: 'Sprungvarianten an der Langbank (kleiner als 30 cm)',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    material: '2–3 Langbänke je nach Gruppengröße',
    goal: 'Sprungkraft',
    description: 'An einer Langbank werden wechselseitige Boden-/Bankkontakte, Treppensprünge und seitliche Sprungfolgen ausgeführt. Die Übung kann am Ort oder entlang der Bank mit bewusstem Armeinsatz durchgeführt werden.',
    variation: 'Slides und Wechselsprünge ergänzen; dabei nur ein Außenfuß bzw. abwechselnd Boden und Bank berühren.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 194.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Sprungvarianten am Kasten (kleiner als 40 cm)',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    material: '4 Kästen oder 4 Kastenoberteile',
    goal: 'Sprungkraft',
    description: 'Seitlich zum niedrigen Kasten werden auf Kommando beidbeinige, einbeinige und gegrätschte Sprünge auf oder über das Gerät ausgeführt. Die größere Hindernishöhe steigert die Anforderungen gegenüber Seil, Reifen oder Langbank.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 196.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Viereck-Sprint',
    category: 'laufspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    material: '4 Hütchen oder Reifen pro Quadrat',
    goal: 'Sprintschnelligkeit',
    description: 'Vier Eckpunkte bilden ein Quadrat. Die Runde wird mit konstant nach vorn gerichteter Blickrichtung absolviert, während die Bewegungsform an jeder Seite wechselt: vorwärts sprinten, seitwärts steppen, rückwärts sprinten und zur Gegenseite seitwärts zurück.',
    variation: 'Zeit für eine Runde messen oder innerhalb einer festen Belastungszeit die maximal zurückgelegte Strecke erfassen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 198.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Mitte-Ecke-Sprint (halbes Volleyballfeld, 9 x 9 m)',
    category: 'laufspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    material: '4 Hütchen oder Reifen pro Quadrat',
    goal: 'Sprintschnelligkeit',
    description: 'Vom Mittelpunkt eines Quadrats werden nacheinander verschiedene Eckpunkte angesprintet und jeweils mit der Hand berührt. Derselbe Eckpunkt darf nicht zweimal direkt hintereinander gewählt werden.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 200.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Dreieck-Sprint (halbes Volleyballfeld, 9 x 9 m)',
    category: 'laufspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    material: '4 Hütchen oder Reifen pro Quadrat',
    goal: 'Sprintschnelligkeit',
    description: 'Die lange Diagonale wird gesprintet, die beiden kurzen Schenkel des Dreiecks werden mit schnellen Seitstepps zurückgelegt. Danach folgt dieselbe Kombination in Gegenrichtung.',
    variation: 'Zeit messen, Distanz innerhalb einer festen Belastungsdauer erfassen oder nach jeder Diagonale nur einen Seitenschenkel absolvieren.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 202.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Sprintübungen zu zweit',
    category: 'laufspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    goal: 'Schnelligkeit, Reaktion',
    description: 'Paare laufen nebeneinander; eine Person gibt Tempo und Bewegungsform vor, die andere versucht exakt auf gleicher Höhe zu bleiben. Auf dem Rückweg wechseln die Führungsrollen automatisch.',
    variation: 'Tempo progressiv steigern, überraschend in Kurzsprints wechseln oder Vorwärts-/Rückwärtssprints kombinieren; alternativ hintereinander reagieren.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 204.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Was macht der Vordermann?',
    category: 'laufspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    material: '2 Hütchen oder Seile',
    goal: 'Schnelligkeit, Reaktion',
    description: 'Vier bis acht Personen stehen hintereinander. Die vorderste Person bewegt sich mit Seitstepps zu einer Seite und zurück; die jeweils folgende Person muss spiegelbildlich in die Gegenrichtung reagieren.',
    variation: 'Kurze feste Belastungszeiten verwenden oder zusätzliche Armzeichen als zu spiegelndes Signal einbauen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 206.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Augen auf!',
    category: 'laufspiel',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    material: '1 Ball pro Gruppe',
    goal: 'Reaktion, Schnelligkeit',
    description: 'Eine Person steht in der Mitte eines Kreises oder Quadrats. Ein optisches Signal einer außenstehenden Person löst einen kurzen Sprint zu dieser Position und zurück in die Mitte aus; nach mehreren Signalen wird gewechselt.',
    variation: 'Akustische Zahlensignale nutzen oder den Rollenwechsel mit einem hochgeworfenen Ball und gleichzeitig genannter Zahl auslösen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 208.',
    sportType: 'Leichtathletik'
  }
];
