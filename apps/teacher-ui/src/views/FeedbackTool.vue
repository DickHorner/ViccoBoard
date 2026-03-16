<template>
  <div class="feedback-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <h2>Feedback</h2>
    </div>

    <!-- Step 1: History / start new session -->
    <div v-if="view === 'list'" class="content">
      <section class="card">
        <div class="card-header">
          <h3>Neue Feedback-Runde starten</h3>
        </div>
        <div v-if="classes.length > 0" class="class-select-row">
          <label for="feedback-class">Klasse:</label>
          <select id="feedback-class" v-model="selectedClassId">
            <option value="">Keine Klasse gewählt</option>
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.name }}
            </option>
          </select>
        </div>
        <div class="method-grid">
          <button class="method-card" @click="startMethod('emoji')">
            <span class="method-icon">😊</span>
            <strong>Smiley-Abfrage</strong>
            <p>Schüler wählen: Gut / Neutral / Schlecht</p>
          </button>
          <button class="method-card" @click="startMethod('rating')">
            <span class="method-icon">⭐</span>
            <strong>Bewertungsskala</strong>
            <p>Bewertung von 1–5 pro Frage</p>
          </button>
        </div>
      </section>

      <section v-if="sessions.length > 0" class="card">
        <h3>Vergangene Feedback-Runden</h3>
        <ul class="session-list">
          <li v-for="s in sessions" :key="s.id" class="session-item">
            <div>
              <strong>{{ methodLabel(s.method.type) }}</strong>
              <span class="session-meta">{{ formatDate(s.createdAt) }}</span>
            </div>
            <div class="session-stats">
              <span>{{ s.responses.length }} Antworten</span>
              <button class="btn-link" @click="openAnalysis(s)">Auswertung</button>
            </div>
          </li>
        </ul>
      </section>
      <div v-else-if="!loading" class="empty-state">
        <p>Noch keine Feedback-Runden. Starten Sie eine neue Runde oben.</p>
      </div>
    </div>

    <!-- Step 2: Collect responses -->
    <div v-else-if="view === 'collect'" class="content">
      <section class="card">
        <div class="card-header">
          <h3>{{ methodLabel(activeMethod) }} – Antwort {{ responseIndex + 1 }}</h3>
          <span class="badge">{{ responses.length }} erfasst</span>
        </div>

        <!-- Emoji method -->
        <div v-if="activeMethod === 'emoji'" class="emoji-grid">
          <button class="emoji-btn" @click="recordEmoji('good')">😊<span>Gut</span></button>
          <button class="emoji-btn" @click="recordEmoji('neutral')">😐<span>Neutral</span></button>
          <button class="emoji-btn" @click="recordEmoji('bad')">😞<span>Schlecht</span></button>
        </div>

        <!-- Rating method -->
        <div v-if="activeMethod === 'rating'" class="rating-section">
          <p class="rating-question">{{ ratingQuestion }}</p>
          <div class="rating-row">
            <button
              v-for="n in 5"
              :key="n"
              class="rating-btn"
              :class="{ selected: currentRating === n }"
              @click="currentRating = n"
            >{{ n }}</button>
          </div>
          <button class="btn-primary" :disabled="!currentRating" @click="recordRating">
            Bestätigen
          </button>
        </div>

        <div class="collect-actions">
          <button class="btn-secondary" @click="finishSession">
            Abschliessen ({{ responses.length }} Antworten)
          </button>
        </div>
      </section>
    </div>

    <!-- Step 3: Analysis view -->
    <div v-else-if="view === 'analysis' && analysisSession" class="content">
      <section class="card">
        <div class="card-header">
          <h3>Auswertung – {{ methodLabel(analysisSession.method.type) }}</h3>
          <span class="session-meta">{{ formatDate(analysisSession.createdAt) }}</span>
        </div>

        <div v-if="analysisSession.method.type === 'emoji'" class="analysis-emoji">
          <div class="analysis-bar">
            <span>😊 Gut</span>
            <div class="bar-track">
              <div class="bar-fill good" :style="{ width: emojiPercent('good', analysisSession) + '%' }"></div>
            </div>
            <span class="bar-count">{{ emojiCount('good', analysisSession) }}</span>
          </div>
          <div class="analysis-bar">
            <span>😐 Neutral</span>
            <div class="bar-track">
              <div class="bar-fill neutral" :style="{ width: emojiPercent('neutral', analysisSession) + '%' }"></div>
            </div>
            <span class="bar-count">{{ emojiCount('neutral', analysisSession) }}</span>
          </div>
          <div class="analysis-bar">
            <span>😞 Schlecht</span>
            <div class="bar-track">
              <div class="bar-fill bad" :style="{ width: emojiPercent('bad', analysisSession) + '%' }"></div>
            </div>
            <span class="bar-count">{{ emojiCount('bad', analysisSession) }}</span>
          </div>
          <p class="analysis-summary">Gesamt: {{ analysisSession.responses.length }} Antworten</p>
        </div>

        <div v-else-if="analysisSession.method.type === 'rating'" class="analysis-rating">
          <p class="analysis-avg">Ø {{ ratingAverage(analysisSession).toFixed(1) }} / 5</p>
          <div class="rating-dist">
            <div v-for="n in 5" :key="n" class="analysis-bar">
              <span>{{ n }} ⭐</span>
              <div class="bar-track">
                <div class="bar-fill rating" :style="{ width: ratingPercent(n, analysisSession) + '%' }"></div>
              </div>
              <span class="bar-count">{{ ratingCountFor(n, analysisSession) }}</span>
            </div>
          </div>
          <p class="analysis-summary">Gesamt: {{ analysisSession.responses.length }} Antworten</p>
        </div>

        <div class="collect-actions">
          <button class="btn-secondary" @click="view = 'list'">Zurück zur Übersicht</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getSportBridge } from '../composables/useSportBridge'
import type { ClassGroup, Sport } from '@viccoboard/core'

type FeedbackView = 'list' | 'collect' | 'analysis'

interface EmojiAnswers { emoji: 'good' | 'neutral' | 'bad'; [key: string]: unknown }
interface RatingAnswers { rating: number; [key: string]: unknown }

function isEmojiAnswers(a: Record<string, unknown>): a is EmojiAnswers {
  return a['emoji'] === 'good' || a['emoji'] === 'neutral' || a['emoji'] === 'bad'
}
function isRatingAnswers(a: Record<string, unknown>): a is RatingAnswers {
  return typeof a['rating'] === 'number'
}

const bridge = getSportBridge()
const view = ref<FeedbackView>('list')
const sessions = ref<Sport.FeedbackSession[]>([])
const classes = ref<ClassGroup[]>([])
const selectedClassId = ref('')
const loading = ref(false)

// Collection state
const activeMethod = ref<'emoji' | 'rating'>('emoji')
const responses = ref<Sport.FeedbackResponse[]>([])
const responseIndex = ref(0)
const currentRating = ref<number | null>(null)
const ratingQuestion = 'Wie gut hat dir die heutige Stunde gefallen?'

// Analysis state
const analysisSession = ref<Sport.FeedbackSession | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    classes.value = await bridge.classGroupRepository.findAll()
    sessions.value = await bridge.feedbackSessionRepository.findAll()
  } finally {
    loading.value = false
  }
})

function methodLabel(type: string): string {
  const labels: Record<string, string> = {
    emoji: 'Smiley-Abfrage',
    rating: 'Bewertungsskala'
  }
  return labels[type] ?? type
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function startMethod(method: 'emoji' | 'rating') {
  activeMethod.value = method
  responses.value = []
  responseIndex.value = 0
  currentRating.value = null
  view.value = 'collect'
}

function recordEmoji(value: 'good' | 'neutral' | 'bad') {
  const answer: EmojiAnswers = { emoji: value }
  responses.value.push({ answers: answer, timestamp: new Date() })
  responseIndex.value++
}

function recordRating() {
  if (!currentRating.value) return
  const answer: RatingAnswers = { rating: currentRating.value }
  responses.value.push({ answers: answer, timestamp: new Date() })
  responseIndex.value++
  currentRating.value = null
}

async function finishSession() {
  if (responses.value.length === 0) {
    view.value = 'list'
    return
  }
  const classId = selectedClassId.value || (classes.value[0]?.id ?? 'unassigned')
  const method: Sport.FeedbackMethod = {
    id: activeMethod.value,
    name: methodLabel(activeMethod.value),
    type: activeMethod.value
  }
  const config: Sport.FeedbackConfig = {
    anonymous: true,
    questions: [{ id: 'q1', text: ratingQuestion, type: activeMethod.value === 'rating' ? 'rating' : 'choice', required: true }]
  }
  const session = await bridge.recordFeedbackSessionUseCase.execute({
    classGroupId: classId,
    method,
    configuration: config,
    responses: responses.value,
    completedAt: new Date()
  })
  sessions.value = [session, ...sessions.value]
  analysisSession.value = session
  view.value = 'analysis'
}

function openAnalysis(session: Sport.FeedbackSession) {
  analysisSession.value = session
  view.value = 'analysis'
}

// Analysis helpers
function emojiCount(value: 'good' | 'neutral' | 'bad', session: Sport.FeedbackSession): number {
  return session.responses.filter(r => isEmojiAnswers(r.answers) && r.answers.emoji === value).length
}
function emojiPercent(value: 'good' | 'neutral' | 'bad', session: Sport.FeedbackSession): number {
  if (session.responses.length === 0) return 0
  return (emojiCount(value, session) / session.responses.length) * 100
}
function ratingCountFor(n: number, session: Sport.FeedbackSession): number {
  return session.responses.filter(r => isRatingAnswers(r.answers) && r.answers.rating === n).length
}
function ratingPercent(n: number, session: Sport.FeedbackSession): number {
  if (session.responses.length === 0) return 0
  return (ratingCountFor(n, session) / session.responses.length) * 100
}
function ratingAverage(session: Sport.FeedbackSession): number {
  const ratings = session.responses
    .filter(r => isRatingAnswers(r.answers))
    .map(r => (r.answers as RatingAnswers).rating)
  if (ratings.length === 0) return 0
  return ratings.reduce((a, b) => a + b, 0) / ratings.length
}
</script>

<style scoped src="./FeedbackTool.css"></style>
