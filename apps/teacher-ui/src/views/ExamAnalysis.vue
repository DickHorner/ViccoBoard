<template>
  <div class="exam-analysis">
    <div class="analysis-header">
      <h1>{{ exam.title }} - Analyse und Schwierigkeit</h1>
      <div class="header-controls">
        <button @click="refreshAnalysis" class="btn-refresh">🔄 Aktualisieren</button>
        <button @click="exportAnalysis" class="btn-export">⬇️ Exportieren</button>
      </div>
    </div>

    <div class="analysis-tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="['tab-btn', { active: selectedTab === tab }]"
        @click="selectedTab = tab"
      >
        {{ getTabLabel(tab) }}
      </button>
    </div>

    <div v-if="selectedTab === 'statistics'" class="analysis-section">
      <h2>Gesamtstatistik</h2>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">Schüler gesamt</div><div class="stat-value">{{ analysis?.totalCandidates }}</div></div>
        <div class="stat-card"><div class="stat-label">Abgeschlossen</div><div class="stat-value">{{ analysis?.completedCount }}</div></div>
        <div class="stat-card"><div class="stat-label">Durchschnittspunktzahl</div><div class="stat-value">{{ formatScore(analysis?.averageScore) }}</div></div>
        <div class="stat-card"><div class="stat-label">Medianpunktzahl</div><div class="stat-value">{{ formatScore(analysis?.medianScore) }}</div></div>
        <div class="stat-card"><div class="stat-label">Minimum</div><div class="stat-value">{{ formatScore(analysis?.minScore) }}</div></div>
        <div class="stat-card"><div class="stat-label">Maximum</div><div class="stat-value">{{ formatScore(analysis?.maxScore) }}</div></div>
        <div class="stat-card"><div class="stat-label">Standardabweichung</div><div class="stat-value">{{ formatScore(analysis?.standardDeviation) }}</div></div>
      </div>

      <div v-if="analysis" class="grade-distribution">
        <h3>Notenverteilung</h3>
        <div class="grade-bars">
          <div v-for="[grade, count] of analysis.gradeDistribution" :key="grade" class="grade-bar-container">
            <span class="grade-label">{{ grade }}</span>
            <div class="grade-bar">
              <div class="grade-bar-fill" :style="{ width: getPercentage(count, analysis.totalCandidates) + '%' }"></div>
            </div>
            <span class="grade-count">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedTab === 'difficulty'" class="analysis-section">
      <h2>Aufgabenschwierigkeit</h2>
      <div class="difficulty-table">
        <table>
          <thead>
            <tr>
              <th @click="sortBy('title')" class="sortable">Aufgabe {{ getSortIcon('title') }}</th>
              <th @click="sortBy('difficultyIndex')" class="sortable">Schwierigkeit {{ getSortIcon('difficultyIndex') }}</th>
              <th @click="sortBy('averageScore')" class="sortable">Ø Punkte {{ getSortIcon('averageScore') }}</th>
              <th @click="sortBy('standardDeviation')" class="sortable">Std.-Abw. {{ getSortIcon('standardDeviation') }}</th>
              <th>Critical</th>
              <th>Excellent</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in sortedDifficulties" :key="task.taskId" :class="['difficulty-row', getDifficultyClass(task.difficultyIndex)]">
              <td class="task-title">{{ task.taskTitle }}</td>
              <td class="difficulty-cell"><span :style="{ color: getDifficultyColor(task.difficultyIndex) }">{{ getDifficultyText(task.difficultyIndex) }}</span></td>
              <td>{{ formatScore(task.averageScore) }} / {{ task.maxPoints }}</td>
              <td>{{ formatScore(task.standardDeviation) }}</td>
              <td class="critical">{{ task.criticalCount }}</td>
              <td class="excellent">{{ task.excellentCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="outliers" class="outliers-section">
        <div v-if="outliers.veryDifficult.length > 0" class="outlier-group">
          <h3>🚨 Sehr schwierige Aufgaben</h3>
          <ul><li v-for="task in outliers.veryDifficult" :key="task.taskId">{{ task.taskTitle }} ({{ formatPercentage(task.difficultyIndex) }} % im Mittel)</li></ul>
        </div>
        <div v-if="outliers.veryEasy.length > 0" class="outlier-group">
          <h3>✅ Sehr leichte Aufgaben</h3>
          <ul><li v-for="task in outliers.veryEasy" :key="task.taskId">{{ task.taskTitle }} ({{ formatPercentage(task.difficultyIndex) }} % im Mittel)</li></ul>
        </div>
      </div>
    </div>

    <div v-if="selectedTab === 'adjustment'" class="analysis-section">
      <h2>Anpassung der Punkteverteilung</h2>
      <div class="adjustment-controls">
        <label>Ziel-Schwierigkeitsindex</label>
        <input v-model.number="targetDifficulty" type="range" min="0.3" max="0.8" step="0.05" />
        <span>{{ formatPercentage(targetDifficulty * 100) }}%</span>
        <button @click="calculateAdjustments" class="btn-calculate">Vorschläge berechnen</button>
      </div>

      <div v-if="adjustmentSuggestion" class="adjustment-results">
        <h3>Vorgeschlagene Anpassungen</h3>
        <table class="adjustment-table">
          <thead>
            <tr><th>Aufgabe</th><th>Aktuelle Punkte</th><th>Vorgeschlagene Punkte</th><th>Änderung</th><th>Begründung</th></tr>
          </thead>
          <tbody>
            <tr v-for="adj in adjustmentSuggestion.adjustments" :key="adj.taskId" :class="{ 'has-change': adj.currentPoints !== adj.suggestedPoints }">
              <td class="task-title">{{ adj.taskTitle }}</td>
              <td>{{ adj.currentPoints }}</td>
              <td>{{ adj.suggestedPoints }}</td>
              <td :class="getChangeClass(adj.currentPoints, adj.suggestedPoints)">{{ getChangeIndicator(adj.currentPoints, adj.suggestedPoints) }}</td>
              <td class="reason">{{ adj.reason }}</td>
            </tr>
          </tbody>
        </table>

        <div class="impact-analysis">
          <h4>Erwartete Auswirkung</h4>
          <p>Durchschnittliche Notenverschiebung: {{ formatScore(adjustmentSuggestion.impactAnalysis.gradeShift) }}</p>
          <p v-if="adjustmentSuggestion.adjustments.length === 0" class="no-changes">✅ Die aktuelle Verteilung ist optimal</p>
        </div>

        <div class="action-buttons">
          <button @click="applyAdjustments" class="btn-apply">✅ Anpassungen übernehmen</button>
          <button @click="resetAdjustments" class="btn-reset">↺ Zurücksetzen</button>
        </div>
      </div>
    </div>

    <div v-if="selectedTab === 'risk'" class="analysis-section">
      <h2>Gefährdete Schüler</h2>
      <div class="risk-controls">
        <label>Risikogrenze (%)</label>
        <input v-model.number="riskThreshold" type="range" min="30" max="80" step="5" />
        <span>{{ riskThreshold }}%</span>
      </div>

      <div v-if="studentsAtRisk.length > 0" class="risk-table">
        <table>
          <thead>
            <tr>
              <th @click="sortRiskBy('name')" class="sortable">Schüler {{ getSortIcon('name') }}</th>
              <th @click="sortRiskBy('percentage')" class="sortable">Punktzahl % {{ getSortIcon('percentage') }}</th>
              <th @click="sortRiskBy('riskLevel')" class="sortable">Risikostufe {{ getSortIcon('riskLevel') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in sortedAtRisk" :key="student.candidateId" :class="['risk-row', student.riskLevel]">
              <td><router-link :to="`/exams/${props.exam.id}/correct`" class="student-link">{{ getCandidateName(student.candidateId) }}</router-link></td>
              <td>{{ formatPercentage(student.percentage) }}%</td>
              <td><span :class="['risk-badge', student.riskLevel]">{{ formatRiskLevel(student.riskLevel) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="no-risk"><p>✅ Alle Schüler liegen über dem Grenzwert</p></div>
    </div>

    <div v-if="selectedTab === 'variance'" class="analysis-section">
      <h2>Leistungsstreuung je Aufgabe</h2>
      <div class="variance-table">
        <table>
          <thead><tr><th>Aufgabe</th><th>Varianz</th><th>Konsistenz</th></tr></thead>
          <tbody>
            <tr v-for="[taskId, variance] of taskVariance" :key="taskId" :class="getVarianceClass(variance)">
              <td>{{ getTaskTitle(taskId) }}</td>
              <td>{{ formatScore(variance) }}</td>
              <td><div class="consistency-bar"><div class="consistency-fill" :style="{ width: getVariancePercentage(variance) + '%' }"></div></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="variance-note">Höhere Varianz bedeutet weniger konsistente Leistungen, also deutlich größere Unterschiede zwischen den Schülern.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Exams } from '@viccoboard/core'

import { useExamAnalysisView } from '../composables/useExamAnalysisView'

interface Props {
  exam: Exams.Exam
  corrections: Exams.CorrectionEntry[]
  candidates: Exams.Candidate[]
}

const props = defineProps<Props>()

const {
  adjustmentSuggestion,
  analysis,
  applyAdjustments,
  calculateAdjustments,
  exportAnalysis,
  formatPercentage,
  formatRiskLevel,
  formatScore,
  getCandidateName,
  getChangeClass,
  getChangeIndicator,
  getDifficultyClass,
  getDifficultyColor,
  getDifficultyText,
  getPercentage,
  getSortIcon,
  getTabLabel,
  getTaskTitle,
  getVarianceClass,
  getVariancePercentage,
  outliers,
  refreshAnalysis,
  resetAdjustments,
  riskThreshold,
  selectedTab,
  sortBy,
  sortRiskBy,
  sortedAtRisk,
  sortedDifficulties,
  studentsAtRisk,
  tabs,
  targetDifficulty,
  taskVariance
} = useExamAnalysisView(props)
</script>

<style scoped src="./ExamAnalysis.css"></style>
