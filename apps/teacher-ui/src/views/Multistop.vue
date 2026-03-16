<template>
  <div class="multistop-view">
    <div class="page-header">
      <h2>{{ t('MULTISTOP.bewerte') }}</h2>
      <p class="page-description">{{ t('MULTISTOP.capture-time') }}</p>
    </div>

    <div class="card">
      <div class="form-group">
        <label>{{ t('KLASSEN.klasse') }}</label>
        <select v-model="selectedClassId" class="form-input" @change="loadStudents">
          <option value="">{{ t('SELECT.ok') }} {{ t('KLASSEN.klasse') }}</option>
          <option v-for="cls in classes" :key="cls.id" :value="cls.id">
            {{ cls.name }}
          </option>
        </select>
      </div>

      <div v-if="selectedClassId" class="form-group">
        <label>{{ t('MULTISTOP.schueler-anzahl') }}</label>
        <input
          v-model.number="numberOfStopwatches"
          type="number"
          min="1"
          :max="students.length"
          class="form-input"
          @change="resetAllTimers"
        />
      </div>
    </div>

    <div v-if="selectedClassId && numberOfStopwatches > 0" class="stopwatches-grid">
      <div
        v-for="(timer, index) in timers"
        :key="index"
        class="stopwatch-card"
        :class="{ running: timer.isRunning, stopped: timer.isStopped, assigned: timer.studentId }"
      >
        <div class="stopwatch-header">
          <span class="stopwatch-number">#{{ index + 1 }}</span>
          <button
            v-if="timer.studentId"
            class="btn-icon btn-small"
            :title="t('COMMON.delete')"
            @click="unassignStudent(index)"
          >
            ✕
          </button>
        </div>

        <div v-if="!timer.studentId" class="student-select">
          <select v-model="timer.studentId" class="form-input form-input-small" @change="assignStudent(index)">
            <option value="">{{ t('MULTISTOP.select-student-hint') }}</option>
            <option v-for="student in availableStudents" :key="student.id" :value="student.id">
              {{ student.firstName }} {{ student.lastName }}
            </option>
          </select>
        </div>
        <div v-else class="student-name">
          {{ getStudentName(timer.studentId) }}
        </div>

        <div class="time-display">
          {{ formatTime(timer.time) }}
        </div>

        <div class="stopwatch-controls">
          <button
            v-if="!timer.isRunning && !timer.isStopped"
            class="btn-primary btn-small"
            :disabled="!timer.studentId"
            @click="startTimer(index)"
          >
            ▶️
          </button>
          <button v-if="timer.isRunning" class="btn-warning btn-small" @click="stopTimer(index)">
            ⏹️ {{ t('COMMON.stop') || 'Stop' }}
          </button>
          <button v-if="timer.isStopped" class="btn-success btn-small" @click="saveTime(index)">
            💾 {{ t('COMMON.save') }}
          </button>
          <button v-if="timer.time > 0" class="btn-secondary btn-small" @click="resetTimer(index)">
            🔄
          </button>
        </div>

        <div v-if="timer.laps.length > 0" class="lap-times-mini">
          <small>{{ timer.laps.length }} laps</small>
        </div>
      </div>
    </div>

    <div v-if="selectedClassId && numberOfStopwatches > 0" class="card">
      <div class="global-controls">
        <button class="btn-primary" :disabled="allRunning" @click="startAllTimers">
          ▶️ {{ t('COMMON.start-all') || 'Start All' }}
        </button>
        <button class="btn-warning" :disabled="noneRunning" @click="stopAllTimers">
          ⏹️ {{ t('COMMON.stop-all') || 'Stop All' }}
        </button>
        <button class="btn-secondary" @click="resetAllTimers">
          🔄 {{ t('COMMON.reset-all') || 'Reset All' }}
        </button>
        <button class="btn-success" :disabled="!hasStoppedTimers" @click="saveAllTimes">
          💾 {{ t('COMMON.save-all') || 'Alles speichern' }}
        </button>
      </div>
    </div>

    <div v-if="capturedTimes.length > 0" class="card">
      <div class="card-header">
        <h3>{{ t('MULTISTOP.captured-times') }}</h3>
        <div class="header-actions">
          <button class="btn-secondary btn-small" @click="exportTimes">
            📊 {{ t('COMMON.export') || 'Exportieren' }}
          </button>
        </div>
      </div>
      <div class="captured-times-list">
        <div v-for="(record, index) in capturedTimes" :key="index" class="time-record">
          <div class="record-info">
            <strong>{{ record.studentName }}</strong>
            <span class="record-time">{{ formatTime(record.time) }}</span>
          </div>
          <div class="record-meta">
            <small>{{ new Date(record.timestamp).toLocaleTimeString() }}</small>
            <button class="btn-icon btn-danger btn-small" @click="deleteRecord(index)">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div v-if="mittelstreckeCategories.length > 0" class="handoff-section">
        <h4>{{ t('MULTISTOP.send-to-mittelstrecke') }}</h4>
        <div class="handoff-row">
          <select v-model="selectedCategoryId" class="form-input">
            <option value="">{{ t('MULTISTOP.select-category') }}...</option>
            <option v-for="cat in mittelstreckeCategories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
          <button class="btn-primary" :disabled="!selectedCategoryId || sending" @click="sendToMittelstrecke">
            {{ sending ? '…' : '→' }} {{ t('MITTELSTRECKE.bewerte') || 'Zur Bewertung' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="selectedClassId" class="card">
      <div class="card-header">
        <h3>{{ t('MULTISTOP.session-history') }}</h3>
      </div>
      <div v-if="sessionHistory.length === 0" class="empty-state">
        {{ t('MULTISTOP.no-sessions') }}
      </div>
      <div v-else class="session-list">
        <div v-for="session in sessionHistory" :key="session.id" class="session-item">
          <span class="session-date">{{ formatSessionDate(session.startedAt) }}</span>
          <span class="session-count">
            {{ session.sessionMetadata.results?.length ?? 0 }} {{ t('MULTISTOP.schueler') }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { useMultistopView } from '../composables/useMultistopView'

const { t } = useI18n()

const {
  allRunning,
  assignStudent,
  availableStudents,
  capturedTimes,
  classes,
  deleteRecord,
  exportTimes,
  formatSessionDate,
  formatTime,
  getStudentName,
  hasStoppedTimers,
  loadStudents,
  mittelstreckeCategories,
  noneRunning,
  numberOfStopwatches,
  resetAllTimers,
  resetTimer,
  saveAllTimes,
  saveTime,
  selectedCategoryId,
  selectedClassId,
  sendToMittelstrecke,
  sending,
  sessionHistory,
  startAllTimers,
  startTimer,
  stopAllTimers,
  stopTimer,
  students,
  timers,
  toast,
  unassignStudent
} = useMultistopView()
</script>

<style scoped src="./Multistop.css"></style>
