<template>
  <div class="exam-analysis">
    <div class="analysis-header">
      <h1>{{ exam.title }} - Analysis & Difficulty</h1>
      <div class="header-controls">
        <button @click="refreshAnalysis" class="btn-refresh">
          🔄 Refresh
        </button>
        <button @click="exportAnalysis" class="btn-export">
          ⬇️ Export
        </button>
      </div>
    </div>

    <div class="analysis-tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="selectedTab = tab"
        :class="['tab-btn', { active: selectedTab === tab }]"
      >
        {{ getTabLabel(tab) }}
      </button>
    </div>

    <!-- Overall Statistics Tab -->
    <div v-if="selectedTab === 'statistics'" class="analysis-section">
      <h2>Overall Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Candidates</div>
          <div class="stat-value">{{ analysis?.totalCandidates }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Completed</div>
          <div class="stat-value">{{ analysis?.completedCount }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Average Score</div>
          <div class="stat-value">{{ formatScore(analysis?.averageScore) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Median Score</div>
          <div class="stat-value">{{ formatScore(analysis?.medianScore) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Min Score</div>
          <div class="stat-value">{{ formatScore(analysis?.minScore) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Max Score</div>
          <div class="stat-value">{{ formatScore(analysis?.maxScore) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Std Deviation</div>
          <div class="stat-value">{{ formatScore(analysis?.standardDeviation) }}</div>
        </div>
      </div>

      <!-- Grade Distribution -->
      <div v-if="analysis" class="grade-distribution">
        <h3>Grade Distribution</h3>
        <div class="grade-bars">
          <div
            v-for="[grade, count] of analysis.gradeDistribution"
            :key="grade"
            class="grade-bar-container"
          >
            <span class="grade-label">{{ grade }}</span>
            <div class="grade-bar">
              <div
                class="grade-bar-fill"
                :style="{ width: getPercentage(count, analysis.totalCandidates) + '%' }"
              ></div>
            </div>
            <span class="grade-count">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Difficulty Tab -->
    <div v-if="selectedTab === 'difficulty'" class="analysis-section">
      <h2>Task Difficulty Analysis</h2>
      <div class="difficulty-table">
        <table>
          <thead>
            <tr>
              <th @click="sortBy('title')" class="sortable">Task {{ getSortIcon('title') }}</th>
              <th @click="sortBy('difficultyIndex')" class="sortable">Difficulty {{ getSortIcon('difficultyIndex') }}</th>
              <th @click="sortBy('averageScore')" class="sortable">Avg Score {{ getSortIcon('averageScore') }}</th>
              <th @click="sortBy('standardDeviation')" class="sortable">Std Dev {{ getSortIcon('standardDeviation') }}</th>
              <th>Critical</th>
              <th>Excellent</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="task in sortedDifficulties"
              :key="task.taskId"
              :class="['difficulty-row', getDifficultyClass(task.difficultyIndex)]"
            >
              <td class="task-title">{{ task.taskTitle }}</td>
              <td class="difficulty-cell">
                <span :style="{ color: getDifficultyColor(task.difficultyIndex) }">
                  {{ getDifficultyText(task.difficultyIndex) }}
                </span>
              </td>
              <td>{{ formatScore(task.averageScore) }} / {{ task.maxPoints }}</td>
              <td>{{ formatScore(task.standardDeviation) }}</td>
              <td class="critical">{{ task.criticalCount }}</td>
              <td class="excellent">{{ task.excellentCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Outliers -->
      <div v-if="outliers" class="outliers-section">
        <div v-if="outliers.veryDifficult.length > 0" class="outlier-group">
          <h3>🚨 Very Difficult Tasks</h3>
          <ul>
            <li v-for="task in outliers.veryDifficult" :key="task.taskId">
              {{ task.taskTitle }} ({{ formatPercentage(task.difficultyIndex) }}% average)
            </li>
          </ul>
        </div>

        <div v-if="outliers.veryEasy.length > 0" class="outlier-group">
          <h3>✅ Very Easy Tasks</h3>
          <ul>
            <li v-for="task in outliers.veryEasy" :key="task.taskId">
              {{ task.taskTitle }} ({{ formatPercentage(task.difficultyIndex) }}% average)
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Point Adjustment Tab -->
    <div v-if="selectedTab === 'adjustment'" class="analysis-section">
      <h2>Point Distribution Adjustment</h2>

      <div class="adjustment-controls">
        <label>Target Difficulty Index</label>
        <input
          v-model.number="targetDifficulty"
          type="range"
          min="0.3"
          max="0.8"
          step="0.05"
        />
        <span>{{ formatPercentage(targetDifficulty * 100) }}%</span>
        <button @click="calculateAdjustments" class="btn-calculate">
          Calculate Suggestions
        </button>
      </div>

      <div v-if="adjustmentSuggestion" class="adjustment-results">
        <h3>Suggested Adjustments</h3>

        <table class="adjustment-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Current Points</th>
              <th>Suggested Points</th>
              <th>Change</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="adj in adjustmentSuggestion.adjustments"
              :key="adj.taskId"
              :class="{ 'has-change': adj.currentPoints !== adj.suggestedPoints }"
            >
              <td class="task-title">{{ adj.taskTitle }}</td>
              <td>{{ adj.currentPoints }}</td>
              <td>{{ adj.suggestedPoints }}</td>
              <td :class="getChangeClass(adj.currentPoints, adj.suggestedPoints)">
                {{ getChangeIndicator(adj.currentPoints, adj.suggestedPoints) }}
              </td>
              <td class="reason">{{ adj.reason }}</td>
            </tr>
          </tbody>
        </table>

        <div class="impact-analysis">
          <h4>Projected Impact</h4>
          <p>Average Grade Shift: {{ formatScore(adjustmentSuggestion.impactAnalysis.gradeShift) }}</p>
          <p v-if="adjustmentSuggestion.adjustments.length === 0" class="no-changes">
            ✅ Current distribution is optimal
          </p>
        </div>

        <div class="action-buttons">
          <button @click="applyAdjustments" class="btn-apply">
            ✅ Apply Adjustments
          </button>
          <button @click="resetAdjustments" class="btn-reset">
            ↺ Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Students at Risk Tab -->
    <div v-if="selectedTab === 'risk'" class="analysis-section">
      <h2>Students at Risk</h2>

      <div class="risk-controls">
        <label>Risk Threshold (%)</label>
        <input
          v-model.number="riskThreshold"
          type="range"
          min="30"
          max="80"
          step="5"
        />
        <span>{{ riskThreshold }}%</span>
      </div>

      <div v-if="studentsAtRisk.length > 0" class="risk-table">
        <table>
          <thead>
            <tr>
              <th @click="sortRiskBy('name')" class="sortable">Student {{ getSortIcon('name') }}</th>
              <th @click="sortRiskBy('percentage')" class="sortable">Score % {{ getSortIcon('percentage') }}</th>
              <th @click="sortRiskBy('riskLevel')" class="sortable">Risk Level {{ getSortIcon('riskLevel') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="student in sortedAtRisk"
              :key="student.candidateId"
              :class="['risk-row', student.riskLevel]"
            >
              <td>
                <router-link
                  :to="{ name: 'correction-compact', params: { candidateId: student.candidateId } }"
                  class="student-link"
                >
                  {{ getCandidateName(student.candidateId) }}
                </router-link>
              </td>
              <td>{{ formatPercentage(student.percentage) }}%</td>
              <td>
                <span :class="['risk-badge', student.riskLevel]">
                  {{ formatRiskLevel(student.riskLevel) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="no-risk">
        <p>✅ All students above threshold</p>
      </div>
    </div>

    <!-- Variance Analysis Tab -->
    <div v-if="selectedTab === 'variance'" class="analysis-section">
      <h2>Performance Variance by Task</h2>
      <div class="variance-table">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Variance</th>
              <th>Consistency</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="[taskId, variance] of taskVariance"
              :key="taskId"
              :class="getVarianceClass(variance)"
            >
              <td>{{ getTaskTitle(taskId) }}</td>
              <td>{{ formatScore(variance) }}</td>
              <td>
                <div class="consistency-bar">
                  <div
                    class="consistency-fill"
                    :style="{ width: getVariancePercentage(variance) + '%' }"
                  ></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="variance-note">
        Higher variance = less consistent performance (some students score much higher/lower than others)
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Exams } from '@viccoboard/core';
import { ExamAnalysisService, AnalysisUIHelper } from '@viccoboard/exams';

interface Props {
  exam: Exams.Exam;
  corrections: Exams.CorrectionEntry[];
  candidates: Exams.Candidate[];
}

const props = defineProps<Props>();
const route = useRoute();

const tabs = ['statistics', 'difficulty', 'adjustment', 'risk', 'variance'];
const selectedTab = ref<typeof tabs[number]>('statistics');

const analysis = ref<Exams.ExamStatistics | null>(null);
const outliers = ref<{ veryDifficult: Exams.DifficultyAnalysis[]; veryEasy: Exams.DifficultyAnalysis[] } | null>(null);
const adjustmentSuggestion = ref<Exams.PointAdjustmentSuggestion | null>(null);
const studentsAtRisk = ref<Array<{ candidateId: string; score: number; percentage: number; riskLevel: 'critical' | 'warning' | 'ok' }>>([]);
const taskVariance = ref<Map<string, number>>(new Map());

const targetDifficulty = ref(0.6);
const riskThreshold = ref(50);
const difficultySort = ref<'title' | 'difficultyIndex' | 'averageScore' | 'standardDeviation'>('title');
const riskSort = ref<'name' | 'percentage' | 'riskLevel'>('percentage');

const performAnalysis = () => {
  analysis.value = ExamAnalysisService.analyzeExamDifficulty(props.exam, props.corrections);
  outliers.value = ExamAnalysisService.identifyOutliers(analysis.value, 0.2);
  studentsAtRisk.value = ExamAnalysisService.identifyStudentsAtRisk(props.corrections, riskThreshold.value);
  taskVariance.value = ExamAnalysisService.calculateTaskVariance(props.corrections, props.exam);
};

const calculateAdjustments = () => {
  adjustmentSuggestion.value = ExamAnalysisService.suggestPointAdjustments(
    props.exam,
    props.corrections,
    targetDifficulty.value
  );
};

const refreshAnalysis = () => {
  performAnalysis();
};

const exportAnalysis = () => {
  const exportData = {
    exam: props.exam.title,
    timestamp: new Date().toISOString(),
    statistics: analysis.value,
    outliers: outliers.value,
    atRisk: studentsAtRisk.value
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analysis-${props.exam.id}-${Date.now()}.json`;
  a.click();
};

const applyAdjustments = () => {
  // This would emit an event or call a use case to actually apply the adjustments
  alert('Adjustment application would be implemented via use-case pattern');
};

const resetAdjustments = () => {
  adjustmentSuggestion.value = null;
};

const sortBy = (field: typeof difficultySort.value) => {
  if (difficultySort.value === field) {
    difficultySort.value = field; // Toggle would go here
  } else {
    difficultySort.value = field;
  }
};

const sortRiskBy = (field: typeof riskSort.value) => {
  if (riskSort.value === field) {
    riskSort.value = field; // Toggle would go here
  } else {
    riskSort.value = field;
  }
};

const sortedDifficulties = computed(() => {
  if (!analysis.value) return [];

  const sorted = [...analysis.value.taskDifficulties];
  sorted.sort((a, b) => {
    switch (difficultySort.value) {
      case 'title':
        return a.taskTitle.localeCompare(b.taskTitle);
      case 'difficultyIndex':
        return a.difficultyIndex - b.difficultyIndex;
      case 'averageScore':
        return a.averageScore - b.averageScore;
      case 'standardDeviation':
        return b.standardDeviation - a.standardDeviation;
      default:
        return 0;
    }
  });

  return sorted;
});

const sortedAtRisk = computed(() => {
  const sorted = [...studentsAtRisk.value];
  sorted.sort((a, b) => {
    switch (riskSort.value) {
      case 'name':
        return getCandidateName(a.candidateId).localeCompare(getCandidateName(b.candidateId));
      case 'percentage':
        return a.percentage - b.percentage;
      case 'riskLevel':
        return a.riskLevel.localeCompare(b.riskLevel);
      default:
        return 0;
    }
  });
  return sorted;
});

// Helper functions
const formatScore = (value?: number): string => {
  if (value === undefined) return '—';
  return value.toFixed(2);
};

const formatPercentage = (value?: number): string => {
  if (value === undefined) return '—';
  return (value * 100).toFixed(1);
};

const getDifficultyText = (index: number): string => {
  return AnalysisUIHelper.formatDifficultyText(index);
};

const getDifficultyColor = (index: number): string => {
  return AnalysisUIHelper.getDifficultyColor(index);
};

const getDifficultyClass = (index: number): string => {
  if (index < 0.3) return 'very-difficult';
  if (index < 0.5) return 'difficult';
  if (index < 0.7) return 'moderate';
  if (index < 0.85) return 'easy';
  return 'very-easy';
};

const getPercentage = (value: number, total: number): number => {
  return (value / total) * 100;
};

const getChangeIndicator = (current: number, suggested: number): string => {
  if (suggested > current) return `+${suggested - current} ↑`;
  if (suggested < current) return `${suggested - current} ↓`;
  return '— (no change)';
};

const getChangeClass = (current: number, suggested: number): string => {
  if (suggested > current) return 'increase';
  if (suggested < current) return 'decrease';
  return 'unchanged';
};

const formatRiskLevel = (level: string): string => {
  return AnalysisUIHelper.formatRiskLevel(level);
};

const getCandidateName = (candidateId: string): string => {
  return props.candidates?.find(c => c.id === candidateId)?.name || 'Unknown';
};

const getTaskTitle = (taskId: string): string => {
  const task = props.exam.structure.tasks.find(t => t.id === taskId);
  return task?.title || 'Unknown Task';
};

const getSortIcon = (field: string): string => {
  if (difficultySort.value === field || riskSort.value === field) {
    return '↓'; // Would be toggled for direction
  }
  return '';
};

const getVarianceClass = (variance: number): string => {
  if (variance < 2) return 'consistent';
  if (variance < 4) return 'moderate-variance';
  return 'high-variance';
};

const getVariancePercentage = (variance: number): number => {
  // Normalize to 0-100% based on reasonable variance range
  return Math.min((variance / 6) * 100, 100);
};

onMounted(() => {
  performAnalysis();
});
</script>

<style scoped>
.exam-analysis {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 1rem;
}

.header-controls {
  display: flex;
  gap: 1rem;
}

.btn-refresh,
.btn-export,
.btn-calculate,
.btn-apply,
.btn-reset {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-refresh:hover,
.btn-export:hover,
.btn-calculate:hover,
.btn-apply:hover {
  background-color: #0056b3;
}

.btn-reset {
  background-color: #6c757d;
}

.btn-reset:hover {
  background-color: #545b62;
}

.analysis-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.analysis-section {
  margin-bottom: 3rem;
}

.analysis-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
}

.grade-distribution {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.grade-distribution h3 {
  margin-bottom: 1rem;
}

.grade-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.grade-bar-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.grade-label {
  font-weight: bold;
  min-width: 30px;
}

.grade-bar {
  flex: 1;
  height: 25px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.grade-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #20c997);
  transition: width 0.3s ease;
}

.grade-count {
  min-width: 30px;
  text-align: right;
}

.difficulty-table {
  overflow-x: auto;
  margin-bottom: 2rem;
}

.difficulty-table table {
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.difficulty-table th,
.difficulty-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.difficulty-table th {
  background-color: #f5f5f5;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
}

.difficulty-table th.sortable:hover {
  background-color: #e0e0e0;
}

.difficulty-row {
  transition: background-color 0.2s ease;
}

.difficulty-row:hover {
  background-color: #f9f9f9;
}

.difficulty-row.very-difficult {
  border-left: 4px solid #dc3545;
}

.difficulty-row.difficult {
  border-left: 4px solid #ff9800;
}

.difficulty-row.moderate {
  border-left: 4px solid #ffc107;
}

.difficulty-row.easy {
  border-left: 4px solid #90ee90;
}

.difficulty-row.very-easy {
  border-left: 4px solid #28a745;
}

.task-title {
  font-weight: 500;
}

.difficulty-cell {
  font-weight: 500;
}

.critical {
  color: #dc3545;
  font-weight: bold;
}

.excellent {
  color: #28a745;
  font-weight: bold;
}

.outliers-section {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.outlier-group {
  margin-bottom: 1.5rem;
}

.outlier-group h3 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.outlier-group ul {
  list-style: none;
  padding: 0;
}

.outlier-group li {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: white;
  border-left: 3px solid #ff9800;
  padding-left: 1rem;
}

.adjustment-controls {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.adjustment-controls label {
  font-weight: 500;
}

.adjustment-controls input[type='range'] {
  flex: 1;
  min-width: 200px;
}

.adjustment-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.adjustment-table th,
.adjustment-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.adjustment-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.adjustment-table tr.has-change {
  background-color: #fffacd;
}

.change-class.increase {
  color: #28a745;
}

.change-class.decrease {
  color: #dc3545;
}

.change-class.unchanged {
  color: #999;
}

.reason {
  font-size: 0.9rem;
  color: #666;
}

.impact-analysis {
  background: #e7f3ff;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  border-left: 3px solid #007bff;
}

.impact-analysis h4 {
  margin-bottom: 0.5rem;
}

.no-changes {
  color: #28a745;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.risk-controls {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.risk-controls input[type='range'] {
  flex: 1;
  min-width: 200px;
}

.risk-table {
  overflow-x: auto;
  margin-bottom: 2rem;
}

.risk-table table {
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.risk-table th,
.risk-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.risk-table th {
  background-color: #f5f5f5;
  font-weight: bold;
  cursor: pointer;
}

.risk-row {
  transition: background-color 0.2s ease;
}

.risk-row:hover {
  background-color: #f9f9f9;
}

.risk-row.critical {
  border-left: 4px solid #dc3545;
}

.risk-row.warning {
  border-left: 4px solid #ffc107;
}

.risk-row.ok {
  border-left: 4px solid #28a745;
}

.student-link {
  color: #007bff;
  text-decoration: none;
}

.student-link:hover {
  text-decoration: underline;
}

.risk-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.risk-badge.critical {
  background-color: #f8d7da;
  color: #721c24;
}

.risk-badge.warning {
  background-color: #fff3cd;
  color: #856404;
}

.risk-badge.ok {
  background-color: #d4edda;
  color: #155724;
}

.no-risk {
  text-align: center;
  padding: 2rem;
  background: #d4edda;
  border-radius: 8px;
  color: #155724;
}

.variance-table {
  overflow-x: auto;
}

.variance-table table {
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.variance-table th,
.variance-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.variance-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.consistency-bar {
  width: 100%;
  height: 20px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.consistency-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
  transition: width 0.3s ease;
}

.variance-note {
  padding: 1rem;
  background: #f9f9f9;
  border-left: 3px solid #ff9800;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #666;
}
</style>
