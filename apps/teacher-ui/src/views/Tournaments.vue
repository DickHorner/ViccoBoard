<template>
  <div class="tournaments-view">
    <!-- LIST VIEW -->
    <template v-if="view === 'list'">
      <div class="page-header">
        <h2>{{ t('TOURNAMENTS.title') }}</h2>
        <button class="btn-primary" type="button" @click="startCreate">
          + {{ t('TOURNAMENTS.new') }}
        </button>
      </div>

      <div v-if="loading" class="loading">…</div>
      <div v-else-if="tournaments.length === 0" class="empty-state">
        {{ t('TOURNAMENTS.empty') }}
      </div>
      <ul v-else class="tournament-list">
        <li
          v-for="tournament in tournaments"
          :key="tournament.id"
          class="tournament-card"
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
            <span>{{ tournament.teams.length }} {{ t('TOURNAMENT.teams') }}</span>
          </div>
        </li>
      </ul>
    </template>

    <!-- CREATE FORM -->
    <template v-else-if="view === 'create'">
      <div class="page-header">
        <button class="btn-back" type="button" @click="cancelCreate">← {{ t('TOURNAMENTS.back') }}</button>
        <h2>{{ t('TOURNAMENTS.create') }}</h2>
      </div>

      <form class="create-form card" @submit.prevent="submitCreate">
        <div class="form-group">
          <label>{{ t('TOURNAMENTS.name_label') }}</label>
          <input
            v-model="form.name"
            class="form-input"
            type="text"
            :placeholder="t('TOURNAMENTS.name_placeholder')"
            required
          />
        </div>

        <div class="form-group">
          <label>{{ t('TOURNAMENTS.format_label') }}</label>
          <select v-model="form.type" class="form-select">
            <option value="round-robin">{{ t('TOURNAMENTS.mode.round_robin') }}</option>
            <option value="knockout">{{ t('TOURNAMENTS.mode.knockout') }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ t('TOURNAMENTS.teams_label') }}</label>
          <ul class="team-list-editor">
            <li v-for="(_, idx) in form.teams" :key="idx" class="team-list-row">
              <input
                v-model="form.teams[idx]"
                class="form-input team-input"
                type="text"
                :placeholder="`${t('TOURNAMENT.team')} ${idx + 1}`"
              />
              <button
                v-if="form.teams.length > 2"
                class="btn-icon"
                type="button"
                @click="removeTeam(idx)"
              >✕</button>
            </li>
          </ul>
          <button class="btn-secondary" type="button" @click="addTeam">
            + {{ t('TOURNAMENTS.add_team') }}
          </button>
          <p v-if="createError" class="error-text">{{ createError }}</p>
        </div>

        <div class="form-actions">
          <button class="btn-secondary" type="button" @click="cancelCreate">
            {{ t('TOURNAMENTS.cancel') }}
          </button>
          <button class="btn-primary" type="submit" :disabled="saving">
            {{ t('TOURNAMENTS.create') }}
          </button>
        </div>
      </form>
    </template>

    <!-- TOURNAMENT DETAIL -->
    <template v-else-if="view === 'detail' && activeTournament">
      <div class="page-header">
        <button class="btn-back" type="button" @click="backToList">← {{ t('TOURNAMENTS.back') }}</button>
        <h2>{{ activeTournament.name }}</h2>
        <span :class="['status-badge', activeTournament.status]">
          {{ t(`TOURNAMENTS.status.${activeTournament.status}`) }}
        </span>
        <button class="btn-danger" type="button" @click="deleteTournament">
          {{ t('TOURNAMENTS.delete') }}
        </button>
      </div>

      <!-- Tab bar -->
      <div class="tab-bar">
        <button
          :class="['tab-btn', { active: detailTab === 'matches' }]"
          type="button"
          @click="detailTab = 'matches'"
        >{{ t('TOURNAMENT.matches') }}</button>
        <button
          v-if="activeTournament.type === 'round-robin'"
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

      <!-- Matches tab -->
      <div v-if="detailTab === 'matches'" class="matches-section">
        <div
          v-for="round in matchesByRound"
          :key="round.round"
          class="round-section"
        >
          <h3 class="round-header">{{ t('TOURNAMENT.round') }} {{ round.round }}</h3>
          <ul class="match-list">
            <li
              v-for="match in round.matches"
              :key="match.id"
              class="match-row"
            >
              <span class="team-name">{{ teamName(match.team1Id) }}</span>
              <span class="vs-label">{{ t('TOURNAMENTS.vs') }}</span>
              <span class="team-name">{{ teamName(match.team2Id) }}</span>
              <template v-if="match.status === 'completed'">
                <span class="score-display">{{ match.score1 }} : {{ match.score2 }}</span>
              </template>
              <button
                v-if="match.team1Id && match.team2Id && match.status !== 'completed'"
                class="btn-secondary btn-sm"
                type="button"
                @click="openScoreEntry(match)"
              >{{ t('TOURNAMENTS.enter_result') }}</button>
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
              <th>{{ t('TOURNAMENT.table_cols.goals') }}</th>
              <th>{{ t('TOURNAMENT.table_cols.points') }}</th>
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
              <td>{{ row.goalsFor }}:{{ row.goalsAgainst }}</td>
              <td class="points-cell">{{ row.points }}</td>
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
              <button
                v-if="match.team1Id && match.team2Id && match.status !== 'completed'"
                class="btn-secondary btn-sm"
                type="button"
                @click="openScoreEntry(match)"
              >{{ t('TOURNAMENTS.enter_result') }}</button>
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
          <span class="team-name">{{ teamName(scoreEntry.match!.team1Id) }}</span>
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
          <span class="team-name">{{ teamName(scoreEntry.match!.team2Id) }}</span>
        </div>
        <p v-if="scoreError" class="error-text">{{ scoreError }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" type="button" @click="closeScoreEntry">
            {{ t('TOURNAMENTS.cancel') }}
          </button>
          <button class="btn-primary" type="button" :disabled="saving" @click="saveScore">
            {{ t('TOURNAMENTS.save_result') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  scoreError,
  form,
  scoreEntry,
  scoreboardSessions,
  selectedScoreboardSessionId,
  scoreboardImportHint,
  teamName,
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
</script>

<style scoped src="./Tournaments.css"></style>
