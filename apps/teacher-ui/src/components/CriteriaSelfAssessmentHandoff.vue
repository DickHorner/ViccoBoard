<template>
  <Teleport to="body">
    <div class="handoff-overlay" role="dialog" aria-modal="true" aria-label="Selbsteinschätzung">
      <main class="handoff-panel">
        <header class="handoff-header">
          <p class="handoff-eyebrow">{{ categoryName }}</p>
          <h1 v-if="phase === 'student'">Deine Selbsteinschätzung</h1>
          <h1 v-else-if="phase === 'return'">Danke für Deine Einschätzung!</h1>
          <h1 v-else>Selbst- und Fremdeinschätzung</h1>
          <p>{{ studentName }}</p>
        </header>

        <template v-if="phase === 'student'">
          <p class="handoff-intro">
            Wie schätzt Du Deine Mitarbeit ein? Wähle für jedes Kriterium Deine Punkte.
            Die Einschätzung der Lehrkraft siehst Du erst danach gemeinsam mit ihr.
          </p>

          <div class="handoff-criteria">
            <section v-for="criterion in criteria" :key="criterion.id" class="handoff-criterion">
              <div class="criterion-heading">
                <h2>{{ criterion.name }}</h2>
                <span>{{ criterion.minValue }}–{{ criterion.maxValue }} Punkte</span>
              </div>
              <p v-if="criterion.description">{{ criterion.description }}</p>

              <div v-if="pointOptions(criterion).length > 0" class="score-buttons">
                <button
                  v-for="value in pointOptions(criterion)"
                  :key="value"
                  type="button"
                  :class="['score-button', { selected: selfScores[criterion.id] === value }]"
                  :aria-pressed="selfScores[criterion.id] === value"
                  @click="setScore(criterion.id, value)"
                >{{ value }}</button>
              </div>
              <label v-else class="number-label">
                Deine Punkte
                <input
                  type="number"
                  inputmode="decimal"
                  step="any"
                  :min="criterion.minValue"
                  :max="criterion.maxValue"
                  :value="selfScores[criterion.id] ?? ''"
                  @input="setNumberScore(criterion, $event)"
                />
              </label>
            </section>
          </div>

          <p v-if="error" role="alert" class="handoff-error">{{ error }}</p>
          <div class="handoff-footer">
            <span>{{ completedCount }} / {{ criteria.length }} Kriterien bewertet</span>
            <button type="button" class="handoff-primary" :disabled="!complete || saving" @click="finish">
              {{ saving ? 'Wird gespeichert …' : 'Fertig – iPad zurückgeben' }}
            </button>
          </div>
        </template>

        <template v-else-if="phase === 'return'">
          <div class="return-message">
            <p>Deine Antworten wurden gespeichert.</p>
            <strong>Bitte gib das iPad jetzt an Deine Lehrkraft zurück.</strong>
          </div>
          <form class="unlock-form" @submit.prevent="reveal">
            <label for="handoff-unlock">Lehrkraft-PIN zum gemeinsamen Vergleich</label>
            <input
              id="handoff-unlock"
              v-model="unlockPin"
              type="password"
              inputmode="numeric"
              pattern="[0-9]{4,6}"
              maxlength="6"
              autocomplete="off"
            />
            <p v-if="error" role="alert" class="handoff-error">{{ error }}</p>
            <button type="submit" class="handoff-primary">Lehrereinschätzung anzeigen</button>
          </form>
        </template>

        <template v-else>
          <p class="handoff-intro">
            Die Flächen zeigen Eure Einschätzungen auf derselben Skala.
            Unterschiede sind Gesprächsanlässe, keine automatisch festgelegte Note.
          </p>

          <div class="chart-legend" aria-hidden="true">
            <span><i class="legend-self"></i> Selbsteinschätzung</span>
            <span><i class="legend-teacher"></i> Lehrkraft</span>
          </div>
          <svg
            v-if="comparison.length >= 3 && comparison.length <= 12"
            viewBox="0 0 540 440"
            class="radar-chart"
            role="img"
            :aria-label="`Radardiagramm für ${studentName}: Selbsteinschätzung und Lehrkraft im Vergleich`"
          >
            <polygon
              v-for="factor in [0.25, 0.5, 0.75, 1]"
              :key="factor"
              :points="radarRing(factor)"
              fill="none"
              stroke="#cbd5e1"
              stroke-width="1.4"
            />
            <line
              v-for="(row, index) in comparison"
              :key="row.id"
              x1="270"
              y1="210"
              :x2="point(index, 1).x"
              :y2="point(index, 1).y"
              stroke="#cbd5e1"
              stroke-width="1"
            />
            <polygon :points="radarShape('teacher')" fill="#1762a6" fill-opacity="0.22" stroke="#1762a6" stroke-width="3" stroke-linejoin="round" />
            <polygon :points="radarShape('self')" fill="#df8332" fill-opacity="0.24" stroke="#bd6417" stroke-width="3" stroke-linejoin="round" />
            <g v-for="(row, index) in comparison" :key="`point-${row.id}`">
              <circle :cx="point(index, row.teacherRatio).x" :cy="point(index, row.teacherRatio).y" r="4" fill="#1762a6" />
              <circle :cx="point(index, row.selfRatio).x" :cy="point(index, row.selfRatio).y" r="4" fill="#bd6417" />
              <text
                :x="point(index, 1.22).x"
                :y="point(index, 1.22).y"
                :text-anchor="labelAnchor(index)"
                dominant-baseline="middle"
                font-size="13"
                fill="#172c45"
              ><title>{{ row.name }}</title>{{ shortLabel(row.name) }}</text>
            </g>
          </svg>
          <p v-else class="handoff-intro">
            Ein Radardiagramm ist mit 3 bis 12 Kriterien sinnvoll lesbar.
            Die vollständige Gegenüberstellung steht in der Tabelle.
          </p>

          <div class="comparison-table-wrap">
            <table class="comparison-table">
              <thead><tr><th>Kriterium</th><th>Selbst</th><th>Lehrkraft</th><th>Unterschied</th></tr></thead>
              <tbody>
                <tr v-for="row in comparison" :key="row.id">
                  <th scope="row">{{ row.name }}</th>
                  <td>{{ formatNumber(row.selfValue) }}</td>
                  <td>{{ formatNumber(row.teacherValue) }}</td>
                  <td>{{ row.difference === 0 ? 'Gleich' : `${row.difference > 0 ? 'Selbst +' : 'Lehrkraft +'}${formatNumber(Math.abs(row.difference))}` }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="agreement-summary">
            {{ comparison.filter((row) => row.difference === 0).length }} von {{ comparison.length }}
            Kriterien stimmen überein.
          </p>
          <div class="handoff-footer">
            <span>Gemeinsam besprechen</span>
            <button type="button" class="handoff-primary" @click="emit('close')">Zur Lehrkraftübersicht</button>
          </div>
        </template>
      </main>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Sport } from '@viccoboard/core'
import { compareCriterionScores } from '../utils/criteria-comparison'

const props = defineProps<{
  studentName: string
  categoryName: string
  criteria: Sport.Criterion[]
  teacherScores: Record<string, number>
  initialScores: Record<string, number>
  pin: string
  saveAssessment: (scores: Record<string, number>) => Promise<void>
}>()

const emit = defineEmits<{ close: [] }>()
const phase = ref<'student' | 'return' | 'comparison'>('student')
const selfScores = ref<Record<string, number>>({ ...props.initialScores })
const unlockPin = ref('')
const saving = ref(false)
const error = ref('')

const completedCount = computed(() => props.criteria.filter((criterion) => {
  const value = selfScores.value[criterion.id]
  return Number.isFinite(value) && value >= criterion.minValue && value <= criterion.maxValue
}).length)
const complete = computed(() => props.criteria.length > 0 && completedCount.value === props.criteria.length)
const comparison = computed(() => phase.value === 'comparison'
  ? compareCriterionScores(props.criteria, selfScores.value, props.teacherScores)
  : []
)

function pointOptions(criterion: Sport.Criterion): number[] {
  const span = criterion.maxValue - criterion.minValue
  if (!Number.isInteger(criterion.minValue) || !Number.isInteger(span) || span < 1 || span > 8) {
    return []
  }
  return Array.from({ length: span + 1 }, (_, index) => criterion.minValue + index)
}

function setScore(criterionId: string, value: number): void {
  selfScores.value[criterionId] = value
  error.value = ''
}

function setNumberScore(criterion: Sport.Criterion, event: Event): void {
  const raw = (event.target as HTMLInputElement).value.trim()
  const value = Number(raw)
  if (raw === '' || !Number.isFinite(value) || value < criterion.minValue || value > criterion.maxValue) {
    delete selfScores.value[criterion.id]
  } else {
    setScore(criterion.id, value)
  }
}

async function finish(): Promise<void> {
  if (!complete.value || saving.value) return
  saving.value = true
  error.value = ''

  try {
    const scores = Object.fromEntries(props.criteria.map((criterion) => [
      criterion.id, selfScores.value[criterion.id]
    ]))
    await props.saveAssessment(scores)
    phase.value = 'return'
  } catch (saveError) {
    error.value = saveError instanceof Error ? saveError.message : 'Speichern fehlgeschlagen.'
  } finally {
    saving.value = false
  }
}

function reveal(): void {
  if (unlockPin.value !== props.pin) {
    error.value = 'PIN nicht korrekt.'
    unlockPin.value = ''
    return
  }

  unlockPin.value = ''
  error.value = ''
  phase.value = 'comparison'
}

function point(index: number, ratio: number): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / comparison.value.length - Math.PI / 2
  return {
    x: 270 + Math.cos(angle) * 134 * ratio,
    y: 210 + Math.sin(angle) * 134 * ratio
  }
}

function radarRing(ratio: number): string {
  return comparison.value.map((_, index) => {
    const p = point(index, ratio)
    return `${p.x},${p.y}`
  }).join(' ')
}

function radarShape(type: 'self' | 'teacher'): string {
  return comparison.value.map((row, index) => {
    const p = point(index, type === 'self' ? row.selfRatio : row.teacherRatio)
    return `${p.x},${p.y}`
  }).join(' ')
}

function labelAnchor(index: number): 'start' | 'end' | 'middle' {
  const offset = point(index, 1.22).x - 270
  return offset > 22 ? 'start' : offset < -22 ? 'end' : 'middle'
}

function shortLabel(value: string): string {
  return value.length > 18 ? `${value.slice(0, 17)}…` : value
}

function formatNumber(value: number): string {
  return String(value).replace('.', ',')
}

let app: HTMLElement | null = null
let wasInert = false
let previousOverflow = ''

onMounted(() => {
  app = document.getElementById('app')
  wasInert = app?.hasAttribute('inert') ?? false
  app?.setAttribute('inert', '')
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  if (app && !wasInert) app.removeAttribute('inert')
  document.body.style.overflow = previousOverflow
})
</script>

<style scoped>
.handoff-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: #eaf2f8;
  overflow-y: auto;
  padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
  color: #18314a;
}
.handoff-panel { max-width: 860px; margin: 0 auto; padding-bottom: 2rem; }
.handoff-header { text-align: center; padding: 1rem 0 1.5rem; }
.handoff-header h1 { font-size: clamp(1.7rem, 4vw, 2.5rem); margin: .35rem 0; }
.handoff-header p { margin: .35rem; }
.handoff-eyebrow { font-weight: 700; color: #1762a6; text-transform: uppercase; letter-spacing: .08em; }
.handoff-intro { font-size: 1.05rem; line-height: 1.5; }
.handoff-criteria { display: grid; gap: .9rem; margin: 1.5rem 0; }
.handoff-criterion { background: #fff; border: 1px solid #d0dfeb; border-radius: 14px; padding: 1.25rem; }
.criterion-heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .5rem; }
.criterion-heading h2 { font-size: 1.2rem; margin: 0; }
.criterion-heading span, .handoff-criterion p { color: #5b7087; }
.score-buttons { display: flex; gap: .6rem; flex-wrap: wrap; margin-top: 1rem; }
.score-button { min-width: 62px; min-height: 62px; background: #edf5fb; border: 2px solid #b8d0e3; border-radius: 12px; font-size: 1.35rem; font-weight: 700; cursor: pointer; }
.score-button.selected { background: #1762a6; border-color: #1762a6; color: #fff; }
.score-button:focus-visible, .handoff-primary:focus-visible { outline: 3px solid #e0872f; outline-offset: 3px; }
.number-label { display: flex; flex-direction: column; gap: .5rem; margin-top: 1rem; }
.number-label input { max-width: 180px; min-height: 54px; border-radius: 8px; border: 1px solid #aac4d8; font-size: 1.25rem; padding: .5rem; }
.handoff-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-top: 1.5rem; }
.handoff-primary { background: #1762a6; color: #fff; border: 0; border-radius: 10px; min-height: 54px; padding: .8rem 1.35rem; font-weight: 700; font-size: 1rem; cursor: pointer; }
.handoff-primary:disabled { background: #92b0c9; cursor: not-allowed; }
.handoff-error { color: #9f1d1d; font-weight: 700; }
.return-message { background: #fff; padding: 2rem; border-radius: 14px; text-align: center; line-height: 1.8; font-size: 1.15rem; }
.unlock-form { background: #fff; border: 1px solid #c5d7e8; border-radius: 14px; padding: 1.5rem; margin: 1.5rem auto; max-width: 440px; display: flex; flex-direction: column; gap: 1rem; }
.unlock-form label { font-weight: 700; }
.unlock-form input { min-height: 56px; font-size: 1.25rem; border: 1px solid #a7bdcf; border-radius: 8px; padding: .5rem; }
.chart-legend { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; font-weight: 600; }
.chart-legend span { display: flex; align-items: center; gap: .5rem; }
.chart-legend i { display: inline-block; width: 18px; height: 18px; border-radius: 4px; }
.legend-self { background: #df8332; }
.legend-teacher { background: #1762a6; }
.radar-chart { width: 100%; max-height: 480px; display: block; background: #fff; border-radius: 16px; margin-top: 1rem; }
.comparison-table-wrap { width: 100%; overflow-x: auto; margin-top: 1.5rem; }
.comparison-table { width: 100%; border-collapse: collapse; background: #fff; }
.comparison-table th, .comparison-table td { padding: .9rem .65rem; border-bottom: 1px solid #dbe3ed; text-align: left; }
.comparison-table th { font-weight: 700; }
.agreement-summary { font-weight: 700; text-align: center; }
@media (max-width: 650px) {
  .handoff-overlay { padding: .75rem; }
  .score-button { flex: 1; min-width: 54px; }
  .handoff-footer { flex-direction: column; align-items: stretch; }
}
</style>
