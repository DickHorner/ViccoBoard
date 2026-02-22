/**
 * Correction Table View Component
 * Shows all candidates and their scores in a matrix format
 * Supports sorting, filtering, and quick edits
 */

<template>
  <div class="correction-table-container">
    <div class="table-header">
      <div class="header-controls">
        <div class="filter-group">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search candidates..."
            class="search-input"
          />
          <select v-model="sortBy" class="sort-select">
            <option value="name">Sort by Name</option>
            <option value="total">Sort by Total Points</option>
            <option value="percentage">Sort by Percentage</option>
            <option value="grade">Sort by Grade</option>
            <option v-for="task in exam.structure.tasks" :key="`sort-task-${task.id}`" :value="`task:${task.id}`">
              Sort by Task: {{ task.title }}
            </option>
          </select>
        </div>
        <div class="view-toggle">
          <button
            :class="['view-btn', { active: viewMode === 'table' }]"
            @click="viewMode = 'table'"
          >
            📋 Table View
          </button>
          <button
            :class="['view-btn', { active: viewMode === 'compact' }]"
            @click="viewMode = 'compact'"
          >
            👤 Candidate View
          </button>
          <button
            :class="['view-btn', { active: viewMode === 'awk' }]"
            @click="viewMode = 'awk'"
          >
            ✏️ Task-by-Task (AWK)
          </button>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-if="viewMode === 'table'" class="table-view">
      <table class="correction-table">
        <thead>
          <tr>
            <th class="sticky-col">Candidate</th>
            <th v-for="task in exam.structure.tasks" :key="task.id" class="task-col">
              <span class="task-header">{{ task.title }}</span>
              <span class="task-max">({{ task.points }})</span>
            </th>
            <th class="sticky-col total-col">Total</th>
            <th class="sticky-col percent-col">%</th>
            <th class="sticky-col grade-col">Grade</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="candidate in filteredAndSortedCandidates" :key="candidate.id" class="candidate-row">
            <td class="sticky-col candidate-cell">
              <span class="candidate-name">{{ candidate.firstName }} {{ candidate.lastName }}</span>
              <span v-if="getCorrectionStatus(candidate.id)" class="status-badge">
                {{ getCorrectionStatus(candidate.id) }}
              </span>
            </td>
            <td
              v-for="task in exam.structure.tasks"
              :key="`${candidate.id}-${task.id}`"
              class="score-cell"
              @click="jumpToCandidate(candidate, task)"
            >
              <div class="score-display">
                <span class="score-value">{{ getTaskScore(candidate.id, task.id) }}</span>
                <span class="score-max">/{{ task.points }}</span>
              </div>
              <div v-if="hasComment(candidate.id, task.id)" class="comment-indicator">💬</div>
            </td>
            <td class="sticky-col total-col">
              <span class="total-points">{{ getTotalPoints(candidate.id) }}</span>
            </td>
            <td class="sticky-col percent-col">
              <span class="percentage">{{ getPercentage(candidate.id).toFixed(1) }}%</span>
            </td>
            <td class="sticky-col grade-col">
              <span :class="['grade-badge', `grade-${getGrade(candidate.id)}`]">
                {{ getGrade(candidate.id) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Statistics Footer -->
    <div v-if="viewMode === 'table'" class="statistics">
      <div class="stat-item">
        <span class="stat-label">Average Score:</span>
        <span class="stat-value">{{ averageScore.toFixed(1) }}/{{ exam.gradingKey.totalPoints }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Completed:</span>
        <span class="stat-value">{{ completedCount }}/{{ totalCandidates }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Average Grade:</span>
        <span class="stat-value">{{ averageGrade }}</span>
      </div>
    </div>

    <!-- Task-by-Task (AWK) View -->
    <div v-if="viewMode === 'awk'" class="awk-view">
      <div class="awk-header">
        <h3>Correct Task by Task (AWK)</h3>
        <select v-model="currentTaskId" class="task-selector">
          <option value="">-- Select a task --</option>
          <option v-for="task in exam.structure.tasks" :key="task.id" :value="task.id">
            {{ task.title }} ({{ task.points }} points)
          </option>
        </select>
      </div>

      <div v-if="currentTaskId" class="awk-list">
        <div
          v-for="candidate in filteredAndSortedCandidates"
          :key="candidate.id"
          :class="['awk-item', { completed: isTaskCompleted(candidate.id, currentTaskId) }]"
          @click="jumpToTaskForCandidate(candidate, currentTaskId)"
        >
          <div class="awk-candidate">
            <span class="candidate-name">{{ candidate.firstName }} {{ candidate.lastName }}</span>
          </div>
          <div class="awk-score">
            <span class="score-value">{{ getTaskScore(candidate.id, currentTaskId) }}</span>
            <span class="score-max">/{{ getTaskMaxPoints(currentTaskId) }}</span>
          </div>
          <div class="awk-actions">
            <button class="edit-btn" @click.stop="jumpToTaskForCandidate(candidate, currentTaskId)">
              ✏️ Edit
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Comments Management Modal -->
    <div v-if="showCommentsModal" class="modal-overlay" @click.self="showCommentsModal = false">
      <div class="modal-content">
        <h3>Manage Comments for {{ selectedCandidate?.firstName }} {{ selectedCandidate?.lastName }}<span v-if="commentTaskId"> — {{ exam.structure.tasks.find(t => t.id === commentTaskId)?.title }}</span></h3>
        <div class="comments-editor">
          <div class="comment-item">
            <label>
              <input v-model="editingComment.text" type="text" class="comment-text-input" placeholder="Enter comment..." />
            </label>
            <div class="comment-options">
              <label class="checkbox-label">
                <input v-model="editingComment.printable" type="checkbox" />
                Printable
              </label>
              <label class="checkbox-label">
                <input v-model="editingComment.availableAfterReturn" type="checkbox" />
                Available after return
              </label>
            </div>
          </div>
        </div>
        <!-- Copy to other candidates -->
        <div v-if="candidates.length > 1" class="copy-section">
          <p class="copy-label">Copy this comment to:</p>
          <div class="copy-candidates">
            <label
              v-for="c in candidates.filter(c => c.id !== selectedCandidate?.id)"
              :key="c.id"
              class="checkbox-label"
            >
              <input
                type="checkbox"
                :value="c.id"
                v-model="copyTargetIds"
              />
              {{ c.firstName }} {{ c.lastName }}
            </label>
          </div>
        </div>
        <div class="modal-buttons">
          <button @click="saveComment" class="btn-primary">Save</button>
          <button @click="showCommentsModal = false" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Exams } from '@viccoboard/core';

interface Props {
  exam: Exams.Exam;
  candidates: Exams.Candidate[];
  corrections: Map<string, Exams.CorrectionEntry>;
  onJumpToCandidate?: (candidate: Exams.Candidate, task?: Exams.TaskNode) => void;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'save-comment', payload: { candidateId: string; comment: Omit<Exams.CorrectionComment, 'id' | 'timestamp'> }): void;
  (e: 'copy-comments', payload: { sourceCandidateId: string; targetCandidateIds: string[]; comment: Omit<Exams.CorrectionComment, 'id' | 'timestamp'> }): void;
}>();

// View state
const viewMode = ref<'table' | 'compact' | 'awk'>('table');
const searchQuery = ref('');
const sortBy = ref<'name' | 'total' | 'percentage' | 'grade' | `task:${string}`>('name');
const currentTaskId = ref('');
const showCommentsModal = ref(false);
const selectedCandidate = ref<Exams.Candidate | null>(null);
const commentTaskId = ref<string | undefined>(undefined);
const editingComment = ref({ text: '', printable: true, availableAfterReturn: true });
const copyTargetIds = ref<string[]>([]);

// Computed properties
const filteredAndSortedCandidates = computed(() => {
  let filtered = props.candidates.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.value.toLowerCase())
  );

  return filtered.sort((a, b) => {
    if (sortBy.value.startsWith('task:')) {
      const taskId = sortBy.value.slice(5);
      return getTaskScore(b.id, taskId) - getTaskScore(a.id, taskId);
    }
    switch (sortBy.value) {
      case 'name':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'total':
        return getTotalPoints(b.id) - getTotalPoints(a.id);
      case 'percentage':
        return getPercentage(b.id) - getPercentage(a.id);
      case 'grade':
        return getGrade(a.id).localeCompare(getGrade(b.id));
      default:
        return 0;
    }
  });
});

const totalCandidates = computed(() => props.candidates.length);
const completedCount = computed(() =>
  Array.from(props.corrections.values()).filter(c => c.status === 'completed').length
);

const averageScore = computed(() => {
  const scores = props.candidates.map(c => getTotalPoints(c.id));
  return scores.reduce((sum, s) => sum + s, 0) / props.candidates.length;
});

const averageGrade = computed(() => {
  const grades = props.candidates.map(c => {
    const gradeStr = getGrade(c.id);
    return parseInt(gradeStr) || 0;
  });
  const avg = grades.reduce((sum, g) => sum + g, 0) / props.candidates.length;
  return isNaN(avg) ? 'N/A' : avg.toFixed(1);
});

// Helper methods
const getTaskScore = (candidateId: string, taskId: string): number => {
  const correction = props.corrections.get(candidateId);
  const taskScore = correction?.taskScores.find(ts => ts.taskId === taskId);
  return taskScore?.points || 0;
};

const getTaskMaxPoints = (taskId: string): number => {
  const task = props.exam.structure.tasks.find(t => t.id === taskId);
  return task?.points || 0;
};

const getTotalPoints = (candidateId: string): number => {
  const correction = props.corrections.get(candidateId);
  return correction?.totalPoints || 0;
};

const getPercentage = (candidateId: string): number => {
  const total = getTotalPoints(candidateId);
  if (props.exam.gradingKey.totalPoints === 0) return 0;
  return (total / props.exam.gradingKey.totalPoints) * 100;
};

const getGrade = (candidateId: string): string => {
  const correction = props.corrections.get(candidateId);
  return correction?.totalGrade?.toString() || 'N/A';
};

const getCorrectionStatus = (candidateId: string): string | null => {
  const correction = props.corrections.get(candidateId);
  return correction ? correction.status : null;
};

const hasComment = (candidateId: string, taskId: string): boolean => {
  const correction = props.corrections.get(candidateId);
  const hasTaskScoreComment = !!correction?.taskScores.find(ts => ts.taskId === taskId)?.comment;
  const hasEntryComment = correction?.comments.some(c => c.taskId === taskId) ?? false;
  return hasTaskScoreComment || hasEntryComment;
};

const isTaskCompleted = (candidateId: string, taskId: string): boolean => {
  const score = getTaskScore(candidateId, taskId);
  return score > 0;
};

const jumpToCandidate = (candidate: Exams.Candidate, task: Exams.TaskNode) => {
  if (props.onJumpToCandidate) {
    props.onJumpToCandidate(candidate, task);
  }
};

const jumpToTaskForCandidate = (candidate: Exams.Candidate, taskId: string) => {
  const task = props.exam.structure.tasks.find(t => t.id === taskId);
  if (task && props.onJumpToCandidate) {
    props.onJumpToCandidate(candidate, task);
  }
};

const openCommentsModal = (candidate: Exams.Candidate, taskId?: string) => {
  selectedCandidate.value = candidate;
  commentTaskId.value = taskId;
  const correction = props.corrections.get(candidate.id);
  const existingComment = taskId
    ? correction?.comments.find(c => c.taskId === taskId && c.level === 'task')
    : correction?.comments.find(c => c.level === 'exam');
  editingComment.value = {
    text: existingComment?.text || '',
    printable: existingComment?.printable ?? true,
    availableAfterReturn: existingComment?.availableAfterReturn ?? true
  };
  copyTargetIds.value = [];
  showCommentsModal.value = true;
};

// Expose for parent component usage
defineExpose({
  openCommentsModal
});

const saveComment = () => {
  const trimmedText = editingComment.value.text.trim();

  if (selectedCandidate.value && trimmedText) {
    const commentPayload: Omit<Exams.CorrectionComment, 'id' | 'timestamp'> = {
      taskId: commentTaskId.value,
      level: (commentTaskId.value ? 'task' : 'exam') as Exams.CorrectionComment['level'],
      text: trimmedText,
      printable: editingComment.value.printable,
      availableAfterReturn: editingComment.value.availableAfterReturn
    };

    emit('save-comment', {
      candidateId: selectedCandidate.value.id,
      comment: commentPayload
    });

    if (copyTargetIds.value.length > 0) {
      emit('copy-comments', {
        sourceCandidateId: selectedCandidate.value.id,
        targetCandidateIds: copyTargetIds.value,
        comment: commentPayload
      });
    }
  }
  showCommentsModal.value = false;
};
</script>

<style scoped>
.correction-table-container {
  width: 100%;
  overflow-x: auto;
}

.table-header {
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.header-controls {
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 1rem;
  flex: 1;
  min-width: 300px;
}

.search-input,
.sort-select {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.view-btn {
  padding: 0.75rem 1.25rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.view-btn:hover {
  background: #f0f0f0;
}

.view-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.table-view {
  overflow-x: auto;
  padding: 1rem;
}

.correction-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 0.9rem;
}

.correction-table thead {
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.correction-table th {
  padding: 1rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  border-right: 1px solid #dee2e6;
}

.correction-table th.sticky-col {
  position: sticky;
  left: 0;
  z-index: 10;
  background: #f8f9fa;
}

.task-header {
  display: block;
  font-weight: 600;
}

.task-max {
  display: block;
  font-size: 0.8rem;
  font-weight: 400;
  color: #666;
}

.correction-table td {
  padding: 0.75rem;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  text-align: center;
}

.correction-table td.sticky-col {
  position: sticky;
  left: 0;
  background: white;
  z-index: 5;
}

.candidate-cell {
  text-align: left;
  min-width: 150px;
}

.candidate-name {
  display: block;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  margin-top: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 3px;
  font-size: 0.75rem;
}

.score-display {
  text-align: center;
}

.score-value {
  font-weight: 600;
  color: #333;
}

.score-max {
  color: #999;
  font-size: 0.85rem;
  margin-left: 0.25rem;
}

.comment-indicator {
  font-size: 1rem;
  margin-top: 0.25rem;
}

.score-cell:hover {
  background: #f0f7ff;
  cursor: pointer;
}

.total-points,
.percentage,
.grade-badge {
  display: block;
  font-weight: 600;
}

.percentage {
  color: #1976d2;
}

.grade-badge {
  padding: 0.5rem 0.75rem;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 0.95rem;
}

.grade-badge.grade-1 {
  background: #d4edda;
  color: #155724;
}

.grade-badge.grade-2 {
  background: #d1ecf1;
  color: #0c5460;
}

.grade-badge.grade-6 {
  background: #f8d7da;
  color: #721c24;
}

.statistics {
  display: flex;
  gap: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  font-size: 0.95rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-weight: 600;
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.awk-view {
  padding: 1.5rem;
}

.awk-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.awk-header h3 {
  margin: 0;
}

.task-selector {
  flex: 1;
  max-width: 300px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.awk-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.awk-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.awk-item:hover {
  border-color: #007bff;
  background: #f0f7ff;
}

.awk-item.completed {
  border-color: #28a745;
  background: #f1f9f1;
}

.awk-candidate {
  flex: 1;
}

.awk-score {
  text-align: center;
  min-width: 80px;
}

.awk-score .score-value {
  font-weight: 600;
}

.awk-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.edit-btn:hover {
  background: #0056b3;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.comments-editor {
  margin: 1.5rem 0;
}

.comment-item {
  margin-bottom: 1rem;
}

.comment-text-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
}

.comment-options {
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.modal-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.copy-section {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.copy-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #444;
  margin: 0 0 0.5rem;
}

.copy-candidates {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 150px;
  overflow-y: auto;
  padding: 0.25rem 0;
}
</style>
