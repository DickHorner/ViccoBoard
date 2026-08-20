import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_CHAPTER_6A: SeedEntry[] = [
  {
    name: 'Springen ohne Seil',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–40 Jahre',
    goal: 'Sprungtechnik, Schnelligkeit, Koordination',
    description: 'Vorübungen für das Seilspringen werden ohne Seil am Platz durchgeführt. Der Fokus liegt auf kurzen Absprüngen aus dem Sprunggelenk; anschließend werden Hüftdrehungen, kleine Ausfallschritte, Überkreuzbewegungen, Einbeinsprünge und schnelle Trippelschritte kombiniert.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 178.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Skipping/Tapping',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–40 Jahre',
    goal: 'Schnelligkeit, Reaktion, Koordination',
    description: 'Aus einer leicht gebeugten Grundposition werden sehr schnelle wechselseitige Bodenkontakte ausgeführt. Kurze Belastungsphasen werden durch klare Kommandos mit Sprüngen und vorgegebenen Landepositionen kombiniert.',
    variation: 'Tapping mit Hoch-Tief-Sprüngen oder Ausfallschritten verbinden und die Landeseite erst über das Kommando festlegen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 180.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Seilspringen',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–40 Jahre',
    material: '1 Seil pro TN',
    goal: 'Sprungkraft, Koordination',
    description: 'Das Seil wird überwiegend aus den Handgelenken geschwungen, während die Sprünge möglichst aus den Sprunggelenken erfolgen. Vom Grundsprung wird schrittweise zu Zwischensprüngen, Doppelschwüngen, Ausfallschritten, Hüftdrehungen und Einbeinsprüngen gesteigert.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 182.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Sprungvarianten am Seil',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–40 Jahre',
    material: '1–2 Seile pro TN, 1 Reifen pro TN',
    goal: 'Sprungkraft, Schnelligkeit, Koordination',
    description: 'Ein oder zwei Seile liegen als Linie, Kreis oder Kreuz auf dem Boden und definieren Sprungzonen. Die Teilnehmenden führen schnelle Schritt- und Sprungfolgen in vorgegebene Richtungen aus, ohne das Seil zu berühren.',
    variation: 'Mit Reifen statt Seilen arbeiten und beidbeinige, einbeinige, rotierende oder seitliche Sprungfolgen kombinieren.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 184.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Reifenspringen – In-Out',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–40 Jahre',
    material: '1 Reifen pro TN',
    goal: 'Schnelligkeit, Reaktion, Koordination',
    description: 'Ein Reifen wird senkrecht auf dem Boden angedreht. Solange er rollt bzw. rotiert, springt die Person wiederholt hinein und heraus, ohne den Reifen zu berühren; gezählt werden kontrollierte Wiederholungen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 186.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Reifenrollen',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–40 Jahre',
    material: '1 Reifen pro TN',
    goal: 'Schnelligkeit, Reaktion, Koordination',
    description: 'Der Reifen wird im lockeren Lauf neben dem Körper gerollt. Während der Bewegung wird der Fuß kurz durch den Reifen geführt und der Boden angetippt, ohne den Lauf des Reifens zu unterbrechen.',
    variation: 'Den Reifen frei rollen lassen und frontal oder rückwärts zum Reifen steppen und hineintippen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 188.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Reifenskipping',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–40 Jahre',
    material: '10–14 Reifen pro Station',
    goal: 'Schnelligkeit, Sprungkraft',
    description: 'Mehrere Reifen werden als lineare Sprungbahn ausgelegt. Die ersten Abschnitte werden beidbeinig oder im schnellen Wechselschritt durchlaufen, die letzten Reifen einbeinig absolviert.',
    variation: 'Das Absprungbein erst kurz vor dem einbeinigen Abschnitt ansagen oder indirekt über Zahlen bzw. andere Signale codieren.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 190.',
    sportType: 'Leichtathletik'
  },
  {
    name: 'Sprungvarianten am Medizinball (kleiner als 20 cm)',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 12–40 Jahre',
    material: '1 Medizinball pro TN oder 1 Medizinball pro Paar',
    goal: 'Sprungkraft, Koordination',
    description: 'Ein kleiner Medizinball dient als Hindernis und Orientierungspunkt. Auf Kommando werden schnelle Trippelbewegungen sowie Hoch-, Seiten- und Richtungswechsel-Sprünge um oder über den Ball ausgeführt.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 192.',
    sportType: 'Leichtathletik'
  }
];
