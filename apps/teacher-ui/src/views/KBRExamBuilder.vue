<template>
  <div class="exam-builder-page">
    <div class="builder-header">
      <div>
        <h1>{{ isEditing ? 'Prüfung bearbeiten' : 'Prüfung erstellen' }}</h1>
        <p v-if="exam">{{ exam.mode === 'simple' ? 'Einfach: flache Aufgabenliste' : 'Komplex: verschachtelte Aufgaben (3 Ebenen)' }}</p>
      </div>
      <div class="actions">
        <button v-if="isEditing && exam" @click="openExportPage" class="btn-secondary">Export</button>
        <button @click="goBack" class="btn-secondary">Abbrechen</button>
        <button @click="saveExam" class="btn-primary" :disabled="!canSave">Prüfung speichern</button>
      </div>
    </div>

    <div v-if="exam" class="builder-content">
      <section class="section">
        <h2>Prüfungsdetails</h2>
        <div class="form-group">
          <label>Prüfungstitel</label>
          <input v-model="exam.title" type="text" placeholder="Prüfungstitel" />
        </div>
        <div class="form-group">
          <label>Beschreibung</label>
          <textarea v-model="exam.description" placeholder="Optionale Prüfungsbeschreibung"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Prüfungsdatum</label>
            <input v-model="examDateValue" type="date" />
          </div>
          <div class="form-group">
            <label>Modus</label>
            <select v-model="exam.mode" @change="handleModeChange">
              <option value="simple">Einfach (flach)</option>
              <option value="complex">Komplex (verschachtelt)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Kommentare erlauben</label>
            <input v-model="exam.structure.allowsComments" type="checkbox" />
          </div>
          <div class="form-group">
            <label>Fördertipps erlauben</label>
            <input v-model="exam.structure.allowsSupportTips" type="checkbox" />
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <h2>Kandidaten</h2>
          <button @click="addCandidate" class="btn-small">+ Kandidat hinzufügen</button>
        </div>

        <div v-if="exam.candidates.length === 0" class="empty-state">
          Noch keine Kandidaten. Für die Korrektur und den PDF-Export wird mindestens ein Prüfling benötigt.
        </div>

        <div v-else class="candidate-list">
          <div v-for="(candidate, index) in exam.candidates" :key="candidate.id" class="candidate-card">
            <div class="form-row">
              <div class="form-group">
                <label>Vorname</label>
                <input v-model="candidate.firstName" type="text" placeholder="Vorname" />
              </div>
              <div class="form-group">
                <label>Nachname</label>
                <input v-model="candidate.lastName" type="text" placeholder="Nachname" />
              </div>
              <div class="form-group">
                <label>Kennung (optional)</label>
                <input v-model="candidate.externalId" type="text" placeholder="z. B. Sitznummer" />
              </div>
            </div>
            <button @click="removeCandidate(index)" class="btn-danger-small">Entfernen</button>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <h2>Aufgaben</h2>
          <button @click="addTask" class="btn-small">+ Aufgabe hinzufügen</button>
        </div>

        <div v-if="exam.structure.tasks.length === 0" class="empty-state">
          Noch keine Aufgaben. Fügen Sie die erste Aufgabe hinzu.
        </div>

        <div v-for="(task, idx) in exam.structure.tasks" :key="task.id" class="task-card">
          <div class="task-header">
            <input
              v-model="task.title"
              type="text"
              placeholder="Aufgabentitel (z. B. Aufgabe 1, Aufgabe 2a)"
              class="task-title-input"
            />
            <button @click="removeTask(idx)" class="btn-danger-small">Entfernen</button>
          </div>

          <div class="task-details">
            <div class="form-group">
              <label>Punkte</label>
              <input v-model.number="task.points" type="number" min="0" step="1" @input="updateTotalPoints" />
            </div>
            <div class="form-group">
              <label>Bonuspunkte</label>
              <input v-model.number="task.bonusPoints" type="number" min="0" step="1" />
            </div>

            <div class="form-row">
              <div class="form-group checkbox">
                <input v-model="task.isChoice" type="checkbox" />
                <label>Wahlaufgabe (z. B. 3a/3b)</label>
              </div>
              <div class="form-group checkbox">
                <input v-model="task.allowComments" type="checkbox" />
                <label>Kommentare erlauben</label>
              </div>
            </div>
          </div>

          <div v-if="task.criteria.length > 0" class="criteria-list">
            <h4>Kriterien</h4>
            <div v-for="(criterion, cidx) in task.criteria" :key="criterion.id" class="criterion-item">
              <input v-model="criterion.text" type="text" placeholder="Kriterium beschreiben" class="criterion-input" />
              <input v-model.number="criterion.points" type="number" min="0" step="0.5" class="points-input" title="Punkte" />
              <button @click="removeCriterion(idx, cidx)" class="btn-danger-small">Entfernen</button>
            </div>
          </div>
          <button @click="addCriterion(idx)" class="btn-secondary-small">+ Kriterium hinzufügen</button>

          <div v-if="exam.mode === 'complex' && task.subtasks.length > 0" class="subtasks-section">
            <h4>Teilaufgaben</h4>
            <div v-for="(subtaskId, sidx) in task.subtasks" :key="subtaskId" class="subtask-row">
              <span>{{ sidx + 1 }}</span>
              <button @click="removeSubtask(idx, sidx)" class="btn-danger-small">Entfernen</button>
            </div>
          </div>
          <button v-if="exam.mode === 'complex'" @click="addSubtask(idx)" class="btn-secondary-small">+ Teilaufgabe hinzufügen</button>
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <h2>Prüfungsteile</h2>
          <button @click="addPart" class="btn-small">+ Teil hinzufügen</button>
        </div>

        <div v-if="exam.structure.parts.length === 0" class="empty-state">
          Noch keine Teile. Prüfungsteile sind optional.
        </div>

        <div v-for="(part, pidx) in exam.structure.parts" :key="part.id" class="part-card">
          <input v-model="part.name" type="text" placeholder="Teilname (z. B. Teil A)" />
          <div class="form-row">
            <div class="form-group checkbox">
              <input v-model="part.calculateSubScore" type="checkbox" />
              <label>Teilnote berechnen</label>
            </div>
            <div class="form-group checkbox">
              <input v-model="part.printable" type="checkbox" />
              <label>Druckbar</label>
            </div>
          </div>
          <button @click="removePart(pidx)" class="btn-danger-small">Entfernen</button>
        </div>
      </section>

      <section class="section">
        <CorrectionSheetPresetForm v-model="preset" />
      </section>

      <section class="section">
        <h2>Notenschlüssel</h2>
        <div class="form-group">
          <label>Schlüsseltyp</label>
          <select v-model="exam.gradingKey.type">
            <option value="percentage">Prozent</option>
            <option value="points">Punkte</option>
            <option value="error-points">Fehlerpunkte</option>
          </select>
        </div>
        <div class="form-group">
          <label>Gesamtpunkte</label>
          <input v-model.number="exam.gradingKey.totalPoints" type="number" min="0" step="1" readonly />
        </div>
        <div class="form-group">
          <label>Rundung</label>
          <select v-model="exam.gradingKey.roundingRule.type">
            <option value="up">Aufrunden</option>
            <option value="down">Abrunden</option>
            <option value="nearest">Kaufmännisch</option>
            <option value="none">Keine Rundung</option>
          </select>
        </div>
        <div v-if="exam.gradingKey.gradeBoundaries.length > 0">
          <h3>Notengrenzen</h3>
          <table class="boundaries-table">
            <thead>
              <tr>
                <th>Note</th>
                <th>Min. %</th>
                <th>Max. %</th>
                <th>Anzeigewert</th>
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

      <section class="section summary">
        <h2>Zusammenfassung</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Kandidaten</span>
            <span class="value">{{ exam.candidates.length }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Aufgaben gesamt</span>
            <span class="value">{{ exam.structure.tasks.length }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Punkte gesamt</span>
            <span class="value">{{ exam.gradingKey.totalPoints }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Prüfungsteile</span>
            <span class="value">{{ exam.structure.parts.length }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Modus</span>
            <span class="value">{{ exam.mode === 'simple' ? 'Einfach' : 'Komplex' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Bogenlayout</span>
            <span class="value">{{ preset.layoutMode === 'compact' ? 'Kompakt' : 'Standard' }}</span>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="loading">Prüfung wird geladen...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Exams } from '@viccoboard/core';
import { v4 as uuidv4 } from 'uuid';
import {
  createDefaultCorrectionSheetPreset
} from '@viccoboard/exams';
import { useExamsBridge } from '../composables/useExamsBridge';
import CorrectionSheetPresetForm from '../components/CorrectionSheetPresetForm.vue';

const router = useRouter();
const route = useRoute();
const {
  examRepository,
  getCorrectionSheetPreset,
  saveCorrectionSheetPreset
} = useExamsBridge();

const exam = ref<Exams.Exam | null>(null);
const preset = ref<Exams.CorrectionSheetPreset>(createDefaultCorrectionSheetPreset('draft'));
const examDateValue = ref('');
const isEditing = computed(() => !!route.params.id);

const canSave = computed(() => {
  return Boolean(
    exam.value &&
    exam.value.title.trim().length > 0 &&
    exam.value.structure.tasks.length > 0 &&
    exam.value.candidates.length > 0 &&
    exam.value.candidates.every((candidate) => candidate.firstName.trim() && candidate.lastName.trim())
  );
});

const toDateInput = (value?: Date): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return date.toISOString().slice(0, 10);
};

const createEmptyExam = (): Exams.Exam => ({
  id: uuidv4(),
  title: '',
  mode: Exams.ExamMode.Simple,
  date: undefined,
  structure: {
    parts: [],
    tasks: [],
    allowsComments: false,
    allowsSupportTips: false,
    totalPoints: 0
  },
  gradingKey: {
    id: uuidv4(),
    name: 'Standard',
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
});

const handleModeChange = () => {
  if (!exam.value) return;
  if (exam.value.mode === Exams.ExamMode.Simple) {
    exam.value.structure.tasks.forEach((task) => {
      task.subtasks = [];
    });
  }
};

const addTask = () => {
  if (!exam.value) return;
  exam.value.structure.tasks.push({
    id: uuidv4(),
    level: 1,
    order: exam.value.structure.tasks.length,
    title: `Aufgabe ${exam.value.structure.tasks.length + 1}`,
    points: 0,
    isChoice: false,
    criteria: [],
    allowComments: exam.value.structure.allowsComments,
    allowSupportTips: exam.value.structure.allowsSupportTips,
    commentBoxEnabled: false,
    subtasks: []
  });
  updateTotalPoints();
};

const removeTask = (idx: number) => {
  if (!exam.value) return;
  exam.value.structure.tasks.splice(idx, 1);
  updateTotalPoints();
};

const addCriterion = (taskIdx: number) => {
  const task = exam.value?.structure.tasks[taskIdx];
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
  const task = exam.value?.structure.tasks[taskIdx];
  if (!task) return;
  task.criteria.splice(critIdx, 1);
};

const addSubtask = (taskIdx: number) => {
  const task = exam.value?.structure.tasks[taskIdx];
  if (!task) return;
  task.subtasks.push(uuidv4());
};

const removeSubtask = (taskIdx: number, subtaskIdx: number) => {
  const task = exam.value?.structure.tasks[taskIdx];
  if (!task) return;
  task.subtasks.splice(subtaskIdx, 1);
};

const addPart = () => {
  if (!exam.value) return;
  exam.value.structure.parts.push({
    id: uuidv4(),
    name: `Teil ${exam.value.structure.parts.length + 1}`,
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

const addCandidate = () => {
  if (!exam.value) return;
  exam.value.candidates.push({
    id: uuidv4(),
    examId: exam.value.id,
    firstName: '',
    lastName: '',
    externalId: ''
  });
};

const removeCandidate = (index: number) => {
  if (!exam.value) return;
  exam.value.candidates.splice(index, 1);
};

const updateTotalPoints = () => {
  if (!exam.value) return;
  exam.value.structure.totalPoints = exam.value.structure.tasks.reduce((sum, task) => sum + task.points, 0);
  exam.value.gradingKey.totalPoints = exam.value.structure.totalPoints;
};

async function persistExam(currentExam: Exams.Exam): Promise<Exams.Exam> {
  const nextExam: Exams.Exam = {
    ...currentExam,
    date: examDateValue.value ? new Date(`${examDateValue.value}T00:00:00`) : undefined
  };

  if (isEditing.value) {
    await examRepository?.update(nextExam.id, nextExam);
    return (await examRepository?.findById(nextExam.id)) ?? nextExam;
  }

  const { id: _id, createdAt: _createdAt, lastModified: _lastModified, ...createInput } = nextExam;
  const created = await examRepository?.create(createInput);
  if (!created) {
    throw new Error('Prüfung konnte nicht erstellt werden');
  }
  return created;
}

const saveExam = async () => {
  if (!exam.value || !canSave.value) return;

  try {
    const savedExam = await persistExam(exam.value);
    exam.value = {
      ...savedExam,
      candidates: savedExam.candidates.map((candidate) => ({
        ...candidate,
        examId: savedExam.id
      }))
    };

    await saveCorrectionSheetPreset?.({
      ...preset.value,
      examId: savedExam.id
    });

    router.push('/exams');
  } catch (error) {
    console.error('Failed to save exam:', error);
  }
};

const goBack = () => {
  router.push('/exams');
};

const openExportPage = () => {
  if (!exam.value) return;
  router.push(`/exams/${exam.value.id}/export`);
};

onMounted(async () => {
  if (isEditing.value) {
    const id = route.params.id as string;
    const loaded = await examRepository?.findById(id);
    if (loaded) {
      exam.value = loaded;
      examDateValue.value = toDateInput(loaded.date);
      preset.value = await getCorrectionSheetPreset?.(loaded.id) ?? createDefaultCorrectionSheetPreset(loaded.id);
      return;
    }
  }

  const draftExam = createEmptyExam();
  exam.value = draftExam;
  preset.value = createDefaultCorrectionSheetPreset(draftExam.id);
  examDateValue.value = '';
});
</script>

<style scoped src="./KBRExamBuilder.css"></style>
