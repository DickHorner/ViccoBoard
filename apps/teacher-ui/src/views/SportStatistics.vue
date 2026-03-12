<template>
  <section class="sport-statistics">
    <header class="page-header">
      <button class="back-button" @click="$router.back()">← Zurück</button>
      <div>
        <h1>Sport-Statistiken</h1>
        <p class="subtitle">Überblick über Anwesenheit, Leistungen und Tool-Nutzung.</p>
      </div>
    </header>

    <!-- Class selector -->
    <div class="class-selector">
      <label for="class-select">Klasse:</label>
      <select id="class-select" v-model="selectedClassId" @change="loadStats">
        <option value="">Alle Klassen</option>
        <option v-for="cls in classes" :key="cls.id" :value="cls.id">
          {{ cls.name }} ({{ cls.schoolYear }})
        </option>
      </select>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Statistiken werden geladen…</p>
    </div>

    <div v-else class="stats-content">
      <!-- Attendance overview -->
      <section class="stats-card">
        <h2>Anwesenheit</h2>
        <div class="metrics-row">
          <article class="metric">
            <strong>{{ attendanceStats.total }}</strong>
            <span>Einträge gesamt</span>
          </article>
          <article class="metric">
            <strong>{{ attendanceStats.present }}</strong>
            <span>Anwesend</span>
          </article>
          <article class="metric">
            <strong>{{ attendanceStats.absent }}</strong>
            <span>Fehlend</span>
          </article>
          <article class="metric">
            <strong>{{ attendanceStats.excused }}</strong>
            <span>Entschuldigt</span>
          </article>
          <article class="metric highlight">
            <strong>{{ attendanceRate }}%</strong>
            <span>Anwesenheitsquote</span>
          </article>
        </div>
      </section>

      <!-- Performance overview -->
      <section class="stats-card">
        <h2>Leistungsübersicht</h2>
        <div v-if="gradeCategoryStats.length === 0" class="empty-state">
          <p>Noch keine Bewertungsdaten vorhanden.</p>
        </div>
        <div v-else class="category-stats">
          <div
            v-for="cat in gradeCategoryStats"
            :key="cat.categoryId"
            class="cat-row"
          >
            <span class="cat-name">{{ cat.name }}</span>
            <span class="cat-type">{{ cat.type }}</span>
            <span class="cat-entries">{{ cat.entryCount }} Einträge</span>
            <span v-if="cat.avgGrade !== null" class="cat-avg">Ø {{ cat.avgGrade.toFixed(2) }}</span>
          </div>
        </div>
      </section>

      <!-- Tool usage overview -->
      <section class="stats-card">
        <h2>Tool-Nutzung</h2>
        <div v-if="toolUsageStats.length === 0" class="empty-state">
          <p>Noch keine Tool-Sessions aufgezeichnet.</p>
        </div>
        <div v-else class="tool-stats">
          <div v-for="tool in toolUsageStats" :key="tool.toolType" class="tool-row">
            <span class="tool-name">{{ toolLabel(tool.toolType) }}</span>
            <span class="tool-count">{{ tool.count }} Sessions</span>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getSportBridge } from '../composables/useSportBridge'
import type { ClassGroup } from '@viccoboard/core'

const bridge = getSportBridge()

const classes = ref<ClassGroup[]>([])
const selectedClassId = ref('')
const loading = ref(false)

interface AttendanceStats {
  total: number
  present: number
  absent: number
  excused: number
}

interface CategoryStat {
  categoryId: string
  name: string
  type: string
  entryCount: number
  avgGrade: number | null
}

interface ToolStat {
  toolType: string
  count: number
}

const attendanceStats = ref<AttendanceStats>({ total: 0, present: 0, absent: 0, excused: 0 })
const gradeCategoryStats = ref<CategoryStat[]>([])
const toolUsageStats = ref<ToolStat[]>([])

const attendanceRate = computed(() => {
  const { total, present } = attendanceStats.value
  if (total === 0) return 100
  return Math.round((present / total) * 100)
})

onMounted(async () => {
  classes.value = await bridge.classGroupRepository.findAll()
  await loadStats()
})

async function loadStats() {
  loading.value = true
  try {
    await Promise.all([loadAttendance(), loadPerformance(), loadToolUsage()])
  } finally {
    loading.value = false
  }
}

async function loadAttendance() {
  const allRecords = await bridge.attendanceRepository.findAll()
  // Attendance records link to lessons, not directly to class groups.
  // Filtering by class requires joining via lessons, which is deferred.
  // Show all records regardless of selectedClassId for now.
  const records = allRecords

  attendanceStats.value = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    excused: records.filter(r => r.status === 'excused').length
  }
}

async function loadPerformance() {
  const categories = selectedClassId.value
    ? await bridge.gradeCategoryRepository.findAll().then(cats =>
        cats.filter(c => c.classGroupId === selectedClassId.value)
      )
    : await bridge.gradeCategoryRepository.findAll()

  const allEntries = await bridge.performanceEntryRepository.findAll()

  gradeCategoryStats.value = categories.map(cat => {
    const entries = allEntries.filter(e => e.categoryId === cat.id)
    const grades = entries
      .map(e => e.calculatedGrade)
      .filter((g): g is number => typeof g === 'number')
    const avgGrade = grades.length > 0
      ? grades.reduce((a, b) => a + b, 0) / grades.length
      : null
    return {
      categoryId: cat.id,
      name: cat.name,
      type: cat.type,
      entryCount: entries.length,
      avgGrade
    }
  })
}

async function loadToolUsage() {
  const sessions = await bridge.toolSessionRepository.findAll()
  const filtered = selectedClassId.value
    ? sessions.filter(s => s.classGroupId === selectedClassId.value)
    : sessions

  const counts: Record<string, number> = {}
  for (const s of filtered) {
    counts[s.toolType] = (counts[s.toolType] ?? 0) + 1
  }
  toolUsageStats.value = Object.entries(counts)
    .map(([toolType, count]) => ({ toolType, count }))
    .sort((a, b) => b.count - a.count)
}

function toolLabel(type: string): string {
  const labels: Record<string, string> = {
    timer: 'Timer',
    scoreboard: 'Scoreboard',
    teams: 'Teams',
    tournament: 'Turnier',
    tactics: 'Taktikboard',
    feedback: 'Feedback'
  }
  return labels[type] ?? type
}
</script>

<style scoped>
.sport-statistics {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 900px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.page-header h1 {
  margin: 0;
}

.subtitle {
  color: #64748b;
  margin: 0.25rem 0 0;
}

.back-button {
  background: none;
  border: none;
  color: #0f766e;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  min-height: 44px;
  white-space: nowrap;
}

.class-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.class-selector label {
  font-weight: 600;
  font-size: 0.875rem;
}

.class-selector select {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.2);
  font-size: 1rem;
  min-height: 44px;
  background: white;
}

.loading-state {
  color: #64748b;
  padding: 2rem;
  text-align: center;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.stats-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 1.5rem;
}

.stats-card h2 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

.metric.highlight {
  background: rgba(14, 116, 144, 0.1);
}

.metric strong {
  font-size: 1.5rem;
}

.metric span {
  color: #64748b;
  font-size: 0.8rem;
}

.category-stats,
.tool-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cat-row,
.tool-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.625rem 1rem;
  background: #f8fafc;
  border-radius: 10px;
  flex-wrap: wrap;
}

.cat-name,
.tool-name {
  font-weight: 600;
  flex: 1;
  min-width: 140px;
}

.cat-type {
  font-size: 0.8rem;
  color: #64748b;
  background: rgba(15, 23, 42, 0.06);
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
}

.cat-entries,
.tool-count {
  font-size: 0.875rem;
  color: #64748b;
}

.cat-avg {
  font-weight: 700;
  color: #0f766e;
  font-size: 0.875rem;
}

.empty-state {
  color: #64748b;
  padding: 1rem 0;
}
</style>
