import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_CHAPTER_7B: SeedEntry[] = [
  {
    name: 'Trampolin',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Trampolin, Kästen, Weichbodenmatte',
    goal: 'Sprungkoordination und sichere Landung',
    description: 'Der Geräteblock steigert Trampolinsprünge von einfachen Absprüngen und Landungen zu Drehungen, Kastensprüngen und Sprungkaskaden. Die Landeflächen werden durch Matten gesichert.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 238.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: 'Sprungbrett',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Sprungbrett, Turnmatten, Weichbodenmatten',
    goal: 'Sprungkraft und Sprungkoordination',
    description: 'Sprungbretter werden in einen Hallen-Rundlauf eingebaut. Nach einem etwa 10–15 Meter langen Anlauf wird abgesprungen und auf einer abgestuften Mattenfläche sicher gelandet; bei geringerem Niveau wird die Landefläche näher an das Brett gerückt.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 240.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: 'Weichbodenmatten',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Weichbodenmatten',
    goal: 'Kraftausdauer, Sprungkoordination und Gerätetraining',
    description: 'Geräteblock mit Weichbodenmatten als weicher, instabiler Untergrund für koordinative, sprung- und kraftorientierte Aufgaben.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 242.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: 'Gymnastikball',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Gymnastikball',
    goal: 'Ballkoordination und Gleichgewicht',
    description: 'Der Gymnastikball wird in Boden- und Rumpfübungen integriert, etwa beim kontrollierten Führen zwischen den Beinen, beim teilweisen Klappmesser und beim Bridging mit Ballführung unter der Hüfte.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 244.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: 'Medizinball – einfach, aber effektiv',
    category: 'kraft',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Medizinball',
    goal: 'Ganzkörperkraft und funktionelle Bewegungsmuster',
    description: 'Der Medizinball wird für funktionelle Kraftaufgaben verwendet, unter anderem für statische und dynamische Liegestützvarianten auf einem oder zwei Bällen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 246.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: 'Langhantel',
    category: 'kraft',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Langhantel',
    goal: 'Kraft, Körperspannung und Koordination',
    description: 'Geräteblock mit Langhantelübungen als Bestandteil funktioneller Kraftarbeit im Hallen- und Zirkelkontext.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 248.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: 'Piratenspiel',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–14 Jahre',
    material: 'alle verfügbaren Klein- und Großgeräte (siehe Fotos)',
    goal: 'Schnelligkeit, Koordination',
    description: 'Viele Klein- und Großgeräte werden als „Inseln“ in der Halle verteilt. Die Teilnehmenden bewegen sich von Gerät zu Gerät, ohne den Hallenboden als „Meer“ zu berühren; kurze Belastungsphasen und sichere Geräteabstände sind zentral.',
    variation: 'Jäger mit Leibchen einsetzen oder gefangene Personen auf Geräten festsetzen und durch Mitspielende befreien lassen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 250.',
    sportType: 'Fitness/Turnen'
  }
];
