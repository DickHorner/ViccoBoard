<template>
  <div class="scoreboard-view">
    <div class="page-header">
      <h2>{{ t('SCORES.title') }}</h2>
      <div class="header-actions">
        <button class="btn-secondary" type="button" @click="resetScores">
          {{ t('TRACKING.controls.reset') }}
        </button>
      </div>
    </div>

    <div class="scoreboard-grid">
      <section class="team-card">
        <div class="team-header">
          <label class="team-label">{{ t('TOURNAMENT.team') }} A</label>
          <input
            v-model="teamA.name"
            class="team-input"
            type="text"
            :placeholder="`${t('TOURNAMENT.team')} A`"
          />
        </div>
        <div class="team-score">
          <button class="score-btn" type="button" @click="adjustScore('A', -1)">-1</button>
          <div class="score-value">{{ teamA.score }}</div>
          <button class="score-btn" type="button" @click="adjustScore('A', 1)">+1</button>
        </div>
        <div class="score-actions">
          <button class="btn-secondary" type="button" @click="adjustScore('A', 2)">+2</button>
          <button class="btn-secondary" type="button" @click="adjustScore('A', 3)">+3</button>
        </div>
      </section>

      <section class="team-card">
        <div class="team-header">
          <label class="team-label">{{ t('TOURNAMENT.team') }} B</label>
          <input
            v-model="teamB.name"
            class="team-input"
            type="text"
            :placeholder="`${t('TOURNAMENT.team')} B`"
          />
        </div>
        <div class="team-score">
          <button class="score-btn" type="button" @click="adjustScore('B', -1)">-1</button>
          <div class="score-value">{{ teamB.score }}</div>
          <button class="score-btn" type="button" @click="adjustScore('B', 1)">+1</button>
        </div>
        <div class="score-actions">
          <button class="btn-secondary" type="button" @click="adjustScore('B', 2)">+2</button>
          <button class="btn-secondary" type="button" @click="adjustScore('B', 3)">+3</button>
        </div>
      </section>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const teamA = ref({ name: '', score: 0 })
const teamB = ref({ name: '', score: 0 })

function adjustScore(team: 'A' | 'B', delta: number) {
  const target = team === 'A' ? teamA.value : teamB.value
  target.score = Math.max(0, target.score + delta)
}

function resetScores() {
  teamA.value.score = 0
  teamB.value.score = 0
}

</script>

<style scoped>
.scoreboard-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1.5rem;
  background: var(--surface-soft);
  border-radius: 24px;
  min-height: 70vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.scoreboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.team-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}


.team-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.team-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-muted);
}

.team-input {
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  padding: 0.6rem 0.8rem;
  font-size: 1rem;
}


.team-score {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
}

.score-value {
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
}

.score-btn {
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.2);
  padding: 0.6rem 0.9rem;
  font-size: 1rem;
  background: white;
  cursor: pointer;
}


.score-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}


@media (max-width: 900px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

}
</style>
