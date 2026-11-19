<template>
  <div class="shuttle-view sport-ui">
    <div class="page-header">
      <Button text severity="secondary" icon="pi pi-arrow-left" @click="$router.back()">{{ t('COMMON.back') }}</Button>
      <h2>{{ t('SHUTTLE.bewerte-shuttle') }} {{ currentDate }}</h2>
      <p class="page-description">{{ t('SHUTTLE.tabelle') }}</p>
    </div>

    <section v-if="loading" class="card app-card">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('COMMON.loading') }}</p>
      </div>
    </section>

    <section v-else-if="category" class="card app-card">
      <div class="config-row">
        <div class="form-group">
          <label>{{ t('SHUTTLE.tabelle') }}</label>
          <select v-model="selectedTableId" class="form-input" @change="handleConfigChange">
            <option value="">{{ t('SHUTTLE.tabelle') }}...</option>
            <option v-for="table in tables" :key="table.id" :value="table.id">
              {{ table.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('SHUTTLE.stufe') }}</label>
          <select v-model="selectedConfigId" class="form-input" @change="handleConfigChange">
            <option value="">{{ t('SHUTTLE.level') }}...</option>
            <option v-for="config in configs" :key="config.id" :value="config.id">
              {{ config.name }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="savedSession" class="session-banner">
        <span>{{ t('SHUTTLE.session-saved-at') }} {{ formatSessionDate(savedSession.savedAt) }}</span>
        <div class="session-banner-actions">
          <button class="btn-session-reopen" @click="reopenSession">{{ t('SHUTTLE.session-reopen') }}</button>
          <button class="btn-session-discard" @click="discardSession">{{ t('SHUTTLE.session-discard') }}</button>
        </div>
      </div>

      <div v-if="selectedConfig" class="timer-panel">
        <div class="timer-status">
          <div class="status-item">
            <span class="status-label">{{ t('SHUTTLE.elapsed') }}</span>
            <span class="status-value">{{ formatTime(elapsedMs) }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">{{ t('SHUTTLE.current-level') }}</span>
            <span class="status-value">{{ currentLevel || '—' }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">{{ t('SHUTTLE.current-lane') }}</span>
            <span class="status-value">{{ currentLane || '—' }}</span>
          </div>
        </div>
        <div class="timer-controls">
          <Button :disabled="isRunning || !selectedConfig" @click="startTest">
            {{ t('SHUTTLE.start') }}
          </Button>
          <Button severity="secondary" outlined :disabled="!isRunning" @click="pauseTest">
            {{ t('SHUTTLE.pause') }}
          </Button>
          <Button severity="secondary" outlined :disabled="!isPaused" @click="resumeTest">
            {{ t('SHUTTLE.resume') }}
          </Button>
          <Button severity="secondary" outlined :disabled="!isRunning && !isPaused" @click="finishTest">
            {{ t('SHUTTLE.finish') }}
          </Button>
          <Button severity="secondary" outlined :disabled="isRunning" @click="resetTimerState">
            {{ t('SHUTTLE.reset') }}
          </Button>
        </div>
        <label class="sound-toggle">
          <input v-model="soundEnabled" type="checkbox" />
          {{ t('SHUTTLE.sound-enabled') }}
        </label>
      </div>

      <div v-if="!selectedTableId || !selectedConfigId" class="warning-banner">
        {{ t('COMMON.error') }}
      </div>

      <div v-if="students.length > 0" class="table-wrapper">
        <table class="shuttle-table">
          <thead>
            <tr>
              <th>{{ t('SCHUELER.schueler') }}</th>
              <th>{{ t('SHUTTLE.level') }}</th>
              <th>{{ t('SHUTTLE.bahn') }}</th>
              <th>{{ t('SHUTTLE.note') }}</th>
              <th>{{ t('SHUTTLE.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in students" :key="student.id">
              <td class="student-name">{{ student.firstName }} {{ student.lastName }}</td>
              <td>
                <select
                  v-model.number="results[student.id].level"
                  class="table-input"
                  :disabled="!selectedConfig"
                  @change="recalculate(student.id)"
                >
                  <option value="">{{ t('SHUTTLE.level') }}</option>
                  <option v-for="level in availableLevels" :key="level" :value="level">
                    {{ level }}
                  </option>
                </select>
              </td>
              <td>
                <select
                  v-model.number="results[student.id].lane"
                  class="table-input"
                  :disabled="!selectedConfig || !results[student.id].level"
                  @change="recalculate(student.id)"
                >
                  <option value="">{{ t('SHUTTLE.bahn') }}</option>
                  <option v-for="lane in availableLanes(results[student.id].level)" :key="lane" :value="lane">
                    {{ lane }}
                  </option>
                </select>
              </td>
              <td class="grade-cell">{{ results[student.id].grade ?? '—' }}</td>
              <td class="action-cell">
                <Button severity="secondary" outlined
                  class="btn-stop"
                  :disabled="!isRunning || !currentSegment"
                  @click="stopStudent(student.id)"
                >
                  {{ t('SHUTTLE.stop') }}
                </Button>
                <Button severity="secondary" outlined class="btn-clear" :disabled="isRunning" @click="clearStudent(student.id)">
                  {{ t('SHUTTLE.clear') }}
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="form-actions">
        <Button severity="secondary" outlined :disabled="saving" @click="resetAll">
          {{ t('SHUTTLE.noten-neu') }}
        </Button>
        <Button severity="secondary" outlined :disabled="isRunning" @click="saveSessionState">
          {{ t('SHUTTLE.session-save') }}
        </Button>
        <Button :disabled="saving || !selectedTableId || !selectedConfigId" @click="saveAll">
          {{ saving ? t('COMMON.loading') : t('COMMON.save') }}
        </Button>
      </div>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    </section>

    <section v-else class="card app-card">
      <p class="empty-state">{{ t('COMMON.error') }}</p>
    </section>

    <section v-if="historyGroups.length > 0" class="card history-card app-card">
      <h3 class="history-title">{{ t('SHUTTLE.history-title') }}</h3>
      <div v-for="group in historyGroups" :key="group.date" class="history-group">
        <p class="history-date">{{ group.date }}</p>
        <table class="history-table">
          <thead>
            <tr>
              <th>{{ t('SCHUELER.schueler') }}</th>
              <th>{{ t('SHUTTLE.level') }}</th>
              <th>{{ t('SHUTTLE.bahn') }}</th>
              <th>{{ t('SHUTTLE.note') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in group.entries" :key="entry.id">
              <td>{{ studentName(entry.studentId) }}</td>
              <td>{{ entry.measurements.level ?? '—' }}</td>
              <td>{{ entry.measurements.lane ?? '—' }}</td>
              <td>{{ entry.calculatedGrade ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import Button from 'openvue/button'
import { useI18n } from 'vue-i18n'

import { useShuttleGradingEntryView } from '../composables/useShuttleGradingEntryView'

const { t } = useI18n()

const {
  availableLanes,
  availableLevels,
  category,
  clearStudent,
  configs,
  currentDate,
  currentLane,
  currentLevel,
  currentSegment,
  discardSession,
  elapsedMs,
  errorMessage,
  finishTest,
  formatSessionDate,
  formatTime,
  handleConfigChange,
  historyGroups,
  isPaused,
  isRunning,
  loading,
  recalculate,
  reopenSession,
  resetAll,
  resetTimerState,
  results,
  resumeTest,
  saveAll,
  savedSession,
  saveSessionState,
  saving,
  selectedConfig,
  selectedConfigId,
  selectedTableId,
  soundEnabled,
  startTest,
  stopStudent,
  studentName,
  students,
  successMessage,
  tables,
  pauseTest
} = useShuttleGradingEntryView()
</script>

<style scoped src="./ShuttleGradingEntry.css"></style>
