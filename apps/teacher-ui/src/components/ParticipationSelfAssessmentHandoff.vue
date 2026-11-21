<template>
  <Teleport to="body">
    <section class="handoff-overlay" role="dialog" aria-modal="true" aria-label="Mitarbeit: Selbsteinschätzung">
      <main class="handoff-panel">
        <header>
          <p class="app-data-note">Mitarbeit · {{ studentName }}</p>
          <h1>{{ phase === 'student' ? 'Deine Selbsteinschätzung' : phase === 'return' ? 'Vielen Dank!' : 'Unsere Einschätzungen' }}</h1>
        </header>

        <template v-if="phase === 'student' && criterion">
          <p class="app-data-note">Kriterium {{ step + 1 }} von {{ criteria.length }}</p>
          <progress :value="step + 1" :max="criteria.length" />
          <h2>{{ criterion.label }}</h2>
          <p>{{ criterion.description }}</p>
          <fieldset class="level-list">
            <legend>Welche Beschreibung passt am besten zu Dir?</legend>
            <label v-for="level in criterion.levels" :key="level.value" class="level-choice">
              <input type="radio" :name="criterion.id" :value="level.value"
                :checked="selfScores[criterion.id] === level.value"
                @change="setScore(criterion.id, level.value)" />
              <span><strong>{{ level.value }} Punkte</strong> – {{ level.description }}</span>
            </label>
          </fieldset>
          <p v-if="error" class="error-message" role="alert">{{ error }}</p>
          <footer class="actions">
            <Button label="Zurück" severity="secondary" outlined :disabled="step === 0 || saving" @click="step--" />
            <Button v-if="step < criteria.length - 1" label="Weiter" :disabled="selfScores[criterion.id] === undefined || saving" @click="step++" />
            <Button v-else label="Fertig – iPad zurückgeben" :disabled="!complete || saving" :loading="saving" @click="finish" />
          </footer>
        </template>

        <template v-else-if="phase === 'return'">
          <p>Deine Antworten wurden gespeichert. Gib das iPad jetzt an Deine Lehrkraft zurück.</p>
          <form class="unlock-form" @submit.prevent="unlock">
            <label for="participation-unlock">Lehrkraft-PIN (4–6 Ziffern)</label>
            <input id="participation-unlock" v-model="unlockPin" type="password" inputmode="numeric"
              autocomplete="off" pattern="[0-9]{4,6}" maxlength="6" required />
            <p v-if="error" class="error-message" role="alert">{{ error }}</p>
            <Button type="submit" label="Zur Lehrkraft zurück" />
          </form>
        </template>

        <template v-else-if="phase === 'comparison'">
          <p>Die Werte sind Gesprächsanlässe. Die Note ergibt sich aus der Lehrkraftbewertung.</p>
          <ParticipationAssessmentChart :criteria="criteria"
            :self-scores="selfScores" :teacher-scores="teacherScores" />
          <div class="comparison-wrap">
            <table>
              <thead><tr><th>Kriterium</th><th>Selbst</th><th>Lehrkraft</th></tr></thead>
              <tbody>
                <tr v-for="item in criteria" :key="item.id">
                  <th scope="row">{{ item.label }}</th>
                  <td>{{ selfScores[item.id] ?? '–' }}</td>
                  <td>{{ teacherScores[item.id] ?? '–' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <footer class="actions">
            <Button label="Vergleich schließen und zum Schüler zurück" @click="emit('close')" />
          </footer>
        </template>
      </main>
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Button from 'openvue/button'
import ParticipationAssessmentChart from './ParticipationAssessmentChart.vue'
import type { Sport } from '@viccoboard/core'

type Criterion = Sport.ParticipationRubricDefinition['criteria'][number]

const props = defineProps<{
  studentName: string
  criteria: Criterion[]
  teacherScores: Record<string, number>
  initialScores: Record<string, number>
  pin: string
  saveAssessment: (scores: Record<string, number>) => Promise<boolean>
}>()
const emit = defineEmits<{ close: [] }>()
const phase = ref<'student' | 'return' | 'comparison'>('student')
const step = ref(0)
const selfScores = ref<Record<string, number>>({ ...props.initialScores })
const criterion = computed(() => props.criteria[step.value])
const complete = computed(() =>
  props.criteria.length > 0 && props.criteria.every(item =>
    item.levels.some(level => level.value === selfScores.value[item.id])
  )
)
const saving = ref(false)
const error = ref('')
const unlockPin = ref('')

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

function setScore(id: string, value: number): void {
  selfScores.value = { ...selfScores.value, [id]: value }
  error.value = ''
}

async function finish(): Promise<void> {
  if (!complete.value || saving.value) return
  saving.value = true
  error.value = ''
  try {
    const scores = Object.fromEntries(props.criteria.map(item => [item.id, selfScores.value[item.id]]))
    if (!await props.saveAssessment(scores)) {
      error.value = 'Speichern fehlgeschlagen. Bitte erneut versuchen.'
      return
    }
    phase.value = 'return'
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Speichern fehlgeschlagen.'
  } finally {
    saving.value = false
  }
}

function unlock(): void {
  if (unlockPin.value !== props.pin) {
    error.value = 'PIN ist nicht korrekt.'
    unlockPin.value = ''
    return
  }
  unlockPin.value = ''
  error.value = ''
  phase.value = 'comparison'
}
</script>

<style scoped>
.handoff-overlay { position: fixed; inset: 0; z-index: 2000; background: var(--p-content-background, #fff); color: var(--p-text-color, #172c45); overflow: auto; padding: 1rem; }
.handoff-panel { margin: 0 auto; max-width: 760px; display: grid; gap: 1.2rem; padding: 1rem; }
.handoff-panel h1, .handoff-panel h2 { margin: 0; }
.handoff-panel progress { width: 100%; }
.level-list { border: 0; padding: 0; display: grid; gap: .75rem; }
.level-list legend { font-weight: 600; margin-bottom: .75rem; }
.level-choice { display: flex; align-items: flex-start; gap: .75rem; padding: 1rem; border: 1px solid var(--surface-border, #aeb6c1); border-radius: 8px; min-height: 44px; cursor: pointer; }
.level-choice input { margin-top: .25rem; min-width: 20px; min-height: 20px; }
.actions { display: flex; gap: .75rem; justify-content: space-between; flex-wrap: wrap; }
.unlock-form { display: grid; gap: .75rem; max-width: 350px; }
.unlock-form input { min-height: 44px; padding: .5rem; border: 1px solid var(--surface-border, #aeb6c1); border-radius: 6px; }
.comparison-wrap { overflow-x: auto; }
.comparison-wrap table { width: 100%; border-collapse: collapse; }
.comparison-wrap th, .comparison-wrap td { padding: .75rem; border-bottom: 1px solid var(--surface-border, #aeb6c1); text-align: left; }
.error-message { color: var(--p-red-700, #991b1b); }
</style>
