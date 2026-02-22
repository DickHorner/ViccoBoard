<template>
  <div class="correction-container">
    <div class="correction-header">
      <div class="header-info">
        <h1>{{ exam?.title || 'Exam Correction' }}</h1>
        <p v-if="exam" class="exam-meta">
          {{ candidates.length }} candidates | Total: {{ exam.gradingKey.totalPoints }} points
        </p>
      </div>
      <div class="header-actions">
        <div class="view-mode-toggle">
          <button
            :class="['btn-toggle', { active: correctionViewMode === 'candidate' }]"
            @click="correctionViewMode = 'candidate'"
          >👤 Candidate</button>
          <button
            :class="['btn-toggle', { active: correctionViewMode === 'table' }]"
            @click="correctionViewMode = 'table'"
          >📋 Table</button>
        </div>
        <button @click="saveCorrectionBatch" class="btn-primary" :disabled="!hasChanges">
          {{ hasChanges ? 'Save All Changes' : 'All Saved' }}
        </button>
        <button @click="goBack" class="btn-secondary">Back to Exams</button>
      </div>
    </div>

    <!-- Table View -->
    <CorrectionTableView
      v-if="exam && correctionViewMode === 'table'"
      :exam="exam"
      :candidates="candidates"
      :corrections="corrections"
      :on-jump-to-candidate="jumpToCandidate"
      @save-comment="handleSaveComment"
      @copy-comments="handleCopyComments"
    />

    <div v-if="exam && correctionViewMode === 'candidate'" class="correction-layout">
      <!-- Candidates List (Sidebar) -->
      <div class="candidates-sidebar">
        <div class="sidebar-header">
          <h3>Candidates ({{ candidates.length }})</h3>
          <input
            v-model="candidateFilter"
            type="text"
            placeholder="Search..."
            class="filter-input"
          />
        </div>
        <div class="candidates-list">
          <button
            v-for="candidate in filteredCandidates"
            :key="candidate.id"
            :class="['candidate-btn', { active: currentCandidate?.id === candidate.id }]"
            @click="selectCandidate(candidate)"
          >
            <span class="candidate-name">{{ candidate.firstName }} {{ candidate.lastName }}</span>
            <span v-if="getCorrectionStatus(candidate.id)" class="status-badge">
              {{ correctionPercentage(candidate.id) }}%
            </span>
          </button>
        </div>
      </div>

      <!-- Correction Panel -->
      <div class="correction-panel">
        <div v-if="currentCandidate && currentCorrection && exam" class="correction-form">
          <div class="candidate-header">
            <h2>{{ currentCandidate.firstName }} {{ currentCandidate.lastName }}</h2>
            <span class="status" :class="`status-${currentCorrection.status}`">
              {{ currentCorrection.status }}
            </span>
          </div>

          <!-- Task Scoring -->
          <div class="scoring-section">
            <h3>Task Scores</h3>
            <div v-for="task in exam.structure.tasks" :key="task.id" class="task-scoring">
              <div class="task-title">
                <label>{{ task.title }}</label>
                <span class="max-points">(max {{ task.points }})</span>
              </div>

              <div class="score-input-group">
                <input
                  v-model.number="taskScores[task.id]"
                  type="number"
                  min="0"
                  :max="task.points"
                  step="0.5"
                  class="score-input"
                  @input="updateGrade"
                />
                <span class="points-to-next">
                  {{ pointsToNextGrade }} points to next grade
                </span>
              </div>

              <!-- Task Comment (optional) -->
              <div v-if="exam.structure.allowsComments" class="comment-box">
                <textarea
                  v-model="taskComments[task.id]"
                  :placeholder="`Comment for ${task.title}...`"
                  class="comment-input"
                  rows="2"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Total Score & Grade -->
          <div class="total-score-section">
            <div class="score-display">
              <div class="score-item">
                <label>Total Points</label>
                <span class="score-value">{{ totalPoints }}/{{ exam.gradingKey.totalPoints }}</span>
              </div>
              <div class="score-item">
                <label>Percentage</label>
                <span class="score-value">{{ percentageScore.toFixed(1) }}%</span>
              </div>
              <div class="score-item highlight">
                <label>Grade</label>
                <span class="grade-value">{{ currentGrade }}</span>
              </div>
            </div>
          </div>

          <!-- Support Tips -->
          <div v-if="exam.structure.allowsSupportTips" class="support-tips-section">
            <h3>Support Tips</h3>
            <div class="tips-input">
              <button @click="showTipsModal = true" class="btn-secondary-small">
                + Assign Support Tips
              </button>
            </div>
            <div v-if="currentCorrection.supportTips.length > 0" class="assigned-tips">
              <div
                v-for="tip in currentCorrection.supportTips"
                :key="tip.supportTipId"
                class="tip-badge"
              >
                {{ tip.supportTipId }}
                <button @click="removeSupportTip(tip.supportTipId)" class="btn-remove">×</button>
              </div>
            </div>
          </div>

          <!-- Special Work Highlighting -->
          <div class="highlight-section">
            <h3>Special Work</h3>
            <label class="checkbox-label">
              <input v-model="markAsSpecial" type="checkbox" />
              Mark this work as special/exceptional
            </label>
            <div v-if="markAsSpecial" class="special-input">
              <textarea
                v-model="specialNotes"
                placeholder="Notes about special aspects of this work..."
                class="comment-input"
                rows="3"
              ></textarea>
            </div>
          </div>

          <!-- Navigation -->
          <div class="nav-buttons">
            <button
              v-if="currentCandidateIndex > 0"
              @click="selectCandidate(candidates[currentCandidateIndex - 1])"
              class="btn-nav"
            >
              ← Previous
            </button>
            <button
              v-if="currentCandidateIndex < candidates.length - 1"
              @click="selectCandidate(candidates[currentCandidateIndex + 1])"
              class="btn-nav"
            >
              Next →
            </button>
          </div>

          <!-- Save Button -->
          <div class="action-buttons">
            <button @click="saveCorrectionForCandidate" class="btn-primary">
              Save & Next
            </button>
            <button @click="finalizeCorrectionForCandidate" class="btn-success">
              Mark Complete
            </button>
          </div>
        </div>

        <div v-else class="no-candidate">
          Select a candidate to start correcting.
        </div>
      </div>
    </div>

    <!-- Support Tips Modal -->
    <div v-if="showTipsModal" class="modal-overlay" @click.self="showTipsModal = false">
      <div class="modal-content">
        <h3>Assign Support Tips</h3>
        <input
          v-model="tipsSearchQuery"
          type="text"
          placeholder="Search support tips..."
          class="search-input"
        />
        <div class="tips-list">
          <div v-for="tip in allSupportTips" :key="tip.id" class="tip-item">
            <label class="checkbox-label">
              <input
                :checked="selectedTipsIds.includes(tip.id)"
                type="checkbox"
                @change="toggleTipSelection(tip.id)"
              />
              {{ tip.title }}
            </label>
            <p class="tip-description">{{ tip.shortDescription }}</p>
          </div>
        </div>
        <div class="modal-buttons">
          <button @click="applySelectedTips" class="btn-primary">Apply</button>
          <button @click="showTipsModal = false" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Exams } from '@viccoboard/core';
import { v4 as uuidv4 } from 'uuid';
import { GradingKeyService, CommentManagementService } from '@viccoboard/exams';
import CorrectionTableView from '../components/CorrectionTableView.vue';

const router = useRouter();

const exam = ref<Exams.Exam | null>(null);
const candidates = ref<Exams.Candidate[]>([]);
const corrections = ref<Map<string, Exams.CorrectionEntry>>(new Map());
const currentCandidate = ref<Exams.Candidate | null>(null);
const currentCorrection = ref<Exams.CorrectionEntry | null>(null);

const candidateFilter = ref('');
const taskScores = ref<Record<string, number>>({});
const taskComments = ref<Record<string, string>>({});
const markAsSpecial = ref(false);
const specialNotes = ref('');
const showTipsModal = ref(false);
const tipsSearchQuery = ref('');
const selectedTipsIds = ref<string[]>([]);
const allSupportTips = ref<Exams.SupportTip[]>([]);
const hasChanges = ref(false);
const correctionViewMode = ref<'candidate' | 'table'>('candidate');

const filteredCandidates = computed(() => {
  const filter = candidateFilter.value.toLowerCase();
  return candidates.value.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(filter)
  );
});

const currentCandidateIndex = computed(() =>
  candidates.value.findIndex(c => c.id === currentCandidate.value?.id)
);

const totalPoints = computed(() =>
  Object.values(taskScores.value).reduce((sum, pts) => sum + pts, 0)
);

const percentageScore = computed(() => {
  if (!exam.value || exam.value.gradingKey.totalPoints === 0) return 0;
  return (totalPoints.value / exam.value.gradingKey.totalPoints) * 100;
});

const currentGrade = computed(() => {
  if (!exam.value) return 'N/A';
  const result = GradingKeyService.calculateGrade(totalPoints.value, exam.value.gradingKey);
  return result.grade;
});

const pointsToNextGrade = computed(() => {
  if (!exam.value) return 0;
  return GradingKeyService.pointsToNextGrade(totalPoints.value, exam.value.gradingKey);
});

const selectCandidate = (candidate: Exams.Candidate) => {
  saveCorrectionForCandidate();
  currentCandidate.value = candidate;
  loadCorrectionForCandidate(candidate);
};

const loadCorrectionForCandidate = async (candidate: Exams.Candidate) => {
  let correction = corrections.value.get(candidate.id);
  if (!correction && exam.value) {
    correction = {
      id: uuidv4(),
      examId: exam.value.id,
      candidateId: candidate.id,
      taskScores: [],
      totalPoints: 0,
      totalGrade: 'N/A',
      percentageScore: 0,
      comments: [],
      supportTips: [],
      status: 'in-progress',
      lastModified: new Date()
    };
    corrections.value.set(candidate.id, correction);
  }
  currentCorrection.value = correction || null;

  taskScores.value = {};
  taskComments.value = {};
  if (exam.value) {
    exam.value.structure.tasks.forEach(task => {
      const score = correction?.taskScores.find(ts => ts.taskId === task.id);
      taskScores.value[task.id] = score?.points || 0;
      taskComments.value[task.id] = score?.comment || '';
    });
  }
};

const saveCorrectionForCandidate = async () => {
  if (!currentCandidate.value || !currentCorrection.value || !exam.value) return;

  const taskScoresArray: Exams.TaskScore[] = exam.value.structure.tasks.map(task => ({
    taskId: task.id,
    points: taskScores.value[task.id] || 0,
    maxPoints: task.points,
    comment: taskComments.value[task.id],
    timestamp: new Date()
  }));

  currentCorrection.value.taskScores = taskScoresArray;
  currentCorrection.value.totalPoints = totalPoints.value;
  currentCorrection.value.totalGrade = currentGrade.value;
  currentCorrection.value.percentageScore = percentageScore.value;
  currentCorrection.value.lastModified = new Date();

  corrections.value.set(currentCandidate.value.id, currentCorrection.value);
  hasChanges.value = true;
};

const finalizeCorrectionForCandidate = async () => {
  if (!currentCorrection.value) return;
  currentCorrection.value.status = 'completed';
  currentCorrection.value.correctedAt = new Date();
  await saveCorrectionForCandidate();
};

const updateGrade = () => {
  hasChanges.value = true;
};

const removeSupportTip = (tipId: string) => {
  if (!currentCorrection.value) return;
  currentCorrection.value.supportTips = currentCorrection.value.supportTips.filter(
    st => st.supportTipId !== tipId
  );
  hasChanges.value = true;
};

const toggleTipSelection = (tipId: string) => {
  const idx = selectedTipsIds.value.indexOf(tipId);
  if (idx >= 0) {
    selectedTipsIds.value.splice(idx, 1);
  } else {
    selectedTipsIds.value.push(tipId);
  }
};

const applySelectedTips = () => {
  if (!currentCorrection.value) return;
  const newTips = selectedTipsIds.value.map(id => ({
    supportTipId: id,
    assignedAt: new Date()
  }));
  currentCorrection.value.supportTips = newTips;
  showTipsModal.value = false;
  hasChanges.value = true;
};

const saveCorrectionBatch = async () => {
  hasChanges.value = false;
};

const getCorrectionStatus = (candidateId: string): string | null => {
  const correction = corrections.value.get(candidateId);
  return correction ? correction.status : null;
};

const correctionPercentage = (candidateId: string): number => {
  const correction = corrections.value.get(candidateId);
  if (!correction || !exam.value) return 0;
  const scoredTasks = correction.taskScores.filter(ts => ts.points > 0).length;
  const totalTasks = exam.value.structure.tasks.length;
  return totalTasks > 0 ? Math.round((scoredTasks / totalTasks) * 100) : 0;
};

const jumpToCandidate = (candidate: Exams.Candidate, _task?: Exams.TaskNode) => {
  correctionViewMode.value = 'candidate';
  selectCandidate(candidate);
};

const handleSaveComment = (payload: { candidateId: string; comment: Omit<Exams.CorrectionComment, 'id' | 'timestamp'> }) => {
  const correction = corrections.value.get(payload.candidateId);
  if (!correction) return;
  const newComment = CommentManagementService.createComment(
    payload.comment.text,
    payload.comment.taskId,
    payload.comment.level,
    payload.comment.printable,
    payload.comment.availableAfterReturn
  );
  const updated = { ...correction, comments: [...correction.comments.filter(c => c.taskId !== newComment.taskId || c.level !== newComment.level), newComment], lastModified: new Date() };
  corrections.value.set(payload.candidateId, updated);
  hasChanges.value = true;
};

const handleCopyComments = (payload: { sourceCandidateId: string; targetCandidateIds: string[]; comment: Omit<Exams.CorrectionComment, 'id' | 'timestamp'> }) => {
  const sourceCorrection = corrections.value.get(payload.sourceCandidateId);
  if (!sourceCorrection) return;
  for (const targetId of payload.targetCandidateIds) {
    const target = corrections.value.get(targetId);
    if (!target) continue;
    const updated = CommentManagementService.copyCommentsToCandidate(sourceCorrection, target);
    corrections.value.set(targetId, updated);
  }
  hasChanges.value = true;
};

const goBack = () => {
  router.push('/exams');
};

onMounted(async () => {
  exam.value = {
    id: 'exam-1',
    title: 'Mathematics Test',
    mode: Exams.ExamMode.Simple,
    structure: {
      parts: [],
      tasks: [
        {
          id: 'task-1',
          level: 1,
          order: 0,
          title: 'Task 1',
          points: 10,
          isChoice: false,
          criteria: [],
          allowComments: true,
          allowSupportTips: true,
          commentBoxEnabled: true,
          subtasks: []
        },
        {
          id: 'task-2',
          level: 1,
          order: 1,
          title: 'Task 2',
          points: 15,
          isChoice: false,
          criteria: [],
          allowComments: true,
          allowSupportTips: true,
          commentBoxEnabled: true,
          subtasks: []
        }
      ],
      allowsComments: true,
      allowsSupportTips: true,
      totalPoints: 25
    },
    gradingKey: {
      id: 'key-1',
      name: 'Standard',
      type: Exams.GradingKeyType.Percentage,
      totalPoints: 25,
      gradeBoundaries: [
        { grade: 1, minPercentage: 92, displayValue: '1' },
        { grade: 2, minPercentage: 81, displayValue: '2' },
        { grade: 3, minPercentage: 70, displayValue: '3' },
        { grade: 4, minPercentage: 60, displayValue: '4' },
        { grade: 5, minPercentage: 50, displayValue: '5' },
        { grade: 6, minPercentage: 0, displayValue: '6' }
      ],
      roundingRule: { type: 'nearest', decimalPlaces: 1 },
      errorPointsToGrade: false,
      customizable: true,
      modifiedAfterCorrection: false
    },
    printPresets: [],
    candidates: [],
    status: 'in-progress',
    createdAt: new Date(),
    lastModified: new Date()
  };

  candidates.value = [
    { id: '1', examId: 'exam-1', firstName: 'Alice', lastName: 'Smith' },
    { id: '2', examId: 'exam-1', firstName: 'Bob', lastName: 'Johnson' },
    { id: '3', examId: 'exam-1', firstName: 'Charlie', lastName: 'Brown' }
  ];

  if (candidates.value.length > 0) {
    selectCandidate(candidates.value[0]);
  }
});
</script>

<style scoped>
.correction-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-background, #f5f5f5);
}

.correction-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid var(--color-border, #ddd);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-info h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.exam-meta {
  margin: 0;
  color: var(--color-text-muted, #666);
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.view-mode-toggle {
  display: flex;
  gap: 0.25rem;
}

.btn-toggle {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-toggle.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.correction-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  flex: 1;
  overflow: hidden;
  gap: 1px;
  background: var(--color-border, #ddd);
}

.candidates-sidebar {
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border, #ddd);
}

.sidebar-header h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
}

.filter-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  font-size: 0.9rem;
}

.candidates-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.candidate-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: white;
  border-left: 3px solid transparent;
  cursor: pointer;
  text-align: left;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.candidate-btn:hover {
  background: var(--color-surface, #f9f9f9);
}

.candidate-btn.active {
  background: var(--color-primary-light, #e8f4f8);
  border-left-color: var(--color-primary, #3498db);
  font-weight: 600;
}

.candidate-name {
  flex: 1;
}

.status-badge {
  font-size: 0.8rem;
  background: var(--color-primary, #3498db);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
}

.correction-panel {
  background: white;
  overflow-y: auto;
  padding: 2rem;
}

.correction-form {
  max-width: 800px;
}

.candidate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border, #ddd);
}

.candidate-header h2 {
  margin: 0;
}

.status {
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-in-progress {
  background: #fff3cd;
  color: #856404;
}

.status-completed {
  background: #d4edda;
  color: #155724;
}

.status-not-started {
  background: #e2e3e5;
  color: #383d41;
}

.scoring-section {
  margin-bottom: 3rem;
}

.scoring-section h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
}

.task-scoring {
  background: var(--color-surface, #f9f9f9);
  border: 1px solid var(--color-border, #ddd);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.task-title {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.task-title label {
  font-weight: 600;
}

.max-points {
  color: var(--color-text-muted, #666);
  font-size: 0.9rem;
}

.score-input-group {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.score-input {
  width: 100px;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  border: 2px solid var(--color-primary, #3498db);
  border-radius: 4px;
  text-align: center;
}

.points-to-next {
  color: var(--color-primary, #3498db);
  font-size: 0.85rem;
  font-weight: 500;
}

.comment-box {
  margin-top: 0.75rem;
}

.comment-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
}

.total-score-section {
  background: linear-gradient(135deg, #e8f4f8 0%, #f0f8fb 100%);
  border: 2px solid var(--color-primary, #3498db);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 3rem;
}

.score-display {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.score-item {
  text-align: center;
}

.score-item label {
  display: block;
  color: var(--color-text-muted, #666);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.score-value {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-primary, #3498db);
}

.score-item.highlight .grade-value {
  font-size: 2.5rem;
  color: #27ae60;
}

.support-tips-section,
.highlight-section {
  margin-bottom: 2rem;
}

.support-tips-section h3,
.highlight-section h3 {
  margin: 0 0 1rem 0;
}

.tips-input {
  margin-bottom: 1rem;
}

.assigned-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tip-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-primary-light, #e8f4f8);
  border: 1px solid var(--color-primary, #3498db);
  border-radius: 20px;
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #e74c3c;
  padding: 0;
  line-height: 1;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 1rem;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.special-input {
  margin-top: 1rem;
}

.nav-buttons {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
}

.btn-nav {
  flex: 1;
  padding: 0.75rem;
  background: var(--color-surface, #f9f9f9);
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-nav:hover {
  background: var(--color-border, #ddd);
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary,
.btn-success,
.btn-secondary-small {
  padding: 0.75rem 1.5rem;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-primary {
  background: var(--color-primary, #3498db);
  color: white;
  flex: 1;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #2980b9);
}

.btn-success {
  background: #27ae60;
  color: white;
  flex: 1;
}

.btn-success:hover {
  background: #229954;
}

.btn-secondary {
  background: var(--color-surface, #f0f0f0);
  color: var(--color-text, #333);
  border-color: var(--color-border, #ddd);
}

.btn-secondary:hover {
  background: var(--color-border, #ddd);
}

.btn-secondary-small {
  background: var(--color-primary, #3498db);
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-secondary-small:hover {
  background: var(--color-primary-dark, #2980b9);
}

.no-candidate {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-muted, #999);
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
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin: 0 0 1rem 0;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  font-size: 1rem;
}

.tips-list {
  margin-bottom: 1.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.tip-item {
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border, #ddd);
}

.tip-item:last-child {
  border-bottom: none;
}

.tip-description {
  margin: 0.5rem 0 0 0;
  color: var(--color-text-muted, #666);
  font-size: 0.85rem;
  margin-left: 1.5rem;
}

.modal-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.modal-buttons button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
}

.modal-buttons .btn-primary {
  background: var(--color-primary, #3498db);
  color: white;
}

.modal-buttons .btn-secondary {
  background: var(--color-surface, #f0f0f0);
  border-color: var(--color-border, #ddd);
  color: var(--color-text, #333);
}

@media (max-width: 1024px) {
  .correction-layout {
    grid-template-columns: 200px 1fr;
  }

  .score-display {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .correction-layout {
    grid-template-columns: 1fr;
  }

  .candidates-sidebar {
    display: none;
  }

  .correction-panel {
    padding: 1rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-primary,
  .btn-success {
    flex: none;
    width: 100%;
  }
}
</style>
