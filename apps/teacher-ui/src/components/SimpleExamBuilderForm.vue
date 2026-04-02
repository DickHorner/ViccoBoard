<template>
  <div class="simple-exam-builder">
    <div class="builder-header">
      <h1>{{ isEditing ? 'Prüfung bearbeiten' : 'Einfache Prüfung erstellen' }}</h1>
      <p class="subtitle">Einfache Prüfung mit flacher Aufgabenliste ohne Verschachtelung</p>
    </div>

    <section class="section exam-details">
      <h2>Prüfungsdetails</h2>
      <div class="form-group">
        <label for="exam-title" class="label-required">Prüfungstitel</label>
        <input
          id="exam-title"
          v-model="formData.title"
          type="text"
          placeholder="z. B. Mathetest, Biologiequiz"
          class="form-input"
          @blur="validateTitle"
        />
        <p v-if="errors.title" class="error-message">{{ errors.title }}</p>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="exam-date">Prüfungsdatum</label>
          <input id="exam-date" v-model="formData.date" type="date" class="form-input" />
        </div>
        <div class="form-group">
          <label for="exam-description">Beschreibung (optional)</label>
          <textarea
            id="exam-description"
            v-model="formData.description"
            placeholder="Notizen zu dieser Prüfung"
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>
      </div>
    </section>

    <section class="section tasks-section">
      <div class="section-header">
        <h2>Aufgaben</h2>
        <button @click="addTask" class="btn btn-primary btn-sm" :disabled="!canAddTask">
          + Aufgabe hinzufügen
        </button>
      </div>

      <div v-if="formData.tasks.length === 0" class="empty-state">
        <p>Noch keine Aufgaben. Klicken Sie auf „Aufgabe hinzufügen“, um zu starten.</p>
      </div>

      <div v-else class="task-list">
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
              placeholder="Aufgabentitel (z. B. Aufgabe 1, Aufgabe 2a)"
              class="task-title-input"
              @blur="validateTaskTitle(taskIndex)"
            />
            <button
              @click="removeTask(taskIndex)"
              class="btn btn-danger btn-sm"
              :title="`Aufgabe ${taskIndex + 1} entfernen`"
            >
              Entfernen
            </button>
          </div>

          <div class="task-details">
            <div class="form-group">
              <label :for="`task-points-${taskIndex}`" class="label-required">
                Punkte
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
              <label :for="`task-bonus-${taskIndex}`">Bonuspunkte (optional)</label>
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
              <label :for="`task-choice-${taskIndex}`">Wahlaufgabe (z. B. 3a/3b)</label>
            </div>
          </div>

          <div class="criteria-section">
            <div class="criteria-header">
              <h3>Kriterien</h3>
              <button
                @click="addCriterion(taskIndex)"
                class="btn btn-secondary btn-xs"
                title="Kriterium zu dieser Aufgabe hinzufügen"
              >
                + Kriterium hinzufügen
              </button>
            </div>

            <div v-if="task.criteria.length === 0" class="empty-criteria">
              <p>Noch keine Kriterien. Fügen Sie Kriterien zur Bewertung dieser Aufgabe hinzu.</p>
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
                  placeholder="Kriterium beschreiben"
                  class="criterion-input"
                  @blur="validateCriterion(taskIndex, critIndex)"
                />
                <input
                  v-model.number="criterion.points"
                  type="number"
                  min="0"
                  step="0.5"
                  class="criterion-points-input"
                  title="Punkte für dieses Kriterium"
                  placeholder="Pkt."
                />
                <button
                  @click="removeCriterion(taskIndex, critIndex)"
                  class="btn btn-danger btn-sm"
                  :title="`Kriterium ${critIndex + 1} entfernen`"
                >
                  Entfernen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Kandidaten</h2>
        <button @click="addCandidate" class="btn btn-primary btn-sm">+ Kandidat hinzufügen</button>
      </div>

      <div v-if="formData.candidates.length === 0" class="empty-state">
        <p>Für die Korrektur und den PDF-Export wird mindestens ein Kandidat benötigt.</p>
      </div>

      <div v-else class="task-list">
        <div
          v-for="(candidate, candidateIndex) in formData.candidates"
          :key="candidate.id"
          class="task-card"
        >
          <div class="task-header">
            <div class="task-number">{{ candidateIndex + 1 }}</div>
            <input
              v-model="candidate.firstName"
              type="text"
              placeholder="Vorname"
              class="task-title-input"
            />
            <input
              v-model="candidate.lastName"
              type="text"
              placeholder="Nachname"
              class="task-title-input"
            />
            <button
              @click="removeCandidate(candidateIndex)"
              class="btn btn-danger btn-sm"
              :title="`Kandidat ${candidateIndex + 1} entfernen`"
            >
              Entfernen
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <CorrectionSheetPresetForm v-model="formData.preset" />
    </section>

    <section class="section preview-section" v-if="formData.tasks.length > 0">
      <h2>Vorschau und Zusammenfassung</h2>
      <div class="preview-grid">
        <div class="preview-item">
          <span class="preview-label">Aufgaben gesamt</span>
          <span class="preview-value">{{ formData.tasks.length }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">Kandidaten</span>
          <span class="preview-value">{{ formData.candidates.length }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">Punkte gesamt</span>
          <span class="preview-value">{{ totalPoints }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">Mit Bonus</span>
          <span class="preview-value">{{ totalPointsWithBonus }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">Aufgaben mit Kriterien</span>
          <span class="preview-value">{{ tasksWithCriteria }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">Bogenlayout</span>
          <span class="preview-value">{{ formData.preset.layoutMode === 'compact' ? 'Kompakt' : 'Standard' }}</span>
        </div>
      </div>

      <div class="structure-preview">
        <h3>Prüfungsstruktur</h3>
        <div class="task-preview-list">
          <div v-for="(task, idx) in formData.tasks" :key="task.id" class="task-preview">
            <div class="task-preview-title">
              Aufgabe {{ idx + 1 }}: <strong>{{ task.title || '(ohne Titel)' }}</strong>
            </div>
            <div class="task-preview-info">
              <span>{{ task.points }} Punkte</span>
              <span v-if="task.bonusPoints > 0">+{{ task.bonusPoints }} Bonus</span>
              <span>{{ task.criteria.length }} Kriterien</span>
              <span v-if="task.isChoice">Wahlaufgabe</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section actions-section">
      <button
        @click="saveExam"
        class="btn btn-primary btn-lg"
        :disabled="!canSave"
        title="Prüfung speichern"
      >
        {{ isSaving ? 'Wird gespeichert...' : 'Prüfung speichern' }}
      </button>
      <button @click="cancelEdit" class="btn btn-secondary btn-lg">
        Abbrechen
      </button>
      <button
        v-if="isEditing && route.params.id"
        @click="openExport"
        class="btn btn-secondary btn-lg"
      >
        Export
      </button>
    </section>

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
import { createDefaultCorrectionSheetPreset } from '@viccoboard/exams';
import { useExamsBridge } from '../composables/useExamsBridge';
import CorrectionSheetPresetForm from './CorrectionSheetPresetForm.vue';

const router = useRouter();
const route = useRoute();
const { examRepository, getCorrectionSheetPreset, saveCorrectionSheetPreset } = useExamsBridge();

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

interface CandidateDraft {
  id: string;
  firstName: string;
  lastName: string;
  externalId?: string;
}

const formData = reactive<{
  title: string;
  description: string;
  date: string;
  tasks: TaskDraft[];
  candidates: CandidateDraft[];
  preset: Exams.CorrectionSheetPreset;
}>({
  title: '',
  description: '',
  date: '',
  tasks: [],
  candidates: [],
  preset: createDefaultCorrectionSheetPreset('draft')
});

const errors = reactive<{
  title?: string;
  tasks?: Array<{ points?: string; title?: string; bonusPoints?: string }>;
}>({});

const isSaving = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const isEditing = computed(() => !!route.params.id);

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
  return !formData.tasks.some(task => !task.title?.trim() || task.points < 0);
});

const canSave = computed(() => {
  return (
    formData.title.trim().length > 0 &&
    formData.tasks.length > 0 &&
    formData.candidates.length > 0 &&
    formData.candidates.every(candidate => candidate.firstName.trim() && candidate.lastName.trim()) &&
    formData.tasks.every(
      task => task.title?.trim().length > 0 && task.points >= 0
    ) &&
    !Object.values(errors).some(e => e !== undefined)
  );
});

const createNewTask = (): TaskDraft => ({
  id: uuidv4(),
  title: `Aufgabe ${formData.tasks.length + 1}`,
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

const createNewCandidate = (): CandidateDraft => ({
  id: uuidv4(),
  firstName: '',
  lastName: '',
  externalId: ''
});

onMounted(async () => {
  if (isEditing.value && route.params.id) {
    try {
      if (!examRepository) {
        throw new Error('Exam repository is not available');
      }
      const examId = route.params.id as string;
      const exam = await examRepository.findById(examId);
      if (exam && exam.mode === 'simple') {
        formData.title = exam.title;
        formData.description = exam.description || '';
        formData.date = exam.date ? new Date(exam.date).toISOString().slice(0, 10) : '';
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
        formData.candidates = exam.candidates.map(candidate => ({
          id: candidate.id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          externalId: candidate.externalId
        }));
        formData.preset = await getCorrectionSheetPreset?.(exam.id) ?? createDefaultCorrectionSheetPreset(exam.id);
      }
    } catch (err) {
      console.error('Failed to load exam:', err);
      errorMessage.value = 'Fehler beim Laden der Prüfung zum Bearbeiten';
    }
  } else {
    formData.preset = createDefaultCorrectionSheetPreset(uuidv4());
  }
});

const addTask = () => {
  formData.tasks.push(createNewTask());
};

const removeTask = (index: number) => {
  formData.tasks.splice(index, 1);
};

const addCandidate = () => {
  formData.candidates.push(createNewCandidate());
};

const removeCandidate = (index: number) => {
  formData.candidates.splice(index, 1);
};

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

const validateTitle = () => {
  errors.title = undefined;
  if (!formData.title.trim()) {
    errors.title = 'Ein Prüfungstitel ist erforderlich.';
  }
};

const validateTaskTitle = (index: number) => {
  if (!errors.tasks) errors.tasks = [];
  if (!errors.tasks[index]) errors.tasks[index] = {};

  const task = formData.tasks[index];
  if (!task.title?.trim()) {
    errors.tasks[index]!.title = 'Ein Aufgabentitel ist erforderlich.';
  } else {
    errors.tasks[index]!.title = undefined;
  }
};

const validateTaskPoints = (index: number) => {
  if (!errors.tasks) errors.tasks = [];
  if (!errors.tasks[index]) errors.tasks[index] = {};

  const task = formData.tasks[index];
  if (task.points < 0) {
    errors.tasks[index]!.points = 'Punkte dürfen nicht negativ sein.';
  } else {
    errors.tasks[index]!.points = undefined;
  }
};

const validateTaskBonusPoints = (index: number) => {
  if (!errors.tasks) errors.tasks = [];
  if (!errors.tasks[index]) errors.tasks[index] = {};

  const task = formData.tasks[index];
  if (task.bonusPoints < 0) {
    errors.tasks[index]!.bonusPoints = 'Bonuspunkte dürfen nicht negativ sein.';
  } else {
    errors.tasks[index]!.bonusPoints = undefined;
  }
};

const validateCriterion = (taskIndex: number, criterionIndex: number) => {
  const criterion = formData.tasks[taskIndex]?.criteria[criterionIndex];
  if (criterion && criterion.points < 0) {
    console.warn('Kriteriumspunkte dürfen nicht negativ sein');
  }
};

const saveExam = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  validateTitle();
  formData.tasks.forEach((_, index) => {
    validateTaskTitle(index);
    validateTaskPoints(index);
    validateTaskBonusPoints(index);
  });

  if (!canSave.value) {
    errorMessage.value = 'Bitte beheben Sie die oben markierten Fehler, bevor Sie speichern.';
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
        text: crit.text.trim() || 'Kriterium',
        formatting: {},
        points: crit.points,
        aspectBased: false
      })),
      allowComments: formData.preset.showTaskComments || formData.preset.showGeneralComment,
      allowSupportTips: false,
      commentBoxEnabled: formData.preset.showTaskComments,
      subtasks: []
    }));

    if (!examRepository) {
      throw new Error('Exam repository is not initialized');
    }

    const examInput: Exams.Exam = {
      id: isEditing.value ? (route.params.id as string) : uuidv4(),
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      date: formData.date ? new Date(`${formData.date}T00:00:00`) : undefined,
      mode: 'simple' as Exams.ExamMode,
      structure: {
        parts: [],
        tasks,
        allowsComments: formData.preset.showTaskComments || formData.preset.showGeneralComment,
        allowsSupportTips: false,
        totalPoints: totalPoints.value
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
      candidates: formData.candidates.map(candidate => ({
        id: candidate.id,
        examId: isEditing.value ? (route.params.id as string) : 'draft',
        firstName: candidate.firstName.trim(),
        lastName: candidate.lastName.trim(),
        externalId: candidate.externalId?.trim() || undefined
      })),
      status: 'draft',
      createdAt: new Date(),
      lastModified: new Date()
    };

    let savedExam: Exams.Exam;
    if (isEditing.value) {
      await examRepository.update(examInput.id, examInput);
      savedExam = (await examRepository.findById(examInput.id)) ?? examInput;
      successMessage.value = 'Prüfung erfolgreich aktualisiert.';
    } else {
      const { id: _id, createdAt: _createdAt, lastModified: _lastModified, ...createInput } = examInput;
      savedExam = await examRepository.create(createInput);
      successMessage.value = 'Prüfung erfolgreich erstellt.';
    }

    await saveCorrectionSheetPreset?.({
      ...formData.preset,
      examId: savedExam.id
    });

    setTimeout(() => {
      router.push('/exams');
    }, 600);
  } catch (err) {
    console.error('Failed to save exam:', err);
    errorMessage.value = `Fehler beim Speichern der Prüfung: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`;
  } finally {
    isSaving.value = false;
  }
};

const cancelEdit = () => {
  router.back();
};

const openExport = () => {
  if (!route.params.id) {
    return;
  }
  router.push(`/exams/${route.params.id}/export`);
};
</script>

<style scoped src="./SimpleExamBuilderForm.css"></style>
