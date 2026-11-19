<template>
  <div class="multistop-view sport-ui">
    <div class="page-header">
      <h2>{{ t('MULTISTOP.bewerte') }}</h2>
      <p class="page-description">{{ t('MULTISTOP.capture-time') }}</p>
    </div>

    <div class="card app-card">
      <div class="form-group">
        <label>{{ t('KLASSEN.klasse') }}</label>
        <Select :modelValue="selectedClassId" :options="classOptions"
          optionLabel="label" optionValue="value" fluid
          @update:modelValue="value => { selectedClassId = value; void loadStudents() }" />
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
          <Select :modelValue="timer.studentId" :options="studentOptions"
            optionLabel="label" optionValue="value" class="form-input-small" fluid
            @update:modelValue="value => { timer.studentId = value; void assignStudent(index) }" />
        </div>
        <div v-else class="student-name">
          {{ getStudentName(timer.studentId) }}
        </div>

        <div class="time-display">
          {{ formatTime(timer.time) }}
        </div>

        <div class="stopwatch-controls">
          <Button
            v-if="!timer.isRunning && !timer.isStopped"
           
            :disabled="!timer.studentId"
            @click="startTimer(index)"
          >
            ▶️
          </Button>
          <Button v-if="timer.isRunning" severity="warn" :label="t('COMMON.stop') || 'Stop'"
            icon="pi pi-stop" @click="stopTimer(index)" />
          <Button v-if="timer.isStopped" severity="success" :label="t('COMMON.save')"
            icon="pi pi-save" @click="saveTime(index)" />
          <Button severity="secondary" outlined v-if="timer.time > 0" @click="resetTimer(index)">
            🔄
          </Button>
        </div>

        <div v-if="timer.laps.length > 0" class="lap-times-mini">
          <small>{{ timer.laps.length }} laps</small>
        </div>
      </div>
    </div>

    <div v-if="selectedClassId && numberOfStopwatches > 0" class="card app-card">
      <div class="global-controls">
        <Button :disabled="allRunning" @click="startAllTimers">
          ▶️ {{ t('COMMON.start-all') || 'Start All' }}
        </Button>
        <Button severity="warn" icon="pi pi-stop" :disabled="noneRunning"
          :label="t('COMMON.stop-all') || 'Stop All'" @click="stopAllTimers" />
        <Button severity="secondary" outlined @click="resetAllTimers">
          🔄 {{ t('COMMON.reset-all') || 'Reset All' }}
        </Button>
        <Button severity="success" icon="pi pi-save" :disabled="!hasStoppedTimers"
          :label="t('COMMON.save-all') || 'Alles speichern'" @click="saveAllTimes" />
      </div>
    </div>

    <div v-if="capturedTimes.length > 0" class="card app-card">
      <div class="card-header">
        <h3>{{ t('MULTISTOP.captured-times') }}</h3>
        <div class="header-actions">
          <Button severity="secondary" outlined @click="exportTimes">
            📊 {{ t('COMMON.export') || 'Exportieren' }}
          </Button>
        </div>
      </div>
      <div class="captured-times-list">
        <div v-for="(record, index) in capturedTimes" :key="index" class="time-record">
          <div class="record-info">
            <strong>{{ record.studentName }}</strong>
            <span class="record-time">{{ formatTime(record.time) }}</span>
          </div>
          <div class="record-meta">
            <small>{{ formatGermanTime(new Date(record.timestamp)) }}</small>
            <Button severity="danger" class="btn-icon" @click="deleteRecord(index)">
              🗑️
            </Button>
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
          <Button :disabled="!selectedCategoryId || sending" @click="sendToMittelstrecke">
            {{ sending ? '…' : '→' }} {{ t('MITTELSTRECKE.bewerte') || 'Zur Bewertung' }}
          </Button>
        </div>
      </div>
    </div>

    <div v-if="selectedClassId" class="card app-card">
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
import Button from 'openvue/button'
import Select from 'openvue/select'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMultistopView } from '../composables/useMultistopView'
import { formatGermanTime } from '../utils/locale-format'

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

const classOptions = computed(() => [
  { label: `${t('SELECT.ok')} ${t('KLASSEN.klasse')}`, value: '' },
  ...classes.value.map(group => ({ label: group.name, value: group.id }))
])
const studentOptions = computed(() => [
  { label: t('MULTISTOP.select-student-hint'), value: '' },
  ...availableStudents.value.map(student => ({
    label: `${student.firstName} ${student.lastName}`,
    value: student.id
  }))
])
</script>

<style scoped src="./Multistop.css"></style>
