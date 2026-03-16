<template>
  <div class="team-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('TEAM.team-erstellen') }}</h2>
      <p class="page-description">{{ t('TEAM.teams-klasse') }}</p>
    </div>

    <section class="card">
      <div class="form-row">
        <div class="form-group">
          <label>{{ t('KLASSEN.klasse') }}</label>
          <select v-model="selectedClassId" class="form-input" @change="loadStudents">
            <option value="">{{ t('KLASSEN.klasse') }}...</option>
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.name }} ({{ cls.schoolYear }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ t('TEAM.session-name') }}</label>
          <input v-model="sessionName" type="text" class="form-input" :placeholder="t('TEAM.set-name-vor-generierung')" />
        </div>
        <div class="form-group">
          <label>{{ t('TEAM.bezeichnung') }}</label>
          <input v-model="teamLabel" type="text" class="form-input" />
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
          <label>{{ t('TEAM.algorithm') }}</label>
          <select v-model="algorithm" class="form-input">
            <option value="random">{{ t('TEAM.algorithm-random') }}</option>
            <option value="gender-balanced">{{ t('TEAM.algorithm-gender-balanced') }}</option>
            <option value="homogeneous">{{ t('TEAM.algorithm-homogeneous') }}</option>
            <option value="heterogeneous">{{ t('TEAM.algorithm-heterogeneous') }}</option>
          </select>
        </div>
        <div v-if="showBasisSelector" class="form-group">
          <label>{{ t('TEAM.basis') }}</label>
          <select v-model="basis" class="form-input">
            <option value="performance">{{ t('TEAM.basis-performance') }}</option>
            <option value="performanceRating">{{ t('TEAM.basis-performance-rating') }}</option>
          </select>
        </div>
      </div>

      <details class="expandable-section">
        <summary class="expandable-title">{{ t('TEAM.rollen') }}</summary>
        <div class="expandable-body">
          <p class="hint-text">{{ t('TEAM.rollen-hint') }}</p>
          <div class="form-row">
            <div class="form-group">
              <input v-model="rolesInput" type="text" class="form-input" :placeholder="t('TEAM.rollen-hint')" />
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
            <button class="btn-secondary btn-small" @click="addConstraint('never')">+ {{ t('TEAM.regel-hinzufuegen') }}</button>
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
            <button class="btn-secondary btn-small" @click="addConstraint('always')">+ {{ t('TEAM.regel-hinzufuegen') }}</button>
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
        <button class="btn-primary" :disabled="!canGenerate" @click="generateTeams">{{ t('TEAM.erstellen') }}</button>
        <button class="btn-secondary" :disabled="teams.length === 0" @click="clearTeams">{{ t('TEAM.loeschen') }}</button>
      </div>
    </section>

    <section v-if="teams.length > 0" class="card">
      <div class="card-header">
        <h3>{{ t('TEAM.turniere') }}</h3>
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
          <button class="btn-primary" :disabled="!canSave" @click="saveTeams">{{ t('TEAM.speichern') }}</button>
        </div>
        <div v-if="saveSuccess" class="success-banner">{{ t('TEAM.session-gespeichert') }}</div>
      </div>
    </section>

    <section v-if="selectedClassId" class="card">
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
          <button class="btn-secondary btn-small" @click="loadSession(session)">{{ t('TEAM.sitzung-laden') }}</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useTeamBuilderView } from '../composables/useTeamBuilderView'

const {
  addConstraint,
  algorithm,
  alwaysTogetherRules,
  basis,
  canGenerate,
  canSave,
  classes,
  clearTeams,
  constraintErrors,
  formatDate,
  generateTeams,
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
</script>

<style scoped src="./TeamBuilder.css"></style>
