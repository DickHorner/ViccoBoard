<template>
  <section class="assessment-chart" aria-label="Vergleich der Selbst- und Lehrkrafteinschätzung">
    <div class="chart-legend">
      <span><i class="legend-self"></i> Selbst</span>
      <span><i class="legend-teacher"></i> Lehrkraft</span>
    </div>
    <div v-for="criterion in criteria" :key="criterion.id" class="chart-criterion">
      <h3>{{ criterion.label }}</h3>
      <div v-for="series in seriesLabels" :key="series.key" class="chart-row">
        <span>{{ series.label }}</span>
        <div class="track">
          <div v-if="validScore(criterion, scores[series.key][criterion.id])"
            class="bar" :class="series.key"
            :style="{ width: `${scoreWidth(criterion, scores[series.key][criterion.id])}%` }">
          </div>
        </div>
        <strong>{{ validScore(criterion, scores[series.key][criterion.id])
          ? `${scores[series.key][criterion.id]} / ${criterion.levels.length - 1}`
          : '–' }}</strong>
      </div>
    </div>
    <p class="chart-hint">Die Balken zeigen den Anteil an den möglichen Punkten je Kriterium. „–“ bedeutet: keine Bewertung.</p>
  </section>
</template>

<script setup lang="ts">
import type { Sport } from '@viccoboard/core'

type Criterion = Sport.ParticipationRubricDefinition['criteria'][number]

const props = defineProps<{
  criteria: Criterion[]
  selfScores: Record<string, number>
  teacherScores: Record<string, number>
}>()

const seriesLabels = [
  { key: 'self' as const, label: 'Selbst' },
  { key: 'teacher' as const, label: 'Lehrkraft' }
]

const scores = { self: props.selfScores, teacher: props.teacherScores }

function validScore(criterion: Criterion, value: number | undefined): boolean {
  return criterion.levels.some(level => level.value === value)
}

function scoreWidth(criterion: Criterion, value: number | undefined): number {
  const maximum = criterion.levels[criterion.levels.length - 1]?.value ?? 0
  return maximum > 0 && value !== undefined ? value / maximum * 100 : 0
}
</script>

<style scoped>
.assessment-chart { display: grid; gap: 1rem; }
.chart-legend { display: flex; flex-wrap: wrap; gap: 1rem; font-size: .875rem; }
.chart-legend span { display: inline-flex; align-items: center; gap: .4rem; }
.chart-legend i { width: .85rem; height: .85rem; border-radius: 3px; }
.legend-self, .bar.self { background: #bc6416; }
.legend-teacher, .bar.teacher { background: #1762a6; }
.chart-criterion { display: grid; gap: .35rem; }
.chart-criterion h3 { margin: 0 0 .15rem; font-size: 1rem; }
.chart-row { display: grid; grid-template-columns: 5.3rem minmax(0, 1fr) 4rem; align-items: center; gap: .5rem; font-size: .875rem; }
.chart-row strong { text-align: right; font-variant-numeric: tabular-nums; }
.track { height: .9rem; border-radius: 3px; background: #dfe6ed; overflow: hidden; }
.bar { height: 100%; }
.chart-hint { margin: 0; color: var(--color-muted, #596b7e); font-size: .875rem; }
</style>
