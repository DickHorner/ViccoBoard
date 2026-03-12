<template>
  <div class="dice-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('DICE.title') }}</h2>
    </div>

    <section class="card">
      <h3>{{ t('DICE.range') }}</h3>
      <div class="form-row">
        <div class="form-group">
          <label for="dice-min">{{ t('DICE.min') }}</label>
          <input
            id="dice-min"
            v-model.number="minValue"
            type="number"
            class="form-input"
            :min="1"
          />
        </div>
        <div class="form-group">
          <label for="dice-max">{{ t('DICE.max') }}</label>
          <input
            id="dice-max"
            v-model.number="maxValue"
            type="number"
            class="form-input"
            :min="minValue"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="dice-class">{{ t('DICE.class') }}</label>
          <select id="dice-class" v-model="selectedClassId" class="form-input">
            <option value="">—</option>
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.name }} ({{ cls.schoolYear }})
            </option>
          </select>
        </div>
      </div>

      <div v-if="rangeError" class="warning-banner">{{ rangeError }}</div>

      <div class="roll-area">
        <button class="btn-roll" @click="roll" :disabled="!canRoll">
          {{ t('DICE.roll') }}
        </button>
        <div v-if="lastResult !== null" class="result-display" aria-live="polite">
          {{ lastResult }}
        </div>
      </div>

      <div v-if="saveError" class="warning-banner">{{ t('DICE.save-error') }}</div>
    </section>

    <section class="card">
      <h3>{{ t('DICE.log') }}</h3>
      <div v-if="rollLog.length === 0" class="empty-hint">
        {{ t('DICE.no-log') }}
      </div>
      <ul v-else class="roll-log">
        <li v-for="(entry, index) in rollLog" :key="index" class="roll-log-entry">
          <span class="roll-result">{{ entry.result }}</span>
          <span class="roll-meta">{{ t('DICE.range') }}: {{ entry.min }}–{{ entry.max }}</span>
          <span class="roll-time">{{ formatTime(entry.timestamp) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSportBridge } from '../composables/useSportBridge'
import type { ClassGroup } from '@viccoboard/core'

const { t } = useI18n()

const SportBridge = getSportBridge()

const minValue = ref(1)
const maxValue = ref(6)
const selectedClassId = ref('')
const classes = ref<ClassGroup[]>([])
const lastResult = ref<number | null>(null)
const saveError = ref(false)

interface RollLogEntry {
  result: number
  min: number
  max: number
  timestamp: Date
}

const rollLog = ref<RollLogEntry[]>([])

const rangeError = computed(() => {
  if (!Number.isInteger(minValue.value) || !Number.isInteger(maxValue.value) || minValue.value > maxValue.value) {
    return t('DICE.invalid-range')
  }
  return null
})

const canRoll = computed(() => rangeError.value === null)

function rollDice(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function roll() {
  if (!canRoll.value) return

  const min = minValue.value
  const max = maxValue.value
  const result = rollDice(min, max)
  const timestamp = new Date()

  lastResult.value = result
  saveError.value = false

  rollLog.value.unshift({ result, min, max, timestamp })

  try {
    await SportBridge.recordDiceRollUseCase.execute({
      sessionId: `dice-${timestamp.toISOString()}`,
      min,
      max,
      result,
      classGroupId: selectedClassId.value || undefined,
      metadata: { timestamp }
    })
  } catch {
    saveError.value = true
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString()
}

onMounted(async () => {
  classes.value = await SportBridge.classGroupRepository.findAll()
})
</script>

<style scoped>
.dice-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h2 {
  margin: 0.5rem 0 0;
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #0f766e;
  font-size: 0.9rem;
  padding: 0;
}

.card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.card h3 {
  margin: 0 0 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
  min-width: 120px;
}

.form-group label {
  font-size: 0.875rem;
  color: #475569;
  font-weight: 500;
}

.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 8px;
  font-size: 1rem;
}

.roll-area {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.btn-roll {
  min-height: 56px;
  padding: 0 2.5rem;
  background: #0f766e;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-roll:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-display {
  font-size: 4rem;
  font-weight: 900;
  color: #0f172a;
  min-width: 5rem;
  text-align: center;
  line-height: 1;
}

.warning-banner {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #92400e;
  margin-top: 0.5rem;
}

.empty-hint {
  color: #64748b;
  font-style: italic;
}

.roll-log {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.roll-log-entry {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.03);
}

.roll-result {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f766e;
  min-width: 3rem;
  text-align: center;
}

.roll-meta {
  color: #475569;
  font-size: 0.875rem;
}

.roll-time {
  margin-left: auto;
  color: #94a3b8;
  font-size: 0.8rem;
}
</style>
