<template>
  <div class="tournaments-view sport-ui">
    <!-- LIST VIEW -->
    <template v-if="view === 'list'">
      <div class="page-header">
        <h2>{{ t('TOURNAMENTS.title') }}</h2>
        <Button type="button" @click="startCreate">
          + {{ t('TOURNAMENTS.new') }}
        </Button>
      </div>

      <div v-if="loading" class="loading">…</div>
      <div v-else-if="tournaments.length === 0" class="empty-state">
        {{ t('TOURNAMENTS.empty') }}
      </div>
      <ul v-else class="tournament-list">
        <li
          v-for="tournament in tournaments"
          :key="tournament.id"
          class="tournament-card app-card"
          @click="openTournament(tournament)"
        >
          <div class="tournament-card-header">
            <span class="tournament-name">{{ tournament.name }}</span>
            <span :class="['status-badge', tournament.status]">
              {{ t(`TOURNAMENTS.status.${tournament.status}`) }}
            </span>
          </div>
          <div class="tournament-meta">
            <span>{{ formatType(tournament.type) }}</span>
            <span>{{ tournament.teams.length }} {{ tournament.type === 'adaptive' ? t('TOURNAMENTS.adaptive_players') : t('TOURNAMENT.teams') }}</span>
          </div>
        </li>
      </ul>
    </template>

    <!-- CREATE FORM -->
    <template v-else-if="view === 'create'">
      <div class="page-header">
        <Button type="button" severity="secondary" text icon="pi pi-arrow-left"
          :label="t('TOURNAMENTS.back')" @click="cancelCreate" />
        <h2>{{ t('TOURNAMENTS.create') }}</h2>
      </div>

      <form class="create-form card app-card" @submit.prevent="submitCreate">
        <div class="form-group">
          <label>{{ t('TOURNAMENTS.name_label') }}</label>
          <InputText v-model="form.name" :placeholder="t('TOURNAMENTS.name_placeholder')"
            required fluid />
        </div>

        <div class="form-group">
          <label>{{ t('TOURNAMENTS.format_label') }}</label>
          <Select v-model="form.type" :options="tournamentTypeOptions"
            optionLabel="label" optionValue="value" fluid />
        </div>

        <div v-if="form.type === 'adaptive'" class="form-group">
          <label for="tournament-team-size">{{ t('TOURNAMENTS.adaptive_team_size') }}</label>
          <Select inputId="tournament-team-size" v-model="form.teamSize" :options="teamSizeOptions"
            optionLabel="label" optionValue="value" fluid />
        </div>
        <div v-if="form.type === 'adaptive'" class="form-group">
          <label for="tournament-class">{{ t('TOURNAMENTS.adaptive_class') }}</label>
          <Select inputId="tournament-class" :modelValue="selectedClassId" :options="classOptions"
            optionLabel="label" optionValue="value" fluid
            @update:modelValue="value => { selectedClassId = value; void loadClassStudents() }" />
          <p>{{ classStudents.length }} {{ t('TOURNAMENTS.adaptive_players') }}</p>
        </div>
        <div v-else class="form-group">
          <label>{{ t('TOURNAMENTS.teams_label') }}</label>
          <p v-if="importedTeamHandoff">{{ t('TOURNAMENTS.imported_from_team_builder') }}</p>
          <ul class="team-list-editor">
            <li v-for="(_, idx) in form.teams" :key="idx" class="team-list-row">
              <input
                v-model="form.teams[idx]"
                :readonly="Boolean(importedTeamHandoff)"
                class="form-input team-input"
                type="text"
                :placeholder="`${t('TOURNAMENT.team')} ${idx + 1}`"
              />
              <button
                v-if="!importedTeamHandoff && form.teams.length > 2"
                class="btn-icon"
                type="button"
                @click="removeTeam(idx)"
              >✕</button>
            </li>
          </ul>
          <Button severity="secondary" outlined v-if="!importedTeamHandoff" type="button" @click="addTeam">
            + {{ t('TOURNAMENTS.add_team') }}
          </Button>
          <p v-if="createError" class="error-text">{{ createError }}</p>
        </div>

        <div class="form-actions">
          <Button severity="secondary" outlined type="button" @click="cancelCreate">
            {{ t('TOURNAMENTS.cancel') }}
          </Button>
          <Button type="submit" :disabled="saving">
            {{ t('TOURNAMENTS.create') }}
          </Button>
        </div>
      </form>
    </template>

    <!-- TOURNAMENT DETAIL -->
    <template v-else-if="view === 'detail' && activeTournament">
      <div class="page-header">
        <Button type="button" severity="secondary" text icon="pi pi-arrow-left"
          :label="t('TOURNAMENTS.back')" @click="backToList" />
        <h2>{{ activeTournament.name }}</h2>
        <span :class="['status-badge', activeTournament.status]">
          {{ t(`TOURNAMENTS.status.${activeTournament.status}`) }}
        </span>
        <Button severity="danger" type="button" @click="deleteTournament">
          {{ t('TOURNAMENTS.delete') }}
        </Button>
      </div>

      <!-- Tab bar -->
      <div class="tab-bar">
        <button
          :class="['tab-btn', { active: detailTab === 'matches' }]"
          type="button"
          @click="detailTab = 'matches'"
        >{{ t('TOURNAMENT.matches') }}</button>
        <button
          v-if="activeTournament.type === 'round-robin' || activeTournament.type === 'adaptive'"
          :class="['tab-btn', { active: detailTab === 'standings' }]"
          type="button"
          @click="detailTab = 'standings'"
        >{{ t('TOURNAMENTS.standings') }}</button>
        <button
          v-if="activeTournament.type === 'knockout'"
          :class="['tab-btn', { active: detailTab === 'bracket' }]"
          type="button"
          @click="detailTab = 'bracket'"
        >{{ t('TOURNAMENTS.bracket') }}</button>
      </div>

      <section v-if="activeTournament.type === 'adaptive'" class="card adaptive-round-panel app-card">
        <h3>{{ t('TOURNAMENTS.adaptive_today') }}</h3>
        <p>{{ t('TOURNAMENTS.adaptive_attendance_hint') }}</p>
        <div class="adaptive-players">
          <label v-for="team in activeTournament.teams" :key="team.id" class="adaptive-player">
            <input v-model="presentStudentIds" type="checkbox" :value="team.studentIds[0]" />
            {{ team.name }}
          </label>
        </div>
        <Button type="button" :disabled="saving || presentStudentIds.length < 2 * (activeTournament.teamSize ?? 1)" @click="drawRound">
          {{ t('TOURNAMENTS.adaptive_draw') }}
        </Button>
        <p v-if="roundError" class="error-text">{{ roundError }}</p>
      </section>

      <!-- Matches tab -->
      <div v-if="detailTab === 'matches'" class="matches-section">
        <div
          v-for="round in matchesByRound"
          :key="round.round"
          class="round-section"
        >
          <h3 class="round-header">{{ t('TOURNAMENT.round') }} {{ round.round }} <small v-if="round.matches[0]?.sessionDate">{{ round.matches[0].sessionDate }}</small></h3>
          <ul class="match-list">
            <li
              v-for="match in round.matches"
              :key="match.id"
              class="match-row"
            >
              <span class="team-name">{{ matchTeamName(match, 1) }}</span>
              <span class="vs-label">{{ match.team2Id ? t('TOURNAMENTS.vs') : '' }}</span>
              <span class="team-name">{{ match.team2Id ? matchTeamName(match, 2) : t('TOURNAMENTS.adaptive_bye') }}</span>
              <template v-if="match.status === 'completed' && match.team2Id">
                <span class="score-display">{{ match.score1 }} : {{ match.score2 }}</span>
              </template>
              <Button severity="secondary" outlined
                v-if="match.team1Id && match.team2Id && match.status !== 'completed' && match.status !== 'cancelled'"
                class="btn-sm"
                type="button"
                @click="openScoreEntry(match)"
              >{{ t('TOURNAMENTS.enter_result') }}</Button>
              <Button severity="secondary" outlined v-if="activeTournament.type === 'adaptive' && match.status === 'scheduled'" class="btn-sm" type="button" :disabled="saving" @click="cancelAdaptiveMatch(match.id)">{{ t('TOURNAMENTS.adaptive_cancel_match') }}</Button>
              <span v-if="match.status === 'cancelled'">{{ t('TOURNAMENTS.adaptive_cancelled') }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Standings tab (round-robin) -->
      <div v-if="detailTab === 'standings'" class="standings-section">
        <table class="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{{ t('TOURNAMENT.table_cols.team') }}</th>
              <th>{{ t('TOURNAMENT.table_cols.played') }}</th>
              <th>{{ t('TOURNAMENT.table_cols.wins') }}</th>
              <th>{{ t('TOURNAMENT.table_cols.draws') }}</th>
              <th>{{ t('TOURNAMENT.table_cols.losses') }}</th>
              <th v-if="activeTournament.type === 'round-robin'">{{ t('TOURNAMENT.table_cols.goals') }}</th>
              <th>{{ t('TOURNAMENT.table_cols.points') }}</th>
              <th v-if="activeTournament.type === 'adaptive'">{{ t('TOURNAMENTS.adaptive_rating') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in standings" :key="row.teamId">
              <td>{{ index + 1 }}</td>
              <td>{{ row.teamName }}</td>
              <td>{{ row.played }}</td>
              <td>{{ row.wins }}</td>
              <td>{{ row.draws }}</td>
              <td>{{ row.losses }}</td>
              <td v-if="activeTournament.type === 'round-robin'">{{ 'goalsFor' in row ? row.goalsFor : 0 }}:{{ 'goalsAgainst' in row ? row.goalsAgainst : 0 }}</td>
              <td class="points-cell">{{ row.points }}</td>
              <td v-if="activeTournament.type === 'adaptive'">{{ 'rating' in row ? Math.round(row.rating) : '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bracket tab (knockout) -->
      <div v-if="detailTab === 'bracket'" class="bracket-section">
        <div
          v-for="bracketRound in knockoutBracket.rounds"
          :key="bracketRound.round"
          class="bracket-round"
        >
          <h3 class="round-header">{{ bracketRound.label }}</h3>
          <ul class="match-list">
            <li
              v-for="match in bracketRound.matches"
              :key="match.id"
              class="match-row"
            >
              <span class="team-name">{{ teamName(match.team1Id) || '?' }}</span>
              <span class="vs-label">{{ t('TOURNAMENTS.vs') }}</span>
              <span class="team-name">{{ teamName(match.team2Id) || '?' }}</span>
              <template v-if="match.status === 'completed'">
                <span class="score-display">{{ match.score1 }} : {{ match.score2 }}</span>
              </template>
              <Button severity="secondary" outlined
                v-if="match.team1Id && match.team2Id && match.status !== 'completed'"
                class="btn-sm"
                type="button"
                @click="openScoreEntry(match)"
              >{{ t('TOURNAMENTS.enter_result') }}</Button>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <!-- Score Entry Modal -->
    <div v-if="scoreEntry.open" class="modal-overlay" @click.self="closeScoreEntry">
      <div class="modal-card">
        <h3>{{ t('TOURNAMENTS.enter_result') }}</h3>

        <!-- Scoreboard session import -->
        <div v-if="scoreboardSessions.length > 0" class="form-group scoreboard-import-group">
          <label class="form-label">{{ t('TOURNAMENTS.import_from_scoreboard') }}</label>
          <select
            v-model="selectedScoreboardSessionId"
            class="form-select"
            @change="applyScoreboardSession(selectedScoreboardSessionId)"
          >
            <option value="">{{ t('TOURNAMENTS.select_scoreboard_session') }}</option>
            <option
              v-for="session in scoreboardSessions"
              :key="session.id"
              :value="session.id"
            >
              {{ scoreboardSessionLabel(session) }}
            </option>
          </select>
          <p v-if="scoreboardImportHint" class="import-hint">
            {{ t('TOURNAMENTS.scoreboard_imported') }}
          </p>
        </div>

        <div class="score-entry-row">
          <span class="team-name">{{ matchTeamName(scoreEntry.match!, 1) }}</span>
          <input
            v-model.number="scoreEntry.score1"
            class="score-input"
            type="number"
            min="0"
          />
          <span class="vs-label">:</span>
          <input
            v-model.number="scoreEntry.score2"
            class="score-input"
            type="number"
            min="0"
          />
          <span class="team-name">{{ matchTeamName(scoreEntry.match!, 2) }}</span>
        </div>
        <p v-if="scoreError" class="error-text">{{ scoreError }}</p>
        <div class="modal-actions">
          <Button severity="secondary" outlined type="button" @click="closeScoreEntry">
            {{ t('TOURNAMENTS.cancel') }}
          </Button>
          <Button type="button" :disabled="saving" @click="saveScore">
            {{ t('TOURNAMENTS.save_result') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'openvue/button'
import InputText from 'openvue/inputtext'
import Select from 'openvue/select'
import { computed } from 'vue'
import { useTournamentsView } from '../composables/useTournamentsView'

const {
  t,
  view,
  detailTab,
  loading,
  saving,
  tournaments,
  activeTournament,
  createError,
  classes,
  classStudents,
  selectedClassId,
  importedTeamHandoff,
  presentStudentIds,
  roundError,
  loadClassStudents,
  drawRound,
  cancelAdaptiveMatch,
  scoreError,
  form,
  scoreEntry,
  scoreboardSessions,
  selectedScoreboardSessionId,
  scoreboardImportHint,
  teamName,
  matchTeamName,
  formatType,
  matchesByRound,
  standings,
  knockoutBracket,
  startCreate,
  cancelCreate,
  openTournament,
  backToList,
  addTeam,
  removeTeam,
  submitCreate,
  openScoreEntry,
  closeScoreEntry,
  applyScoreboardSession,
  scoreboardSessionLabel,
  saveScore,
  deleteTournament,
} = useTournamentsView()

const tournamentTypeOptions = computed(() => [
  { label: t('TOURNAMENTS.mode.round_robin'), value: 'round-robin' },
  { label: t('TOURNAMENTS.mode.knockout'), value: 'knockout' },
  ...(!importedTeamHandoff.value
    ? [{ label: t('TOURNAMENTS.mode.adaptive'), value: 'adaptive' }]
    : [])
])
const teamSizeOptions = computed(() => Array.from({ length: 6 }, (_, i) => ({
  label: `${i + 1} ${t('TOURNAMENTS.adaptive_vs')} ${i + 1}`,
  value: i + 1
})))
const classOptions = computed(() => [
  { label: t('TOURNAMENTS.adaptive_choose_class'), value: '' },
  ...classes.value.map(group => ({ label: group.name, value: group.id }))
])
</script>

<style scoped src="./Tournaments.css"></style>
