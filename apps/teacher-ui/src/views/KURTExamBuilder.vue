<template>
  <div class="exam-builder-page">
    <div class="builder-header">
      <div>
        <h1>{{ isEditing ? 'Edit Exam' : 'Create Exam' }}</h1>
        <p v-if="exam">{{ exam.mode === 'simple' ? 'Simple: flat task list' : 'Complex: nested tasks (3 levels)' }}</p>
      </div>
      <div class="actions">
        <button @click="goBack" class="btn-secondary">Cancel</button>
        <button @click="saveExam" class="btn-primary" :disabled="!canSave">Save Exam</button>
      </div>
    </div>

    <div v-if="exam" class="builder-content">
      <!-- Exam Details Section -->
      <section class="section">
        <h2>Exam Details</h2>
        <div class="form-group">
          <label>Exam Title</label>
          <input v-model="exam.title" type="text" placeholder="Exam title" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea v-model="exam.description" placeholder="Optional exam description"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Mode</label>
            <select v-model="exam.mode" @change="handleModeChange">
              <option value="simple">Simple (flat)</option>
              <option value="complex">Complex (nested)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Allow Comments</label>
            <input v-model="exam.structure.allowsComments" type="checkbox" />
          </div>
          <div class="form-group">
            <label>Allow Support Tips</label>
            <input v-model="exam.structure.allowsSupportTips" type="checkbox" />
          </div>
        </div>
      </section>

      <!-- Tasks Section -->
      <section class="section">
        <div class="section-header">
          <h2>Tasks</h2>
          <button @click="addTask" class="btn-small">+ Add Task</button>
        </div>

        <div v-if="exam.structure.tasks.length === 0" class="empty-state">
          No tasks yet. Add your first task to get started.
        </div>

        <div v-for="(task, idx) in exam.structure.tasks" :key="task.id" class="task-card">
          <div class="task-header">
            <input
              v-model="task.title"
              type="text"
              placeholder="Task title (e.g., Task 1, Task 2a)"
              class="task-title-input"
            />
            <button @click="removeTask(idx)" class="btn-danger-small">Remove</button>
          </div>

          <div class="task-details">
            <div class="form-group">
              <label>Points</label>
              <input v-model.number="task.points" type="number" min="0" step="1" />
            </div>
            <div class="form-group">
              <label>Bonus Points</label>
              <input v-model.number="task.bonusPoints" type="number" min="0" step="1" />
            </div>

            <div class="form-row">
              <div class="form-group checkbox">
                <input v-model="task.isChoice" type="checkbox" />
                <label>Choice Task (e.g., 3a/3b)</label>
              </div>
              <div class="form-group checkbox">
                <input v-model="task.allowComments" type="checkbox" />
                <label>Allow Comments</label>
              </div>
            </div>
          </div>

          <!-- Criteria for this task -->
          <div v-if="task.criteria.length > 0" class="criteria-list">
            <h4>Criteria</h4>
            <div v-for="(criterion, cidx) in task.criteria" :key="criterion.id" class="criterion-item">
              <input v-model="criterion.text" type="text" placeholder="Criterion description" class="criterion-input" />
              <input v-model.number="criterion.points" type="number" min="0" step="0.5" class="points-input" title="Points" />
              <button @click="removeCriterion(idx, cidx)" class="btn-danger-small">Remove</button>
            </div>
          </div>
          <button @click="addCriterion(idx)" class="btn-secondary-small">+ Add Criterion</button>

          <!-- Subtasks for complex mode -->
          <div v-if="exam.mode === 'complex' && task.subtasks.length > 0" class="subtasks-section">
            <h4>Subtasks</h4>
            <div v-for="(subtaskId, sidx) in task.subtasks" :key="subtaskId" class="subtask-row">
              <span>{{ sidx + 1 }}</span>
              <button @click="removeSubtask(idx, sidx)" class="btn-danger-small">Remove</button>
            </div>
          </div>
          <button v-if="exam.mode === 'complex'" @click="addSubtask(idx)" class="btn-secondary-small">+ Add Subtask</button>
        </div>
      </section>

      <!-- Exam Parts Section -->
      <section class="section">
        <div class="section-header">
          <h2>Exam Parts</h2>
          <button @click="addPart" class="btn-small">+ Add Part</button>
        </div>

        <div v-if="exam.structure.parts.length === 0" class="empty-state">
          No parts yet. Exam parts are optional.
        </div>

        <div v-for="(part, pidx) in exam.structure.parts" :key="part.id" class="part-card">
          <input v-model="part.name" type="text" placeholder="Part name (e.g., Part A)" />
          <div class="form-row">
            <div class="form-group checkbox">
              <input v-model="part.calculateSubScore" type="checkbox" />
              <label>Calculate Sub-Score</label>
            </div>
            <div class="form-group checkbox">
              <input v-model="part.printable" type="checkbox" />
              <label>Printable</label>
            </div>
          </div>
          <button @click="removePart(pidx)" class="btn-danger-small">Remove</button>
        </div>
      </section>

      <!-- Grading Key Section -->
      <section class="section">
        <h2>Grading Key</h2>
        <div class="form-group">
          <label>Grading Type</label>
          <select v-model="exam.gradingKey.type">
            <option value="percentage">Percentage</option>
            <option value="points">Points</option>
            <option value="error-points">Error Points</option>
          </select>
        </div>
        <div class="form-group">
          <label>Total Points</label>
          <input v-model.number="exam.gradingKey.totalPoints" type="number" min="0" step="1" readonly />
        </div>
        <div class="form-group">
          <label>Rounding</label>
          <select v-model="exam.gradingKey.roundingRule.type">
            <option value="up">Round Up</option>
            <option value="down">Round Down</option>
            <option value="nearest">Nearest</option>
            <option value="none">No Rounding</option>
          </select>
        </div>
        <div v-if="exam.gradingKey.gradeBoundaries.length > 0">
          <h3>Grade Boundaries</h3>
          <table class="boundaries-table">
            <thead>
              <tr>
                <th>Grade</th>
                <th>Min %</th>
                <th>Max %</th>
                <th>Display Value</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="boundary in exam.gradingKey.gradeBoundaries" :key="boundary.grade">
                <td>{{ boundary.grade }}</td>
                <td>{{ boundary.minPercentage }}%</td>
                <td>{{ boundary.maxPercentage }}%</td>
                <td>{{ boundary.displayValue }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Summary -->
      <section class="section summary">
        <h2>Summary</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Total Tasks</span>
            <span class="value">{{ exam.structure.tasks.length }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total Points</span>
            <span class="value">{{ exam.gradingKey.totalPoints }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Exam Parts</span>
            <span class="value">{{ exam.structure.parts.length }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Mode</span>
            <span class="value">{{ exam.mode === 'simple' ? 'Simple' : 'Complex' }}</span>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="loading">Loading exam...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Exams } from '@viccoboard/core';
import { v4 as uuidv4 } from 'uuid';
import { useExams } from '../composables/useExams';

const router = useRouter();
const route = useRoute();
const { create, update, getById } = useExams();

const exam = ref<Exams.Exam | null>(null);
const isEditing = computed(() => !!route.params.id);

const canSave = computed(() => {
  return exam.value && exam.value.title && exam.value.structure.tasks.length > 0;
});

const handleModeChange = () => {
  if (!exam.value) return;
  // Clear subtasks if switching from complex to simple
  if (exam.value.mode === Exams.ExamMode.Simple) {
    exam.value.structure.tasks.forEach(task => {
      task.subtasks = [];
    });
  }
};

const addTask = () => {
  if (!exam.value) return;
  const newTask: Exams.TaskNode = {
    id: uuidv4(),
    level: 1,
    order: exam.value.structure.tasks.length,
    title: `Task ${exam.value.structure.tasks.length + 1}`,
    points: 0,
    isChoice: false,
    criteria: [],
    allowComments: exam.value.structure.allowsComments,
    allowSupportTips: exam.value.structure.allowsSupportTips,
    commentBoxEnabled: false,
    subtasks: []
  };
  exam.value.structure.tasks.push(newTask);
  updateTotalPoints();
};

const removeTask = (idx: number) => {
  if (!exam.value) return;
  exam.value.structure.tasks.splice(idx, 1);
  updateTotalPoints();
};

const addCriterion = (taskIdx: number) => {
  if (!exam.value) return;
  const task = exam.value.structure.tasks[taskIdx];
  if (!task) return;
  task.criteria.push({
    id: uuidv4(),
    text: '',
    points: 0,
    formatting: {},
    aspectBased: false
  });
};

const removeCriterion = (taskIdx: number, critIdx: number) => {
  if (!exam.value) return;
  const task = exam.value.structure.tasks[taskIdx];
  if (!task) return;
  task.criteria.splice(critIdx, 1);
};

const addSubtask = (taskIdx: number) => {
  if (!exam.value) return;
  const task = exam.value.structure.tasks[taskIdx];
  if (!task) return;
  task.subtasks.push(uuidv4());
};

const removeSubtask = (taskIdx: number, subtaskIdx: number) => {
  if (!exam.value) return;
  const task = exam.value.structure.tasks[taskIdx];
  if (!task) return;
  task.subtasks.splice(subtaskIdx, 1);
};

const addPart = () => {
  if (!exam.value) return;
  exam.value.structure.parts.push({
    id: uuidv4(),
    name: `Part ${exam.value.structure.parts.length + 1}`,
    taskIds: [],
    calculateSubScore: false,
    scoreType: 'points',
    printable: true,
    order: exam.value.structure.parts.length
  });
};

const removePart = (idx: number) => {
  if (!exam.value) return;
  exam.value.structure.parts.splice(idx, 1);
};

const updateTotalPoints = () => {
  if (!exam.value) return;
  const taskPoints = exam.value.structure.tasks.reduce((sum, task) => sum + task.points, 0);
  exam.value.gradingKey.totalPoints = taskPoints;
};

const saveExam = async () => {
  if (!exam.value || !canSave.value) return;
  try {
    if (isEditing.value) {
      await update(exam.value);
    } else {
      await create(exam.value);
    }
    router.push('/exams');
  } catch (error) {
    console.error('Failed to save exam:', error);
  }
};

const goBack = () => {
  router.push('/exams');
};

onMounted(async () => {
  if (isEditing.value) {
    // Load existing exam
    const id = route.params.id as string;
    const loaded = await getById(id);
    if (loaded) {
      exam.value = loaded;
    }
  } else {
    // Create new exam
    exam.value = {
      id: uuidv4(),
      title: '',
      mode: Exams.ExamMode.Simple,
      structure: {
        parts: [],
        tasks: [],
        allowsComments: false,
        allowsSupportTips: false,
        totalPoints: 0
      },
      gradingKey: {
        id: uuidv4(),
        name: 'Default',
        type: Exams.GradingKeyType.Points,
        totalPoints: 0,
        gradeBoundaries: [],
        roundingRule: { type: 'nearest', decimalPlaces: 1 },
        errorPointsToGrade: false,
        customizable: true,
        modifiedAfterCorrection: false
      },
      printPresets: [],
      candidates: [],
      status: 'draft',
      createdAt: new Date(),
      lastModified: new Date()
    };
  }
});
</script>

<style scoped>
.exam-builder-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.builder-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border, #ddd);
}

.actions {
  display: flex;
  gap: 1rem;
}

.builder-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  background: var(--color-surface, #f9f9f9);
  border: 1px solid var(--color-border, #ddd);
  border-radius: 8px;
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.section h3, .section h4 {
  margin: 1rem 0 0.75rem 0;
  font-size: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.form-group.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-direction: row;
}

.form-group.checkbox input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.task-card {
  border: 1px solid var(--color-border, #ddd);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: white;
}

.task-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}

.task-title-input {
  flex: 1;
  font-weight: 600;
  font-size: 1.05rem;
}

.task-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.criteria-list {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--color-surface, #f9f9f9);
  border-radius: 4px;
}

.criterion-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
}

.criterion-input {
  flex: 1 !important;
  padding: 0.5rem !important;
}

.points-input {
  width: 80px !important;
  padding: 0.5rem !important;
}

.subtasks-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border, #ddd);
}

.subtask-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  background: var(--color-surface, #f9f9f9);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.part-card {
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: white;
}

.boundaries-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.boundaries-table th,
.boundaries-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border, #ddd);
}

.boundaries-table th {
  background: var(--color-surface, #f9f9f9);
  font-weight: 600;
}

.summary {
  background: var(--color-primary-light, #e8f4f8);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-item .label {
  font-size: 0.85rem;
  color: var(--color-text-muted, #666);
  font-weight: 500;
}

.summary-item .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #3498db);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted, #999);
}

.loading {
  text-align: center;
  padding: 2rem;
}

.btn-primary,
.btn-secondary,
.btn-danger-small,
.btn-secondary-small,
.btn-small {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary, #3498db);
  color: white;
  border-color: var(--color-primary, #3498db);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark, #2980b9);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-text-muted, #f0f0f0);
  color: var(--color-text, #333);
}

.btn-secondary:hover {
  background: var(--color-border, #ddd);
}

.btn-secondary-small,
.btn-small {
  background: var(--color-primary, #3498db);
  color: white;
  border-color: var(--color-primary, #3498db);
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-secondary-small {
  background: var(--color-surface, #f0f0f0);
  color: var(--color-text, #333);
  border-color: var(--color-border, #ddd);
}

.btn-secondary-small:hover {
  background: var(--color-border, #ddd);
}

.btn-danger-small {
  background: #e74c3c;
  color: white;
  border-color: #e74c3c;
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-danger-small:hover {
  background: #c0392b;
}

@media (max-width: 768px) {
  .exam-builder-page {
    padding: 1rem;
  }

  .builder-header {
    flex-direction: column;
    gap: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .task-header {
    flex-direction: column;
    align-items: stretch;
  }

  .task-title-input {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
