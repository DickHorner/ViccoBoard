import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_CHAPTER_7A: SeedEntry[] = [
  {
    name: 'Turnseile',
    category: 'kraft',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Turnseile',
    goal: 'Kraft, Körperspannung und Koordination',
    description: 'Turnseile werden als instabile Aufhängung für bekannte Kräftigungsübungen genutzt. Gezeigt werden unter anderem schräge Klimmzüge, Liegestützvarianten, Seitstütz/Liegestütz, Bauchroller und Bridging; die Instabilität erhöht die Anforderungen an Rumpfstabilität und Koordination.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 224.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: 'Turnringe',
    category: 'kraft',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Turnringe',
    goal: 'Kraft, Körperspannung und Koordination',
    description: 'Turnringe dienen als einfaches Schlingentraining in der Halle. Der Übungsblock kombiniert Liegestütz, Bridging, schräge Klimmzüge, Seit-/Liegestütz und Bauchroller mit erhöhter Rumpf- und Stützarbeit.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 226.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: 'Galeere',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Langbank, Turnringe, Turnmatten',
    goal: 'Gleichgewicht, Körperspannung und Koordination',
    description: 'Eine Langbank wird sehr niedrig in Turnringen aufgehängt und mit Matten gesichert. Auf der instabilen Bank werden sitzende oder stehende Balanceaufgaben, Ballzuspiel sowie Stützübungen durchgeführt.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 228.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: 'Ringe und Reckstange',
    category: 'kraft',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Turnringe, Reckstange, Turnmatten',
    goal: 'Kraft, Körperspannung und Koordination',
    description: 'Eine Reckstange wird niedrig in zwei Turnringen aufgehängt und mit Matten gesichert. Die instabile Konstruktion wird für Balancieren, paarweises Ballzuspiel sowie Druck- und Zugübungen wie Dips, Liegestütz und schräge Klimmzüge verwendet.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 230.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: 'Langbank',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Langbank',
    goal: 'Gleichgewicht und koordinative Ballaufgaben',
    description: 'Geräteblock mit Balance- und Koordinationsaufgaben an der Langbank, unter anderem Bankwaagen in Partneraufstellung mit seitlichem Ballzuspiel.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 232.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: 'Reckstange',
    category: 'kraft',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Reckstange',
    goal: 'Kraft, Körperspannung und Koordination',
    description: 'Geräteblock mit Kraft- und Stützübungen an der Reckstange. Die Übungsformen nutzen das vorhandene Turngerät für Zug-, Halte- und Körperspannungsarbeit.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 234.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: 'Medizinball – wackelig',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'nicht angegeben',
    material: 'Medizinball',
    goal: 'Gleichgewicht, Stabilisation und Koordination',
    description: 'Der Medizinball wird als instabile Stütz- oder Standfläche eingesetzt, um bekannte Übungen koordinativ anspruchsvoller zu machen und zusätzliche Stabilisationsarbeit zu erzeugen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 236.',
    sportType: 'Fitness/Turnen'
  }
];
