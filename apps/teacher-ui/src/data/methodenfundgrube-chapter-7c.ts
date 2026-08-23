import type { Sport } from '@viccoboard/core';

type SeedEntry = Omit<Sport.GameEntry, 'id' | 'isCustom' | 'createdAt' | 'lastModified'>;

export const METHODENFUNDGRUBE_CHAPTER_7C: SeedEntry[] = [
  {
    name: 'Flitze-Flitz-Zirkel',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 10–14 Jahre',
    material: 'Trampoline, große Kästen, Weichbodenmatten (oder Niedersprungmatten), Langbänke und kleine Kästen, Turnmatten, Reifen, Turnseile, Reckstangen, Kastenmittelteile, Hütchen',
    goal: 'Schnelligkeit, Koordination',
    description: 'Ein Geräteparcours verbindet Springen, Balancieren, Klettern, Krabbeln, Rollen und Rutschen zu einer durchlaufenden Start-Ziel-Route. Stationen werden möglichst doppelt aufgebaut, damit zwei Personen parallel arbeiten können.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 252.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: '12 Monkeys – Power-Parcours',
    category: 'koordination',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 14–40 Jahre',
    material: 'Medizinbälle, Kastenmittelteile, Langbänke, Trampoline, Reckstangen, Weichbodenmatten (oder Niedersprungmatten), Matten, Reifen, Hütchen, Basketballbrett oder Turnringe',
    goal: 'Kurzzeitausdauer, Koordination, Schnelligkeit',
    description: 'Ein anspruchsvollerer Geräteparcours kombiniert koordinative Hindernisse mit athletischen Elementen, besonders für die Beinarbeit. Die Stationen werden paarweise aufgebaut und ohne Pause nacheinander durchlaufen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 254.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: 'Fitness-Koordinationszirkel',
    category: 'kraft',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 14–40 Jahre',
    material: 'Weichbodenmatten (oder Niedersprungmatten), Basketbälle, Gymnastikbälle, Pezzibälle®, Reckstangen, Matten, Seile, Kästen, Teppichfliesen, Medizinbälle, Langbank',
    goal: 'Kurzzeitausdauer, extensive Kraftausdauer, Koordination',
    description: 'Kraft- und Koordinationsstationen wechseln sich in einem klassischen Zirkel ab. Vorgesehen sind etwa 30 Sekunden Belastung und 30 Sekunden Wechsel/Pause; instabile Gerätevarianten erhöhen den koordinativen Anspruch bekannter Übungen.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 256.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: '„3-mal 10“ – Cross-fit „light“ 1',
    category: 'kraft',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 14–40 Jahre',
    material: 'Reckstange, Kasten, Sprossenwand, Langbank, Medizinbälle, Turnmatten, Turnringe, Weichbodenmatten, Seil',
    goal: 'Kurzzeitausdauer, extensive Kraftausdauer',
    description: 'Dreiergruppen arbeiten an Stationen mit jeweils drei funktionellen Übungen. Pro Übung werden zehn Wiederholungen absolviert; danach wechseln die Personen ohne längere Pause innerhalb der Station weiter.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 258.',
    sportType: 'Fitness/Turnen'
  },
  {
    name: '„three2five“ – Cross-fit „light“ 2',
    category: 'kraft',
    phase: 'hauptteil',
    difficulty: 'fortgeschrittene',
    duration: 0,
    ageGroup: 'ca. 14–40 Jahre',
    material: '3 Paar Turnringe, 3 Reckstangen, 3 Paar Kletterseile, 4 Medizinbälle, 3 Langbänke, Turnmatten',
    goal: 'Kurzzeitausdauer, extensive Kraftausdauer',
    description: 'Dreiergruppen absolvieren an jeder Station drei Übungen mit jeweils 30 Sekunden Belastung direkt hintereinander. Nach insgesamt 90 Sekunden folgt beim Stationswechsel eine kurze Erholung.',
    notes: 'Quelle: Christian Koch, Die große Methodenfundgrube Sport, S. 260.',
    sportType: 'Fitness/Turnen'
  }
];
