<template>
  <section class="sport-ui app-form-grid">
    <header class="app-actions-row">
      <h1>Sport</h1>
      <Tag :value="loadingClasses ? '… aktive Klassen' : `${classCount} aktive Klassen`" severity="info" />
    </header>

    <Message v-if="loadError" severity="warn" role="status">{{ loadError }}</Message>
    <Message v-if="metricsError" severity="warn" role="status">{{ metricsError }}</Message>

    <div class="app-actions-row" aria-label="Sport-Kennzahlen">
      <Tag :value="`${countsLoading ? '…' : gradeCategoryCount} Bewertungskategorien`" severity="secondary" />
      <Tag :value="`${countsLoading ? '…' : tableCount} Tabellen`" severity="secondary" />
      <Tag :value="`${countsLoading ? '…' : toolSessionCount} Tool-Sessions`" severity="secondary" />
      <Tag :value="`${countsLoading ? '…' : sportabzeichenStandardCount} Sportabzeichen-Standards`" severity="secondary" />
    </div>

    <Panel v-for="group in groupedEntries" :key="group.title" :header="group.title">
      <div class="app-actions-row">
        <Button
          v-for="entry in group.items"
          :key="entry.to"
          as="router-link"
          :to="entry.to"
          :label="entry.title"
          severity="secondary"
          outlined
          size="small"
        />
      </div>
    </Panel>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'openvue/button'
import Panel from 'openvue/panel'
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

  },
  {
    to: '/subjects/sport/exam',
    eyebrow: 'Prüfung',
    title: 'Sportprüfung',

  },
  {
    to: '/grading',
    eyebrow: 'Bewertung',
    title: 'Bewertung & Tests',

  },
  {
    to: '/subjects/sport/tables',
    eyebrow: 'Tabellen',
    title: 'Tabellenverwaltung',

  },
  {
    to: '/subjects/sport/games',
    eyebrow: 'Datenbank',
    title: 'Spieldatenbank',

  },
  {
    to: '/student-calendar',
    eyebrow: 'Schüler',
    title: 'Abwesenheiten & Verletzungen',

  },
  {
    to: '/subjects/sport/statistics',
    eyebrow: 'Statistiken',
    title: 'Statistiken',

  },
  {
    to: '/tools/timer',
    eyebrow: 'Tool',
    title: 'Timer',

  },
  {
    to: '/tools/multistop',
    eyebrow: 'Tool',
    title: 'Multistop',

  },
  {
    to: '/tools/scoreboard',
    eyebrow: 'Tool',
    title: 'Scoreboard',

  },
  {
    to: '/tools/teams',
    eyebrow: 'Tool',
    title: 'Teams bilden',

  },
  {
    to: '/tools/tournaments',
    eyebrow: 'Tool',
    title: 'Turnierplaner',

  },
  {
    to: '/tools/tactics',
    eyebrow: 'Tool',
    title: 'Taktikboard',

  },
  {
    to: '/tools/feedback',
    eyebrow: 'Tool',
    title: 'Feedback',

  },
  {
    to: '/tools/dice',
    eyebrow: 'Tool',
    title: 'Würfeln',

  },
  {
    to: '/tools/video-delay',
    eyebrow: 'Tool',
    title: 'Video Delay',

  },
  {
    to: '/tools/finish-camera',
    eyebrow: 'Tool',
    title: 'Zielkamera',

  },
  {
    to: '/tools/pushup-tracking',
    eyebrow: 'Tool',
    title: 'Liegestütze Tracking',

  },
  {
    to: '/tools/tracking-basketball',
    eyebrow: 'Tool',
    title: 'Basketball Trefferquote',

  },
  {
    to: '/tools/jump-rope-tracking',
    eyebrow: 'Tool',
    title: 'Seilspringen Tracking',

  },
  {
    to: '/tools/slow-motion',
    eyebrow: 'Tool',
    title: 'Slow Motion Analyse',

  }
]

const groupedEntries = [...new Set(entries.map(entry => entry.eyebrow))]
  .map(title => ({ title, items: entries.filter(entry => entry.eyebrow === title) }))

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
