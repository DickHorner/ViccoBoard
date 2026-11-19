<template>
  <section class="subject-hub">
    <header class="page-header">
      <div>
        <h1>Sport</h1>
        <p class="subtitle">Fachspezifischer Arbeitsbereich für Bewertung, Tests, Tools und Statistiken. Klassen, Stunden und Anwesenheit bleiben fachneutral organisiert.</p>
      </div>
      <Tag :value="loadingClasses ? '… aktive Klassen' : `${classCount} aktive Klassen`" severity="info" />
    </header>

    <Message v-if="loadError" severity="warn" role="status">{{ loadError }}</Message>
    <Message v-if="metricsError" severity="warn" role="status">{{ metricsError }}</Message>

    <section class="metrics-grid">
      <article class="metric-card app-card">
        <strong>{{ countsLoading ? '…' : gradeCategoryCount }}</strong>
        <span>Bewertungskategorien</span>
      </article>
      <article class="metric-card app-card">
        <strong>{{ countsLoading ? '…' : tableCount }}</strong>
        <span>Tabellen</span>
      </article>
      <article class="metric-card app-card">
        <strong>{{ countsLoading ? '…' : toolSessionCount }}</strong>
        <span>Tool-Sessions</span>
      </article>
      <article class="metric-card app-card">
        <strong>{{ countsLoading ? '…' : sportabzeichenStandardCount }}</strong>
        <span>Sportabzeichen-Standards</span>
      </article>
    </section>

    <div class="hub-grid">
      <RouterLink v-for="entry in entries" :key="entry.to" :to="entry.to" class="hub-card app-card">
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
import Message from 'openvue/message'
import Tag from 'openvue/tag'
import { getSportBridge, useClassGroups } from '../composables/useSportBridge'
import type { ClassGroup } from '@viccoboard/core'

const classGroups = useClassGroups()
const SportBridge = getSportBridge()
const classes = ref<ClassGroup[]>([])
const loadError = ref<string | null>(null)
const loadingClasses = ref(true)
const metricsError = ref<string | null>(null)
const countsLoading = ref(true)
const gradeCategoryCount = ref(0)
const tableCount = ref(0)
const toolSessionCount = ref(0)
const sportabzeichenStandardCount = ref(0)

const entries = [
  {
    to: '/subjects/sport/basketball',
    eyebrow: 'Leistungsabnahme · Pilot',
    title: 'Basketball: Dribbeln & Passen',
    description: 'LISUM Niveaustufe D: beobachtbare Kriterien, Bewertungsraster und wiederaufnehmbare Prüfung.'
  },
  {
    to: '/subjects/sport/exam',
    eyebrow: 'Prüfung',
    title: 'Sportprüfung',
    description: 'Klasse und Disziplin wählen, Abwesenheiten abgleichen, Messwerte erfassen und Noten live berechnen.'
  },
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
    to: '/student-calendar',
    eyebrow: 'Schüler',
    title: 'Abwesenheiten & Verletzungen',
    description: 'Datumsbereiche dokumentieren und Abwesenheiten aus IServ-ZIP-Exporten importieren.'
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
    title: 'Timer',
    description: 'Zeitmessung für Unterricht und Tests.'
  },
  {
    to: '/tools/multistop',
    eyebrow: 'Tool',
    title: 'Multistop',
    description: 'Mehrfachstopps für parallele Zeitmessungen.'
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
    title: 'Teams bilden',
    description: 'Schüler nach Zufall oder Kriterien in Mannschaften einteilen.'
  },
  {
    to: '/tools/tournaments',
    eyebrow: 'Tool',
    title: 'Turnierplaner',
    description: 'Turniere erstellen, Paarungen auslosen und Ergebnisse erfassen – von 1 gegen 1 bis 6 gegen 6.'
  },
  {
    to: '/tools/tactics',
    eyebrow: 'Tool',
    title: 'Taktikboard',
    description: 'Taktische Situationen für den Unterricht visualisieren.'
  },
  {
    to: '/tools/feedback',
    eyebrow: 'Tool',
    title: 'Feedback',
    description: 'Feedbackmethoden für den laufenden Unterricht.'
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
    to: '/tools/finish-camera',
    eyebrow: 'Tool',
    title: 'Zielkamera',
    description: 'Kamera auf die Ziellinie richten, Zielübertritte automatisch erfassen und schnell Schülern zuordnen.'
  },
  {
    to: '/tools/pushup-tracking',
    eyebrow: 'Tool',
    title: 'Liegestütze Tracking',
    description: 'Liegestütze per Kamera in Echtzeit zählen – bis zu 4 Personen gleichzeitig mit Qualitätsanzeige.'
  },
  {
    to: '/tools/tracking-basketball',
    eyebrow: 'Tool',
    title: 'Basketball Trefferquote',
    description: 'Echtzeit-Trefferzähler: Zielbereich im Kamerabild definieren und Treffer automatisch zählen.'
  },
  {
    to: '/tools/jump-rope-tracking',
    eyebrow: 'Tool',
    title: 'Seilspringen Tracking',
    description: 'Sprünge per Kamera für bis zu vier Personen gleichzeitig zählen.'
  },
  {
    to: '/tools/slow-motion',
    eyebrow: 'Tool',
    title: 'Slow Motion Analyse',
    description: 'Clips framegenau analysieren, Biomechanik-Marker setzen und Winkel berechnen.'
  }
]

const classCount = computed(() => classes.value.filter((classGroup) => !classGroup.archived).length)

const loadClasses = async () => {
  try {
    classes.value = await classGroups.findAll()
    loadError.value = null
  } catch (error) {
    console.error('Failed to load sport classes:', error)
    loadError.value = 'Klassen konnten nicht geladen werden.'
  } finally {
    loadingClasses.value = false
  }
}

const loadCounts = async () => {
  countsLoading.value = true
  try {
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
  } catch (error) {
    console.error('Failed to load sport metrics:', error)
    metricsError.value = 'Sport-Kennzahlen konnten nicht geladen werden.'
  } finally {
    countsLoading.value = false
  }
}

onMounted(() => {
  void loadClasses()
  void loadCounts()
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

.metrics-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
}

.metric-card {
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
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
}

.hub-card {
  padding: 1.25rem;
  text-decoration: none;
  color: var(--color-ink);
}

.hub-card:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

.eyebrow {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: var(--accent-strong);
  font-weight: 700;
}
</style>