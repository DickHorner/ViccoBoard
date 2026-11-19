<template>
  <div class="team-view sport-ui">
    <div class="page-header">
      <Button text severity="secondary" icon="pi pi-arrow-left" @click="$router.back()">{{ t('COMMON.back') }}</Button>
      <h2>{{ t('TEAM.team-erstellen') }}</h2>
      <p class="page-description">{{ t('TEAM.teams-klasse') }}</p>
    </div>

    <section class="card app-card">
      <div class="form-row">
        <div class="form-group">
          <label for="team-class">{{ t('KLASSEN.klasse') }}</label>
          <Select inputId="team-class" :modelValue="selectedClassId" :options="classOptions"
            optionLabel="label" optionValue="value" fluid
            @update:modelValue="value => { selectedClassId = value; void loadStudents() }" />
        </div>
        <div class="form-group">
          <label for="team-session-name">{{ t('TEAM.session-name') }}</label>
          <InputText id="team-session-name" v-model="sessionName" :placeholder="t('TEAM.set-name-vor-generierung')" fluid />
        </div>
        <div class="form-group">
          <label for="team-label">{{ t('TEAM.bezeichnung') }}</label>
          <InputText id="team-label" v-model="teamLabel" fluid />
        </div>
      </div>

      <div class="form-group slider-group">
        <label>{{ t('TEAM.anzahl-slider') }}: <strong>{{ teamCount }}</strong></label>
        <input v-model.number="teamCount" type="range" min="2" :max="maxTeamCount" step="1" class="team-count-slider" />
        <div class="slider-presets">
          <button
            v-for="preset in teamCountPresets"
            :key="preset"
            class="preset-btn"
            :class="{ active: teamCount === preset }"
            @click="teamCount = preset"
          >{{ preset }}</button>
        </div>
      </div>

      <div class="form-row">
        <label class="checkbox-row">
          <input v-model="useLatestAttendance" type="checkbox" @change="loadStudents" />
          <span>{{ t('TEAM.anwesenheit') }}</span>
        </label>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="team-algorithm">{{ t('TEAM.algorithm') }}</label>
          <Select inputId="team-algorithm" v-model="algorithm" :options="algorithmOptions"
            optionLabel="label" optionValue="value" fluid />
        </div>
        <div v-if="showBasisSelector" class="form-group">
          <label for="team-basis">{{ t('TEAM.basis') }}</label>
          <Select inputId="team-basis" v-model="basis" :options="basisOptions"
            optionLabel="label" optionValue="value" fluid />
        </div>
      </div>

      <details class="expandable-section">
        <summary class="expandable-title">{{ t('TEAM.rollen') }}</summary>
        <div class="expandable-body">
          <p class="hint-text">{{ t('TEAM.rollen-hint') }}</p>
          <div class="form-row">
            <div class="form-group">
              <InputText v-model="rolesInput" :placeholder="t('TEAM.rollen-hint')" fluid />
            </div>
          </div>
        </div>
      </details>

      <details v-if="students.length > 0" class="expandable-section">
        <summary class="expandable-title">{{ t('TEAM.ausschlussregeln') }}</summary>
        <div class="expandable-body">
          <p class="hint-text">{{ t('TEAM.ausschlussregeln-hint') }}</p>

          <div class="constraint-section">
            <h4 class="constraint-title">{{ t('TEAM.nie-zusammen') }}</h4>
            <div v-for="(rule, idx) in neverTogetherRules" :key="'never-' + idx" class="rule-row">
              <div class="rule-students">
                <select v-for="(_sid, si) in rule" :key="si" v-model="neverTogetherRules[idx][si]" class="form-input rule-select">
                  <option value="">–</option>
                  <option v-for="s in students" :key="s.id" :value="s.id">{{ s.firstName }} {{ s.lastName }}</option>
                </select>
              </div>
              <button class="btn-icon" :title="t('TEAM.regel-entfernen')" @click="removeConstraint('never', idx)">✕</button>
            </div>
            <Button severity="secondary" outlined @click="addConstraint('never')">+ {{ t('TEAM.regel-hinzufuegen') }}</Button>
          </div>

          <div class="constraint-section" style="margin-top: 1rem;">
            <h4 class="constraint-title">{{ t('TEAM.immer-zusammen') }}</h4>
            <div v-for="(rule, idx) in alwaysTogetherRules" :key="'always-' + idx" class="rule-row">
              <div class="rule-students">
                <select v-for="(_sid, si) in rule" :key="si" v-model="alwaysTogetherRules[idx][si]" class="form-input rule-select">
                  <option value="">–</option>
                  <option v-for="s in students" :key="s.id" :value="s.id">{{ s.firstName }} {{ s.lastName }}</option>
                </select>
              </div>
              <button class="btn-icon" :title="t('TEAM.regel-entfernen')" @click="removeConstraint('always', idx)">✕</button>
            </div>
            <Button severity="secondary" outlined @click="addConstraint('always')">+ {{ t('TEAM.regel-hinzufuegen') }}</Button>
          </div>
        </div>
      </details>

      <div v-if="warning" class="warning-banner">{{ warning }}</div>
      <div v-if="constraintErrors.length > 0" class="error-banner">
        <strong>{{ t('TEAM.constraint-fehler') }}</strong>
        <p>{{ t('TEAM.constraint-fehler-detail') }}</p>
        <ul>
          <li v-for="(err, i) in constraintErrors" :key="i">{{ err }}</li>
        </ul>
      </div>

      <div class="form-actions">
        <Button :disabled="!canGenerate" @click="generateTeams">{{ t('TEAM.erstellen') }}</Button>
        <Button severity="secondary" outlined :disabled="teams.length === 0" @click="clearTeams">{{ t('TEAM.loeschen') }}</Button>
      </div>
    </section>

    <section v-if="teams.length > 0" class="card app-card">
      <div class="card-header">
        <h3>{{ t('TEAM.teams-klasse') }}</h3>
      </div>
      <div class="teams-grid">
        <div v-for="team in teams" :key="team.id" class="team-card">
          <h4>{{ team.name }}</h4>
          <ul>
            <li v-for="student in team.students" :key="student.id" class="student-row">
              <span>{{ student.firstName }} {{ student.lastName }}</span>
              <span v-if="team.roles && team.roles[student.id]" class="role-badge">{{ team.roles[student.id] }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="save-section">
        <div class="form-actions">
          <Button :disabled="!canSave" @click="saveTeams">{{ t('TEAM.speichern') }}</Button>
          <Button severity="secondary" outlined :disabled="!canHandoffToTournament" @click="handoffToTournament">{{ t('TEAM.handoff_to_tournament') }}</Button>
        </div>
        <div v-if="saveSuccess" class="success-banner">{{ t('TEAM.session-gespeichert') }}</div>
      </div>
    </section>

    <section v-if="selectedClassId" class="card app-card">
      <div class="card-header">
        <h3>{{ t('TEAM.gespeicherte-sessions') }}</h3>
      </div>
      <div v-if="savedSessions.length === 0" class="empty-hint">{{ t('TEAM.keine-sessions') }}</div>
      <div v-else class="sessions-list">
        <div v-for="session in savedSessions" :key="session.id" class="session-item">
          <div class="session-info">
            <span class="session-name">{{ session.sessionMetadata.sessionName }}</span>
            <span class="session-meta">
              {{ formatDate(session.createdAt) }} · {{ session.sessionMetadata.teams?.length }} {{ t('TEAM.anzahl') }}
            </span>
          </div>
          <Button severity="secondary" outlined @click="loadSession(session)">{{ t('TEAM.sitzung-laden') }}</Button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import Button from 'openvue/button'
import InputText from 'openvue/inputtext'
import Select from 'openvue/select'
import { computed } from 'vue'
import { useTeamBuilderView } from '../composables/useTeamBuilderView'

const {
  addConstraint,
  algorithm,
  alwaysTogetherRules,
  basis,
  canGenerate,
  canSave,
  canHandoffToTournament,
  classes,
  clearTeams,
  constraintErrors,
  formatDate,
  generateTeams,
  handoffToTournament,
  loadSession,
  loadStudents,
  maxTeamCount,
  neverTogetherRules,
  removeConstraint,
  rolesInput,
  saveSuccess,
  saveTeams,
  savedSessions,
  selectedClassId,
  sessionName,
  showBasisSelector,
  students,
  t,
  teamCount,
  teamCountPresets,
  teamLabel,
  teams,
  useLatestAttendance,
  warning
} = useTeamBuilderView()

const classOptions = computed(() => [
  { label: t('KLASSEN.klasse') + '...', value: '' },
  ...classes.value.map(group => ({ label: `${group.name} (${group.schoolYear})`, value: group.id }))
])
const algorithmOptions = computed(() => [
  { label: t('TEAM.algorithm-random'), value: 'random' },
  { label: t('TEAM.algorithm-gender-balanced'), value: 'gender-balanced' },
  { label: t('TEAM.algorithm-homogeneous'), value: 'homogeneous' },
  { label: t('TEAM.algorithm-heterogeneous'), value: 'heterogeneous' }
])
const basisOptions = computed(() => [
  { label: t('TEAM.basis-performance'), value: 'performance' },
  { label: t('TEAM.basis-performance-rating'), value: 'performanceRating' }
])
</script>

<style scoped src="./TeamBuilder.css"></style>
