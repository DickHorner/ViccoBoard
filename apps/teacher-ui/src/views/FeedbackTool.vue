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

<style scoped>
.feedback-view {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-header h2 {
  margin: 0;
  font-size: 1.75rem;
}

.back-button {
  background: none;
  border: none;
  color: #0f766e;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  min-height: 44px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1.5rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.class-select-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.class-select-row label {
  font-weight: 600;
  font-size: 0.875rem;
}

.class-select-row select {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.2);
  font-size: 1rem;
  min-height: 44px;
  background: white;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.badge {
  background: rgba(14, 116, 144, 0.12);
  color: #155e75;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
}

.method-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.method-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 2px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 1.5rem 1rem;
  cursor: pointer;
  transition: border-color 0.15s;
  min-height: 44px;
  font-size: 1rem;
}

.method-card:hover {
  border-color: #0f766e;
}

.method-card p {
  color: #64748b;
  font-size: 0.875rem;
  text-align: center;
  margin: 0;
}

.method-icon {
  font-size: 2.5rem;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.emoji-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 2px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 1.5rem 1rem;
  cursor: pointer;
  font-size: 2.5rem;
  min-height: 44px;
  transition: border-color 0.15s, background 0.15s;
}

.emoji-btn span {
  font-size: 0.875rem;
  color: #0f172a;
}

.emoji-btn:hover {
  border-color: #0f766e;
  background: #ecfdf5;
}

.rating-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
}

.rating-question {
  font-size: 1rem;
  margin: 0;
}

.rating-row {
  display: flex;
  gap: 0.75rem;
}

.rating-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid rgba(15, 23, 42, 0.15);
  background: #f8fafc;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.rating-btn.selected,
.rating-btn:hover {
  background: #0f766e;
  color: white;
  border-color: #0f766e;
}

.collect-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-primary {
  background: #0f766e;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  cursor: pointer;
  min-height: 44px;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #0f766e;
  border: 2px solid #0f766e;
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  cursor: pointer;
  min-height: 44px;
}

.btn-link {
  background: none;
  border: none;
  color: #0f766e;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  min-height: 44px;
  text-decoration: underline;
}

.session-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-radius: 10px;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.session-meta {
  margin-left: 0.75rem;
  font-size: 0.8rem;
  color: #64748b;
}

.session-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: #64748b;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

/* Analysis */
.analysis-emoji,
.analysis-rating {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.analysis-bar {
  display: grid;
  grid-template-columns: 100px 1fr 40px;
  align-items: center;
  gap: 0.75rem;
}

.bar-track {
  background: #f1f5f9;
  border-radius: 999px;
  height: 20px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.bar-fill.good { background: #22c55e; }
.bar-fill.neutral { background: #f59e0b; }
.bar-fill.bad { background: #ef4444; }
.bar-fill.rating { background: #0f766e; }

.bar-count {
  text-align: right;
  font-weight: 700;
  font-size: 0.875rem;
}

.analysis-summary {
  margin-top: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
}

.analysis-avg {
  font-size: 2rem;
  font-weight: 700;
  color: #0f766e;
  margin: 0 0 1rem;
}

.rating-dist {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>

