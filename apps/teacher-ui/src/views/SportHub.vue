<template>
  <section class="subject-hub sport-ui">
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
        <span class="hub-link-category">{{ entry.eyebrow }}</span>
        <strong>{{ entry.title }}</strong>
        <span class="hub-link-description">{{ entry.description }}</span>
        <i class="pi pi-angle-right" aria-hidden="true"></i>
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
    to: '/subjects/sport/assessments',
    eyebrow: 'Praxis',
    title: 'Leistungsabnahmen',
    description: 'Prüfung auswählen, Kriterien beobachten, Prüflinge zufällig ziehen und später fortsetzen.'
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
  gap: 16px;
}

.page-header,
.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.page-header h1,
.panel-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
}

.subtitle {
  margin: 4px 0 0;
  color: var(--color-muted);
  font-size: 13.5px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
  gap: 12px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px 16px;
}

.metric-card strong {
  font-size: 24px;
  font-variant-numeric: tabular-nums;
}

.metric-card span {
  order: -1;
  color: var(--color-muted);
  font-size: 11.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
  gap: 0 24px;
  padding: 4px 16px;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  background: var(--surface-glass);
}

.hub-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-content: center;
  gap: 3px 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--surface-border);
  background: transparent;
  color: var(--color-ink);
  text-decoration: none;
  box-shadow: none;
  border-radius: 0;
}

.hub-card:hover {
  color: var(--accent-strong);
}

.hub-card:focus-visible,
.ghost-link:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: -2px;
}

.hub-link-category {
  grid-column: 1 / -1;
  color: var(--color-muted);
  font-size: 10.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hub-card strong {
  font-size: 13.5px;
  font-weight: 600;
}

.hub-link-description {
  grid-column: 1;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.4;
}

.hub-card .pi {
  grid-column: 2;
  grid-row: 2 / span 2;
  align-self: center;
  color: var(--color-muted);
  font-size: 12px;
}

</style>
