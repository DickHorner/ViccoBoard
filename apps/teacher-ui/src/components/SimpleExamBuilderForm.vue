<template>
  <div class="simple-exam-builder">
    <!-- Header -->
    <div class="builder-header">
      <h1>{{ isEditing ? 'Edit Exam' : 'Create Simple Exam' }}</h1>
      <p class="subtitle">Build a simple exam with flat task list (no nested levels)</p>
    </div>

    <!-- Exam Title Section -->
    <section class="section exam-details">
      <h2>Exam Details</h2>
      <div class="form-group">
        <label for="exam-title" class="label-required">Exam Title</label>
        <input
          id="exam-title"
          v-model="formData.title"
          type="text"
          placeholder="e.g., Math Quiz, Biology Test"
          class="form-input"
          @blur="validateTitle"
        />
        <p v-if="errors.title" class="error-message">{{ errors.title }}</p>
      </div>

      <div class="form-group">
        <label for="exam-description">Description (Optional)</label>
        <textarea
          id="exam-description"
          v-model="formData.description"
          placeholder="Add notes about this exam"
          class="form-textarea"
          rows="3"
        ></textarea>
      </div>
    </section>

    <!-- Tasks Section -->
    <section class="section tasks-section">
      <div class="section-header">
        <h2>Tasks</h2>
        <button @click="addTask" class="btn btn-primary btn-sm" :disabled="!canAddTask">
          + Add Task
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="formData.tasks.length === 0" class="empty-state">
        <p>No tasks yet. Click "Add Task" to start building your exam.</p>
      </div>

      <!-- Task List -->
      <div v-else class="task-list">
        <!-- Add some spacing/visual hierarchy -->
        <div
          v-for="(task, taskIndex) in formData.tasks"
          :key="task.id"
          class="task-card"
        >
          <div class="task-header">
            <div class="task-number">{{ taskIndex + 1 }}</div>
            <input
              v-model="task.title"
              type="text"
              placeholder="Task title (e.g., Task 1, Task 2a)"
              class="task-title-input"
              @blur="validateTaskTitle(taskIndex)"
            />
            <button
              @click="removeTask(taskIndex)"
              class="btn btn-danger btn-sm"
              :title="`Remove task ${taskIndex + 1}`"
            >
              Remove
            </button>
          </div>

          <!-- Task Details (Points) -->
          <div class="task-details">
            <div class="form-group">
              <label :for="`task-points-${taskIndex}`" class="label-required">
                Points
              </label>
              <input
                :id="`task-points-${taskIndex}`"
                v-model.number="task.points"
                type="number"
                min="0"
                step="1"
                class="form-input points-input"
                @blur="validateTaskPoints(taskIndex)"
              />
              <p v-if="errors.tasks?.[taskIndex]?.points" class="error-message">
                {{ errors.tasks[taskIndex].points }}
              </p>
            </div>

            <div class="form-group">
              <label :for="`task-bonus-${taskIndex}`">Bonus Points (Optional)</label>
              <input
                :id="`task-bonus-${taskIndex}`"
                v-model.number="task.bonusPoints"
                type="number"
                min="0"
                step="1"
                class="form-input points-input"
                @blur="validateTaskBonusPoints(taskIndex)"
              />
              <p v-if="errors.tasks?.[taskIndex]?.bonusPoints" class="error-message">
                {{ errors.tasks[taskIndex].bonusPoints }}
              </p>
            </div>

            <div class="form-group checkbox">
              <input
                :id="`task-choice-${taskIndex}`"
                v-model="task.isChoice"
                type="checkbox"
              />
              <label :for="`task-choice-${taskIndex}`">Choice Task (e.g., 3a/3b)</label>
            </div>
          </div>

          <!-- Criteria Section -->
          <div class="criteria-section">
            <div class="criteria-header">
              <h3>Criteria</h3>
              <button
                @click="addCriterion(taskIndex)"
                class="btn btn-secondary btn-xs"
                title="Add criterion to this task"
              >
                + Add Criterion
              </button>
            </div>

            <div v-if="task.criteria.length === 0" class="empty-criteria">
              <p>No criteria defined. Add criteria to score this task.</p>
            </div>

            <div v-else class="criteria-list">
              <div
                v-for="(criterion, critIndex) in task.criteria"
                :key="criterion.id"
                class="criterion-row"
              >
                <input
                  v-model="criterion.text"
                  type="text"
                  placeholder="Criterion description"
                  class="criterion-input"
                  @blur="validateCriterion(taskIndex, critIndex)"
                />
                <input
                  v-model.number="criterion.points"
                  type="number"
                  min="0"
                  step="0.5"
                  class="criterion-points-input"
                  title="Points for this criterion"
                  placeholder="Pts"
                />
                <button
                  @click="removeCriterion(taskIndex, critIndex)"
                  class="btn btn-danger btn-sm"
                  :title="`Remove criterion ${critIndex + 1}`"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Preview Section -->
    <section class="section preview-section" v-if="formData.tasks.length > 0">
      <h2>Preview & Summary</h2>
      <div class="preview-grid">
        <div class="preview-item">
          <span class="preview-label">Total Tasks</span>
          <span class="preview-value">{{ formData.tasks.length }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">Total Points</span>
          <span class="preview-value">{{ totalPoints }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">With Bonus</span>
          <span class="preview-value">{{ totalPointsWithBonus }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">Tasks with Criteria</span>
          <span class="preview-value">{{ tasksWithCriteria }}</span>
        </div>
      </div>

      <!-- Structure Preview -->
      <div class="structure-preview">
        <h3>Exam Structure</h3>
        <div class="task-preview-list">
          <div v-for="(task, idx) in formData.tasks" :key="task.id" class="task-preview">
            <div class="task-preview-title">
              Task {{ idx + 1 }}: <strong>{{ task.title || '(no title)' }}</strong>
            </div>
            <div class="task-preview-info">
              <span>📌 {{ task.points }} pts</span>
              <span v-if="task.bonusPoints > 0">💫 +{{ task.bonusPoints }} bonus</span>
              <span>📋 {{ task.criteria.length }} criteria</span>
              <span v-if="task.isChoice">🔀 Choice</span>
            </div>
            <div v-if="task.criteria.length > 0" class="criteria-preview">
              <div v-for="crit in task.criteria" :key="crit.id" class="crit-preview">
                • {{ crit.text || '(no text)' }} ({{ crit.points }} pts)
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Action Buttons -->
    <section class="section actions-section">
      <button
        @click="saveExam"
        class="btn btn-primary btn-lg"
        :disabled="!canSave"
        title="Save exam to database"
      >
        {{ isSaving ? 'Saving...' : 'Save Exam' }}
      </button>
      <button @click="cancelEdit" class="btn btn-secondary btn-lg">
        Cancel
      </button>
    </section>

    <!-- Status Messages -->
    <div v-if="successMessage" class="alert alert-success">
      ✅ {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="alert alert-error">
      ❌ {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';
import type { Exams } from '@viccoboard/core';
import { useExamsBridge } from '../composables/useExamsBridge';

// ============================================================================
// Router
// ============================================================================
const router = useRouter();
const route = useRoute();
const { examRepository } = useExamsBridge();

// ============================================================================
// State
// ============================================================================
interface TaskDraft {
  id: string;
  title: string;
  points: number;
  bonusPoints: number;
  isChoice: boolean;
  criteria: CriterionDraft[];
}

interface CriterionDraft {
  id: string;
  text: string;
  points: number;
}

const formData = reactive<{
  title: string;
  description: string;
  tasks: TaskDraft[];
}>({
  title: '',
  description: '',
  tasks: []
});

const errors = reactive<{
  title?: string;
  tasks?: Array<{ points?: string; title?: string; bonusPoints?: string }>;
}>({});

const isSaving = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const isEditing = computed(() => !!route.params.id);

// ============================================================================
// Computed Properties
// ============================================================================
const totalPoints = computed(() =>
  formData.tasks.reduce((sum, task) => sum + (task.points || 0), 0)
);

const totalPointsWithBonus = computed(() =>
  formData.tasks.reduce(
    (sum, task) => sum + (task.points || 0) + (task.bonusPoints || 0),
    0
  )
);

const tasksWithCriteria = computed(() =>
  formData.tasks.filter(task => task.criteria.length > 0).length
);

const canAddTask = computed(() => {
  // Can add task if current tasks are valid
  return !formData.tasks.some(task => !task.title?.trim() || task.points < 0);
});

const canSave = computed(() => {
  return (
    formData.title.trim().length > 0 &&
    formData.tasks.length > 0 &&
    formData.tasks.every(
      task => task.title?.trim().length > 0 && task.points >= 0
    ) &&
    !Object.values(errors).some(e => e !== undefined)
  );
});

// ============================================================================
// Methods - Initialization
// ============================================================================
const createNewTask = (): TaskDraft => ({
  id: uuidv4(),
  title: `Task ${formData.tasks.length + 1}`,
  points: 0,
  bonusPoints: 0,
  isChoice: false,
  criteria: []
});

const createNewCriterion = (): CriterionDraft => ({
  id: uuidv4(),
  text: '',
  points: 0
});

onMounted(async () => {
  if (isEditing.value && route.params.id) {
    try {
      if (!examRepository) {
        console.error('Exam repository is not available');
        errorMessage.value = 'Unable to load exam for editing. Please try again later.';
        return;
      }
      const examId = route.params.id as string;
      const exam = await examRepository.findById(examId);
      if (exam && exam.mode === 'simple') {
        formData.title = exam.title;
        formData.description = exam.description || '';
        // Convert exam structure back to draft format
        formData.tasks = exam.structure.tasks.map(task => ({
          id: task.id,
          title: task.title,
          points: task.points,
          bonusPoints: task.bonusPoints || 0,
          isChoice: task.isChoice,
          criteria: task.criteria.map(crit => ({
            id: crit.id,
            text: crit.text,
            points: crit.points
          }))
        }));
      }
    } catch (err) {
      console.error('Failed to load exam:', err);
      errorMessage.value = 'Failed to load exam for editing';
    }
  }
});

// ============================================================================
// Methods - Task Management
// ============================================================================
const addTask = () => {
  formData.tasks.push(createNewTask());
};

const removeTask = (index: number) => {
  formData.tasks.splice(index, 1);
};

// ============================================================================
// Methods - Criterion Management
// ============================================================================
const addCriterion = (taskIndex: number) => {
  const task = formData.tasks[taskIndex];
  if (task) {
    task.criteria.push(createNewCriterion());
  }
};

const removeCriterion = (taskIndex: number, criterionIndex: number) => {
  const task = formData.tasks[taskIndex];
  if (task) {
    task.criteria.splice(criterionIndex, 1);
  }
};

// ============================================================================
// Methods - Validation
// ============================================================================
const validateTitle = () => {
  errors.title = undefined;
  if (!formData.title.trim()) {
    errors.title = 'Exam title is required';
  }
};

const validateTaskTitle = (index: number) => {
  if (!errors.tasks) errors.tasks = [];
  if (!errors.tasks[index]) errors.tasks[index] = {};

  const task = formData.tasks[index];
  if (!task.title?.trim()) {
    errors.tasks[index]!.title = 'Task title is required';
  } else {
    errors.tasks[index]!.title = undefined;
  }
};

const validateTaskPoints = (index: number) => {
  if (!errors.tasks) errors.tasks = [];
  if (!errors.tasks[index]) errors.tasks[index] = {};

  const task = formData.tasks[index];
  if (task.points < 0) {
    errors.tasks[index]!.points = 'Points cannot be negative';
  } else {
    errors.tasks[index]!.points = undefined;
  }
};

const validateTaskBonusPoints = (index: number) => {
  if (!errors.tasks) errors.tasks = [];
  if (!errors.tasks[index]) errors.tasks[index] = {};

  const task = formData.tasks[index];
  if (task.bonusPoints < 0) {
    errors.tasks[index]!.bonusPoints = 'Bonus points cannot be negative';
  } else {
    errors.tasks[index]!.bonusPoints = undefined;
  }
};

const validateCriterion = (taskIndex: number, criterionIndex: number) => {
  const criterion = formData.tasks[taskIndex]?.criteria[criterionIndex];
  if (criterion && criterion.points < 0) {
    // Mark as error (could add to errors object if needed)
    console.warn('Criterion points cannot be negative');
  }
};

// ============================================================================
// Methods - Save & Cancel
// ============================================================================
const saveExam = async () => {
  // Clear previous messages
  errorMessage.value = '';
  successMessage.value = '';

  // Validate before save
  validateTitle();
  formData.tasks.forEach((_, index) => {
    validateTaskTitle(index);
    validateTaskPoints(index);
    validateTaskBonusPoints(index);
  });

  if (!canSave.value) {
    errorMessage.value = 'Please fix the errors above before saving';
    return;
  }

  isSaving.value = true;
  try {
    const tasks: Exams.TaskNode[] = formData.tasks.map((task, index) => ({
      id: task.id,
      level: 1,
      order: index + 1,
      title: task.title.trim(),
      points: task.points,
      bonusPoints: task.bonusPoints || 0,
      isChoice: task.isChoice,
      criteria: task.criteria.map(crit => ({
        id: crit.id,
        text: crit.text.trim() || 'Criterion',
        formatting: {},
        points: crit.points,
        aspectBased: false
      })),
      allowComments: false,
      allowSupportTips: false,
      commentBoxEnabled: false,
      subtasks: []
    }));

    const exam: Exams.Exam = {
      id: isEditing.value ? (route.params.id as string) : uuidv4(),
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      mode: 'simple' as Exams.ExamMode,
      structure: {
    if (!examRepository) {
      throw new Error('Exam repository is not initialized');
    }

    if (isEditing.value) {
      await examRepository.update(exam.id, exam);
      successMessage.value = 'Exam updated successfully!';
    } else {
      await examRepository.create(exam);
      },
      gradingKey: {
        id: uuidv4(),
        name: 'default',
        type: 'percentage' as Exams.GradingKeyType,
        totalPoints: totalPoints.value,
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

    // Save via repository
    if (isEditing.value) {
      await examRepository?.update(exam.id, exam);
      successMessage.value = 'Exam updated successfully!';
    } else {
      await examRepository?.create(exam);
      successMessage.value = 'Exam created successfully!';
    }

    // Clear errors and navigate back after a short delay
    setTimeout(() => {
      router.back();
    }, 1500);
  } catch (err) {
    console.error('Failed to save exam:', err);
    errorMessage.value = `Failed to save exam: ${err instanceof Error ? err.message : 'Unknown error'}`;
  } finally {
    isSaving.value = false;
  }
};

const cancelEdit = () => {
  router.back();
};
</script>

<style scoped>
/* ========================================================================== */
/* Layout */
/* ========================================================================== */
.simple-exam-builder {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.builder-header {
  margin-bottom: 2rem;
}

.builder-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: #1a1a1a;
}

.subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: #666;
}

.section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

/* ========================================================================== */
/* Form Controls */
/* ========================================================================== */
.form-group {
  margin-bottom: 1rem;
}

.form-group.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.form-group.checkbox input[type='checkbox'] {
  cursor: pointer;
  width: auto;
}

.form-group.checkbox label {
  margin: 0;
  cursor: pointer;
  user-select: none;
}

.label-required::after {
  content: ' *';
  color: #dc3545;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-textarea {
  resize: vertical;
}

.form-input.points-input {
  max-width: 120px;
}

.error-message {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #dc3545;
}

/* ========================================================================== */
/* Empty State */
/* ========================================================================== */
.empty-state {
  padding: 2rem;
  text-align: center;
  color: #666;
  background: #fff;
  border-radius: 4px;
  border: 1px dashed #ccc;
}

.empty-criteria {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  background: #fff;
  border-radius: 4px;
  border: 1px dashed #e0e0e0;
}

/* ========================================================================== */
/* Task List */
/* ========================================================================== */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.task-card {
  background: #fff;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.task-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.task-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #007bff;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.task-title-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
}

.task-title-input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* ========================================================================== */
/* Task Details */
/* ========================================================================== */
.task-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

/* ========================================================================== */
/* Criteria */
/* ========================================================================== */
.criteria-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f0f6ff;
  border-radius: 4px;
}

.criteria-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.criteria-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0056b3;
}

.criteria-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.criterion-row {
  display: grid;
  grid-template-columns: 1fr 80px 80px;
  gap: 0.75rem;
  align-items: center;
}

.criterion-input {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

.criterion-input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.criterion-points-input {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
}

.criterion-points-input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* ========================================================================== */
/* Preview */
/* ========================================================================== */
.preview-section {
  border-left-color: #28a745;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.preview-item {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.preview-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.preview-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #007bff;
}

.structure-preview {
  background: #fff;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.structure-preview h3 {
  margin-top: 0;
  font-size: 1rem;
  color: #333;
}

.task-preview-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-preview {
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.task-preview-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
}

.task-preview-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: #666;
}

.criteria-preview {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #dee2e6;
  font-size: 0.85rem;
  color: #555;
}

.crit-preview {
  margin-left: 1rem;
  margin-top: 0.25rem;
}

/* ========================================================================== */
/* Buttons */
/* ========================================================================== */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-secondary-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.85rem;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-danger-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.85rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-danger-small:hover {
  background: #c82333;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.85rem;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

/* ========================================================================== */
/* Actions Section */
/* ========================================================================== */
.actions-section {
  display: flex;
  gap: 1rem;
  border-left-color: #495057;
}

.actions-section .btn {
  flex: 1;
}

/* ========================================================================== */
/* Alerts */
/* ========================================================================== */
.alert {
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-weight: 500;
}

.alert-success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.alert-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

/* ========================================================================== */
/* Responsive */
/* ========================================================================== */
@media (max-width: 768px) {
  .simple-exam-builder {
    padding: 1rem;
  }

  .task-header {
    flex-wrap: wrap;
  }

  .task-details {
    grid-template-columns: 1fr;
  }

  .criterion-row {
    grid-template-columns: 1fr 60px 60px;
  }

  .preview-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .actions-section {
    flex-direction: column;
  }

  .actions-section .btn {
    width: 100%;
  }
}
</style>
