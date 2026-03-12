<template>
  <section class="statistics-view">
    <header class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <div>
        <h1>Statistiken</h1>
        <p class="subtitle">Überblick über Anwesenheit, Leistungen und Tool-Nutzung im Sportunterricht.</p>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Daten werden geladen…</p>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="error-state">
      <p>{{ loadError }}</p>
    </div>

    <template v-else>
      <!-- ─── Attendance ─────────────────────────────────────────────────── -->
      <section class="stats-section">
        <h2>Anwesenheit</h2>
        <div v-if="attendanceOverview.global.total === 0" class="empty-state">
          <p>Noch keine Anwesenheitsdaten vorhanden.</p>
        </div>
        <div v-else class="metrics-grid">
          <article class="metric-card">
            <strong>{{ attendanceOverview.global.total }}</strong>
            <span>Einträge gesamt</span>
          </article>
          <article class="metric-card accent-green">
            <strong>{{ attendanceOverview.global.present }}</strong>
            <span>Anwesend</span>
          </article>
          <article class="metric-card accent-red">
            <strong>{{ attendanceOverview.global.absent }}</strong>
            <span>Abwesend</span>
          </article>
          <article class="metric-card accent-yellow">
            <strong>{{ attendanceOverview.global.excused }}</strong>
            <span>Entschuldigt</span>
          </article>
          <article class="metric-card">
            <strong>{{ attendanceOverview.global.attendanceRate }}%</strong>
            <span>Anwesenheitsquote</span>
          </article>
        </div>
      </section>

      <!-- ─── Performance ───────────────────────────────────────────────── -->
      <section class="stats-section">
        <h2>Leistungsübersicht</h2>
        <div v-if="performanceOverview.totalEntries === 0" class="empty-state">
          <p>Noch keine Leistungsdaten vorhanden.</p>
        </div>
        <template v-else>
          <div class="metrics-grid">
            <article class="metric-card">
              <strong>{{ performanceOverview.totalEntries }}</strong>
              <span>Messungen gesamt</span>
            </article>
            <article class="metric-card accent-green">
              <strong>{{ performanceOverview.gradedEntries }}</strong>
              <span>Mit Note bewertet</span>
            </article>
          </div>

          <div v-if="performanceOverview.categories.length > 0" class="table-wrapper">
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Kategorie</th>
                  <th class="num-col">Bewertet</th>
                  <th class="num-col">Ø Note</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="cat in performanceOverview.categories"
                  :key="cat.categoryId"
                >
                  <td>{{ cat.categoryName }}</td>
                  <td class="num-col">{{ cat.gradedCount }}</td>
                  <td class="num-col">
                    <span v-if="cat.averageGrade !== null" class="grade-badge">
                      {{ cat.averageGrade }}
                    </span>
                    <span v-else class="no-data">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </section>

      <!-- ─── Tool Usage ────────────────────────────────────────────────── -->
      <section class="stats-section">
        <h2>Tool-Nutzung</h2>
        <div v-if="toolUsageOverview.totalSessions === 0" class="empty-state">
          <p>Noch keine Tool-Sessions vorhanden.</p>
        </div>
        <template v-else>
          <div class="metrics-grid">
            <article class="metric-card">
              <strong>{{ toolUsageOverview.totalSessions }}</strong>
              <span>Sessions gesamt</span>
            </article>
          </div>

          <div class="table-wrapper">
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th class="num-col">Sessions</th>
                  <th>Zuletzt genutzt</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="tool in toolUsageOverview.byToolType"
                  :key="tool.toolType"
                >
                  <td>{{ formatToolType(tool.toolType) }}</td>
                  <td class="num-col">{{ tool.sessionCount }}</td>
                  <td>
                    <span v-if="tool.lastUsedAt">{{ formatDate(tool.lastUsedAt) }}</span>
                    <span v-else class="no-data">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getSportBridge } from '../composables/useSportBridge'
import type { AttendanceOverview, PerformanceOverview, ToolUsageOverview } from '@viccoboard/sport'

const bridge = getSportBridge()

const loading = ref(true)
const loadError = ref<string | null>(null)

const attendanceOverview = ref<AttendanceOverview>({
  global: { total: 0, present: 0, absent: 0, excused: 0, passive: 0, attendanceRate: 100 },
  perLesson: {}
})

const performanceOverview = ref<PerformanceOverview>({
  totalEntries: 0,
  gradedEntries: 0,
  categories: []
})

const toolUsageOverview = ref<ToolUsageOverview>({
  totalSessions: 0,
  byToolType: []
})

onMounted(async () => {
  try {
    const [attendanceRecords, performanceEntries, categories, toolSessions] =
      await Promise.all([
        bridge.attendanceRepository.findAll(),
        bridge.performanceEntryRepository.findAll(),
        bridge.gradeCategoryRepository.findAll(),
        bridge.toolSessionRepository.findAll()
      ])

    attendanceOverview.value =
      bridge.sportStatisticsService.aggregateAttendanceOverview(attendanceRecords)

    performanceOverview.value =
      bridge.sportStatisticsService.aggregatePerformanceOverview(performanceEntries, categories)

    toolUsageOverview.value =
      bridge.sportStatisticsService.aggregateToolUsageOverview(toolSessions)
  } catch (err) {
    loadError.value =
      err instanceof Error ? err.message : 'Statistiken konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
})

const TOOL_LABELS: Record<string, string> = {
  timer: 'Timer',
  multistop: 'Multistop',
  scoreboard: 'Scoreboard',
  teams: 'Teams',
  tournaments: 'Turnier',
  tactics: 'Taktikboard',
  feedback: 'Feedback'
}

function formatToolType(toolType: string): string {
  return TOOL_LABELS[toolType] ?? toolType
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<style scoped>
.statistics-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 0.25rem 0;
}

.page-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
}

.back-button {
  background: none;
  border: none;
  color: #0f766e;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  touch-action: manipulation;
  min-height: 44px;
  white-space: nowrap;
}

.back-button:hover {
  text-decoration: underline;
}

.subtitle {
  color: #64748b;
  margin: 0.25rem 0 0;
}

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.spinner {
  border: 3px solid #e2e8f0;
  border-top: 3px solid #0f766e;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.stats-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stats-section h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #0f172a;
  border-bottom: 2px solid rgba(14, 116, 144, 0.15);
  padding-bottom: 0.5rem;
}

.metrics-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.metric-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.metric-card strong {
  font-size: 1.5rem;
  color: #0f172a;
}

.metric-card span {
  font-size: 0.85rem;
  color: #64748b;
}

.metric-card.accent-green strong { color: #15803d; }
.metric-card.accent-red strong   { color: #b91c1c; }
.metric-card.accent-yellow strong { color: #b45309; }

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #94a3b8;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
}

.error-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 18px;
}

.table-wrapper {
  overflow-x: auto;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.stats-table th,
.stats-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.stats-table th {
  font-weight: 600;
  color: #475569;
  background: rgba(15, 23, 42, 0.02);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stats-table tbody tr:last-child td {
  border-bottom: none;
}

.num-col {
  text-align: right;
}

.grade-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: rgba(14, 116, 144, 0.1);
  color: #155e75;
  border-radius: 999px;
  font-weight: 600;
}

.no-data {
  color: #94a3b8;
}
</style>
