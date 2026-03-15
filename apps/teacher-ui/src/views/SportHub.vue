<template>
  <section class="subject-hub">
    <header class="page-header">
      <div>
        <h1>Sport</h1>
        <p class="subtitle">Fachspezifischer Arbeitsbereich für Bewertung, Tests, Tools und Statistiken. Klassen, Stunden und Anwesenheit bleiben fachneutral organisiert.</p>
      </div>
      <span class="summary-pill">{{ classCount }} aktive Klassen</span>
    </header>

    <section class="metrics-grid">
      <article class="metric-card">
        <strong>{{ gradeCategoryCount }}</strong>
        <span>Bewertungskategorien</span>
      </article>
      <article class="metric-card">
        <strong>{{ tableCount }}</strong>
        <span>Tabellen</span>
      </article>
      <article class="metric-card">
        <strong>{{ toolSessionCount }}</strong>
        <span>Tool-Sessions</span>
      </article>
      <article class="metric-card">
        <strong>{{ sportabzeichenStandardCount }}</strong>
        <span>Sportabzeichen-Standards</span>
      </article>
    </section>

    <div class="hub-grid">
      <RouterLink v-for="entry in entries" :key="entry.to" :to="entry.to" class="hub-card">
        <p class="eyebrow">{{ entry.eyebrow }}</p>
        <h2>{{ entry.title }}</h2>
        <p>{{ entry.description }}</p>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getSportBridge, useClassGroups } from '../composables/useSportBridge'
import type { ClassGroup } from '@viccoboard/core'

const classGroups = useClassGroups()
const SportBridge = getSportBridge()
const classes = ref<ClassGroup[]>([])
const loadError = ref<string | null>(null)
const gradeCategoryCount = ref(0)
const tableCount = ref(0)
const toolSessionCount = ref(0)
const sportabzeichenStandardCount = ref(0)

const entries = [
  {
    to: '/grading',
    eyebrow: 'Bewertung',
    title: 'Bewertung & Tests',
    description: 'Kategorien, Kriterien, Zeitnoten, Cooper, Shuttle-Run, Mittelstrecke, Sportabzeichen und BJS.'
  },
  {
    to: '/subjects/sport/tables',
    eyebrow: 'Tabellen',
    title: 'Tabellenverwaltung',
    description: 'Leistungstabellen importieren, aktivieren und als Bewertungsgrundlage hinterlegen.'
  },
  {
    to: '/subjects/sport/games',
    eyebrow: 'Datenbank',
    title: 'Spieldatenbank',
    description: 'Lokale Spiel- und Übungsdatenbank: suchen, filtern und im Unterricht nutzen.'
  },
  {
    to: '/subjects/sport/statistics',
    eyebrow: 'Statistiken',
    title: 'Statistiken',
    description: 'Anwesenheitsquoten, Leistungsübersichten und Tool-Nutzung auf einen Blick.'
  },
  {
    to: '/tools/timer',
    eyebrow: 'Tool',
    title: 'Timer & Multistop',
    description: 'Schneller Zugang zu Zeitmessung und Mehrfachstopps.'
  },
  {
    to: '/tools/scoreboard',
    eyebrow: 'Tool',
    title: 'Scoreboard',
    description: 'Spielstände live erfassen und präsentieren.'
  },
  {
    to: '/tools/teams',
    eyebrow: 'Tool',
    title: 'Teams & Turniere',
    description: 'Gruppen fair einteilen und Turnierpläne im Unterricht nutzen.'
  },
  {
    to: '/tools/tactics',
    eyebrow: 'Tool',
    title: 'Taktik & Feedback',
    description: 'Taktikboard und Feedbackmethoden für den laufenden Unterricht.'
  },
  {
    to: '/tools/dice',
    eyebrow: 'Tool',
    title: 'Würfeln',
    description: 'Zufallszahlen mit konfigurierbarem Bereich würfeln und Ergebnisse protokollieren.'
  },
  {
    to: '/tools/video-delay',
    eyebrow: 'Tool',
    title: 'Video Delay',
    description: 'Live-Kamerabild mit konfigurierbarem Delay und Annotations-Overlay fuer Bewegungsbeobachtung.'
  },
  {
    to: '/tools/tracking-basketball',
    eyebrow: 'Tool',
    title: 'Basketball Trefferquote',
    description: 'Echtzeit-Trefferzähler: Zielbereich im Kamerabild definieren und Treffer automatisch zählen.'
    to: '/tools/slow-motion',
    eyebrow: 'Tool',
    title: 'Slow Motion Analyse',
    description: 'Clips framegenau analysieren, Biomechanik-Marker setzen und Winkel berechnen.'
  },
  {
    to: '/subjects/sport/statistics',
    eyebrow: 'Auswertung',
    title: 'Statistiken',
    description: 'Anwesenheitsquoten, Leistungsübersicht und Tool-Nutzung im Überblick.'
  }
]

const classCount = computed(() => classes.value.filter((classGroup) => !classGroup.archived).length)

onMounted(async () => {
  try {
    classes.value = await classGroups.findAll()
    loadError.value = null
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Fehler beim Laden der Klassen.'
    classes.value = []
  }

  const [categories, tables, toolSessions, standards] = await Promise.all([
    SportBridge.gradeCategoryRepository.findAll(),
    SportBridge.tableDefinitionRepository.findAll(),
    SportBridge.toolSessionRepository.findAll(),
    SportBridge.sportabzeichenStandardRepository.findAll()
  ])

  gradeCategoryCount.value = categories.length
  tableCount.value = tables.length
  toolSessionCount.value = toolSessions.length
  sportabzeichenStandardCount.value = standards.length
})
</script>

<style scoped>
.subject-hub {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
}

.page-header h1,
.hub-card h2 {
  margin: 0;
}

.subtitle,
.hub-card p {
  color: #64748b;
}

.summary-pill {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0 1rem;
  border-radius: 999px;
  background: rgba(14, 116, 144, 0.12);
  color: #155e75;
  font-weight: 700;
}

.metrics-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.metric-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.metric-card strong {
  font-size: 1.5rem;
}

.metric-card span {
  color: #64748b;
}

.hub-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.hub-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1.25rem;
  text-decoration: none;
  color: #0f172a;
}

.eyebrow {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: #0f766e;
  font-weight: 700;
}
</style>
