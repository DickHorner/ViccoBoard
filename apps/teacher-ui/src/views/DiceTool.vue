<template>
  <div class="dice-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('DICE.title') }}</h2>
      <p class="page-description">{{ t('DICE.description') }}</p>
    </div>

    <!-- Dice roller -->
    <section class="card dice-card">
      <div class="range-row">
        <div class="form-group">
          <label>{{ t('DICE.min') }}</label>
          <input v-model.number="minValue" type="number" class="form-input range-input" min="1" />
        </div>
        <span class="range-sep">–</span>
        <div class="form-group">
          <label>{{ t('DICE.max') }}</label>
          <input v-model.number="maxValue" type="number" class="form-input range-input" :min="minValue + 1" />
        </div>
      </div>

      <!-- Class context (optional) -->
      <div class="form-group">
        <label>{{ t('DICE.classContext') }}</label>
        <select v-model="selectedClassId" class="form-input">
          <option value="">{{ t('DICE.selectClass') }}</option>
          <option v-for="cls in classes" :key="cls.id" :value="cls.id">
            {{ cls.name }} ({{ cls.schoolYear }})
          </option>
        </select>
      </div>

      <!-- Dice display -->
      <div class="dice-display" :class="{ rolling }">
        <div class="dice-face">
          <span v-if="currentResult !== null" class="dice-number">{{ currentResult }}</span>
          <span v-else class="dice-placeholder">?</span>
        </div>
      </div>

      <button class="btn-roll" @click="roll" :disabled="!canRoll">
        🎲 {{ t('DICE.roll') }}
      </button>

      <p v-if="rollSaved" class="save-message">{{ t('DICE.rollSaved') }}</p>
    </section>

    <!-- Log -->
    <section class="card">
      <div class="card-header">
        <h3>{{ t('DICE.log') }} <span class="log-count">({{ log.length }})</span></h3>
        <button v-if="log.length > 0" class="btn-secondary btn-small" @click="clearLog">
          {{ t('DICE.clearLog') }}
        </button>
      </div>

      <p v-if="log.length === 0" class="empty-hint">{{ t('DICE.noLog') }}</p>
      <ul v-else class="log-list">
        <li v-for="entry in log" :key="entry.id" class="log-item">
          <span class="log-result">{{ entry.result }}</span>
          <span class="log-range">({{ entry.minValue }}–{{ entry.maxValue }})</span>
          <span class="log-time">{{ formatTime(entry.timestamp) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge'
import type { ClassGroup } from '@viccoboard/core'

const { t } = useI18n()

initializeSportBridge()
const bridge = getSportBridge()

interface DiceLogItem {
  id: string
  minValue: number
  maxValue: number
  result: number
  timestamp: Date
}

const minValue = ref(1)
const maxValue = ref(6)
const selectedClassId = ref('')
const classes = ref<ClassGroup[]>([])
const currentResult = ref<number | null>(null)
const rolling = ref(false)
const rollSaved = ref(false)
const log = ref<DiceLogItem[]>([])

const canRoll = computed(() => {
  return !rolling.value && minValue.value < maxValue.value &&
    Number.isInteger(minValue.value) && Number.isInteger(maxValue.value)
})

async function roll() {
  if (!canRoll.value) return

  rolling.value = true
  rollSaved.value = false

  // Brief animation delay
  await new Promise(r => setTimeout(r, 300))

  const result = Math.floor(Math.random() * (maxValue.value - minValue.value + 1)) + minValue.value
  currentResult.value = result
  rolling.value = false

  // Persist the roll
  try {
    const session = await bridge.recordDiceRollUseCase.execute({
      classGroupId: selectedClassId.value || undefined,
      minValue: minValue.value,
      maxValue: maxValue.value,
      result
    })
    log.value.unshift({
      id: session.id,
      minValue: minValue.value,
      maxValue: maxValue.value,
      result,
      timestamp: session.createdAt
    })
    rollSaved.value = true
  } catch {
    // Non-critical: still show result even if persistence fails
  }
}

async function clearLog() {
  // Remove all dice sessions from repository
  for (const entry of log.value) {
    try {
      await bridge.toolSessionRepository.delete(entry.id)
    } catch {
      // ignore
    }
  }
  log.value = []
}

async function loadLog() {
  const all = await bridge.toolSessionRepository.findByToolType('dice')
  log.value = all
    .map(s => ({
      id: s.id,
      minValue: s.sessionMetadata.minValue as number,
      maxValue: s.sessionMetadata.maxValue as number,
      result: s.sessionMetadata.result as number,
      timestamp: s.createdAt
    }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

onMounted(async () => {
  classes.value = await bridge.classGroupRepository.findAll()
  await loadLog()
})
</script>

<style scoped>
.dice-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.back-button {
  background: none;
  border: none;
  color: #0066cc;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  min-height: 44px;
}

.page-description {
  color: #666;
  margin: 0.25rem 0 0;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.card h3 {
  margin: 0 0 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
}

.dice-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.range-row {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  width: 100%;
}

.range-sep {
  font-size: 1.4rem;
  font-weight: 700;
  padding-bottom: 0.6rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
  width: 100%;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
}

.form-input {
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 1rem;
}

.range-input {
  max-width: 100px;
}

.dice-display {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.5rem 0;
  transition: transform 0.3s;
}

.dice-display.rolling {
  animation: spin 0.3s ease-in-out;
}

@keyframes spin {
  0%   { transform: rotate(0deg) scale(1); }
  50%  { transform: rotate(15deg) scale(1.1); }
  100% { transform: rotate(0deg) scale(1); }
}

.dice-face {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.dice-number {
  font-size: 3.5rem;
  font-weight: 900;
  color: white;
  line-height: 1;
}

.dice-placeholder {
  font-size: 3.5rem;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1;
}

.btn-roll {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 3rem;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  min-height: 52px;
  transition: opacity 0.2s, transform 0.1s;
  width: 100%;
}

.btn-roll:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-roll:active:not(:disabled) {
  transform: translateY(0);
}

.btn-roll:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  background: white;
  border: 2px solid #ddd;
  color: #333;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
}

.btn-small {
  padding: 0.4rem 0.9rem;
  min-height: 36px;
  font-size: 0.875rem;
}

.save-message {
  color: #16a34a;
  font-size: 0.9rem;
}

.log-count {
  font-size: 0.85rem;
  font-weight: 400;
  color: #888;
}

.empty-hint {
  color: #888;
  font-style: italic;
}

.log-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 0.9rem;
}

.log-result {
  font-size: 1.3rem;
  font-weight: 800;
  color: #667eea;
  min-width: 2rem;
  text-align: center;
}

.log-range {
  color: #888;
  flex: 1;
}

.log-time {
  color: #aaa;
  font-size: 0.8rem;
}
</style>
