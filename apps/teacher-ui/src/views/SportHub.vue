<template>
  <section class="subject-hub">
    <header class="page-header">
      <div>
        <h1>Sport</h1>
        <p class="subtitle">Fachspezifischer Arbeitsbereich fuer Bewertung, Tests, Tools und Statistiken. Klassen, Stunden und Anwesenheit bleiben fachneutral organisiert.</p>
      </div>
      <span class="summary-pill">{{ classCount }} aktive Klassen</span>
    </header>

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
import { useClassGroups } from '../composables/useSportBridge'
import type { ClassGroup } from '@viccoboard/core'

const classGroups = useClassGroups()
const classes = ref<ClassGroup[]>([])

const entries = [
  {
    to: '/grading',
    eyebrow: 'Bewertung',
    title: 'Bewertung & Tests',
    description: 'Kategorien, Kriterien, Zeitnoten, Cooper, Shuttle-Run, Mittelstrecke, Sportabzeichen und BJS.'
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
    description: 'Spielstaende live erfassen und praesentieren.'
  },
  {
    to: '/tools/teams',
    eyebrow: 'Tool',
    title: 'Teams & Turniere',
    description: 'Gruppen fair einteilen und Turnierplaene im Unterricht nutzen.'
  },
  {
    to: '/tools/tactics',
    eyebrow: 'Tool',
    title: 'Taktik & Feedback',
    description: 'Taktikboard und Feedbackmethoden fuer den laufenden Unterricht.'
  }
]

const classCount = computed(() => classes.value.filter((classGroup) => !classGroup.archived).length)

onMounted(async () => {
  classes.value = await classGroups.findAll()
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
