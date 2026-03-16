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
            placeholder="Schüler suchen..."
            class="search-input"
          />
          <select v-model="sortBy" class="sort-select">
            <option value="name">Nach Name sortieren</option>
            <option value="total">Nach Gesamtpunkten sortieren</option>
            <option value="percentage">Nach Prozent sortieren</option>
            <option value="grade">Nach Note sortieren</option>
            <option v-for="task in exam.structure.tasks" :key="`sort-task-${task.id}`" :value="`task:${task.id}`">
              Nach Aufgabe sortieren: {{ task.title }}
            </option>
          </select>
        </div>
        <div class="view-toggle">
          <button
            :class="['view-btn', { active: viewMode === 'table' }]"
            @click="viewMode = 'table'"
          >
            📋 Tabellenansicht
          </button>
          <button
            :class="['view-btn', { active: viewMode === 'compact' }]"
            @click="viewMode = 'compact'"
          >
            👤 Schüleransicht
          </button>
          <button
            :class="['view-btn', { active: viewMode === 'awk' }]"
            @click="viewMode = 'awk'"
          >
            ✏️ Aufgabe für Aufgabe (AWK)
          </button>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-if="viewMode === 'table'" class="table-view">
      <table class="correction-table">
        <thead>
          <tr>
            <th class="sticky-col">Schüler</th>
            <th v-for="task in exam.structure.tasks" :key="task.id" class="task-col">
              <span class="task-header">{{ task.title }}</span>
              <span class="task-max">({{ task.points }})</span>
            </th>
            <th class="sticky-col total-col">Gesamt</th>
            <th class="sticky-col percent-col">%</th>
            <th class="sticky-col grade-col">Note</th>
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
        <span class="stat-label">Durchschnittspunktzahl:</span>
        <span class="stat-value">{{ averageScore.toFixed(1) }}/{{ exam.gradingKey.totalPoints }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Abgeschlossen:</span>
        <span class="stat-value">{{ completedCount }}/{{ totalCandidates }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Durchschnittsnote:</span>
        <span class="stat-value">{{ averageGrade }}</span>
      </div>
    </div>

    <!-- Task-by-Task (AWK) View -->
    <div v-if="viewMode === 'awk'" class="awk-view">
      <div class="awk-header">
        <h3>Aufgabe für Aufgabe korrigieren (AWK)</h3>
        <select v-model="currentTaskId" class="task-selector">
          <option value="">-- Aufgabe wählen --</option>
          <option v-for="task in exam.structure.tasks" :key="task.id" :value="task.id">
            {{ task.title }} ({{ task.points }} Punkte)
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
              ✏️ Bearbeiten
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Comments Management Modal -->
    <div v-if="showCommentsModal" class="modal-overlay" @click.self="showCommentsModal = false">
      <div class="modal-content">
        <h3>Kommentare verwalten für {{ selectedCandidate?.firstName }} {{ selectedCandidate?.lastName }}<span v-if="commentTaskId"> — {{ exam.structure.tasks.find(t => t.id === commentTaskId)?.title }}</span></h3>
        <div class="comments-editor">
          <div class="comment-item">
            <label>
              <input v-model="editingComment.text" type="text" class="comment-text-input" placeholder="Kommentar eingeben..." />
            </label>
            <div class="comment-options">
              <label class="checkbox-label">
                <input v-model="editingComment.printable" type="checkbox" />
                Druckbar
              </label>
              <label class="checkbox-label">
                <input v-model="editingComment.availableAfterReturn" type="checkbox" />
                Nach Rückgabe verfügbar
              </label>
            </div>
          </div>
        </div>
        <!-- Copy to other candidates -->
        <div v-if="candidates.length > 1" class="copy-section">
          <p class="copy-label">Diesen Kommentar kopieren zu:</p>
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
          <button @click="saveComment" class="btn-primary">Speichern</button>
          <button @click="showCommentsModal = false" class="btn-secondary">Abbrechen</button>
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
  return isNaN(avg) ? 'k. A.' : avg.toFixed(1);
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
  return correction?.totalGrade?.toString() || 'k. A.';
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

<style scoped src="./CorrectionTableView.css"></style>
