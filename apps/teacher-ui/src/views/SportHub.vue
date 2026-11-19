<template>
  <section class="sport-ui app-form-grid">
    <header class="app-actions-row">
      <h1 class="app-section-title">Sport</h1>
      <span class="app-data-note">{{ loadingClasses ? '…' : classCount }} aktive Klassen</span>
    </header>

    <Message v-if="loadError" severity="warn" role="status">{{ loadError }}</Message>
    <Message v-if="metricsError" severity="warn" role="status">{{ metricsError }}</Message>

    <p class="app-data-note" aria-label="Sport-Kennzahlen">
      {{ countsLoading ? '…' : gradeCategoryCount }} Bewertungskategorien ·
      {{ countsLoading ? '…' : tableCount }} Tabellen ·
      {{ countsLoading ? '…' : toolSessionCount }} Tool-Sessions ·
      {{ countsLoading ? '…' : sportabzeichenStandardCount }} Sportabzeichen-Standards
    </p>

    <nav class="app-actions-row" aria-label="Sportfunktionen">
      <Button
        v-for="entry in entries"
        :key="entry.to"
        :label="entry.title"
        severity="secondary"
        outlined
        size="small"
        @click="router.push(entry.to)"
      />
    </nav>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'openvue/button'
import { useRouter } from 'vue-router'
import Message from 'openvue/message'
import { getSportBridge, useClassGroups } from '../composables/useSportBridge'
import type { ClassGroup } from '@viccoboard/core'

const classGroups = useClassGroups()
const router = useRouter()
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
    title: 'Leistungsabnahmen'
  },
  {
    to: '/subjects/sport/exam',
    title: 'Sportprüfung'
  },
  {
    to: '/grading',
    title: 'Bewertung & Tests'
  },
  {
    to: '/subjects/sport/tables',
    title: 'Tabellenverwaltung'
  },
  {
    to: '/subjects/sport/games',
    title: 'Spieldatenbank'
  },
  {
    to: '/student-calendar',
    title: 'Abwesenheiten & Verletzungen'
  },
  {
    to: '/subjects/sport/statistics',
    title: 'Statistiken'
  },
  {
    to: '/tools/timer',
    title: 'Timer'
  },
  {
    to: '/tools/multistop',
    title: 'Multistop'
  },
  {
    to: '/tools/scoreboard',
    title: 'Scoreboard'
  },
  {
    to: '/tools/teams',
    title: 'Teams bilden'
  },
  {
    to: '/tools/tournaments',
    title: 'Turnierplaner'
  },
  {
    to: '/tools/tactics',
    title: 'Taktikboard'
  },
  {
    to: '/tools/feedback',
    title: 'Feedback'
  },
  {
    to: '/tools/dice',
    title: 'Würfeln'
  },
  {
    to: '/tools/video-delay',
    title: 'Video Delay'
  },
  {
    to: '/tools/finish-camera',
    title: 'Zielkamera'
  },
  {
    to: '/tools/pushup-tracking',
    title: 'Liegestütze Tracking'
  },
  {
    to: '/tools/tracking-basketball',
    title: 'Basketball Trefferquote'
  },
  {
    to: '/tools/jump-rope-tracking',
    title: 'Seilspringen Tracking'
  },
  {
    to: '/tools/slow-motion',
    title: 'Slow Motion Analyse'
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
