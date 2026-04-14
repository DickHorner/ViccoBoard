<template>
  <div class="exam-builder-page">
    <div class="builder-header">
      <div>
        <h1>{{ isEditing ? 'Prüfung bearbeiten' : 'Prüfung erstellen' }}</h1>
        <p>{{ store.mode === 'simple' ? 'Einfach: flache Aufgabenliste' : 'Komplex: verschachtelte Aufgaben (3 Ebenen)' }}</p>
      </div>
      <div class="actions">
        <button v-if="store.examId" @click="openExportPage" class="btn-secondary">Export</button>
        <button @click="goBack" class="btn-secondary">Abbrechen</button>
        <button @click="saveExam" class="btn-primary" :disabled="!canSave">Prüfung speichern</button>
      </div>
    </div>

    <div v-if="!isLoading" class="builder-content">
      <section class="section">
        <h2>Prüfungsdetails</h2>
        <div class="form-group">
          <label>Prüfungstitel</label>
          <input v-model="store.title" type="text" placeholder="Prüfungstitel" />
        </div>
        <div class="form-group">
          <label>Beschreibung</label>
          <textarea v-model="store.description" placeholder="Optionale Prüfungsbeschreibung"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Prüfungsdatum</label>
            <input v-model="examDateValue" type="date" />
          </div>
          <div class="form-group">
            <label>Modus</label>
            <select v-model="store.mode" @change="handleModeChange">
              <option value="simple">Einfach (flach)</option>
              <option value="complex">Komplex (verschachtelt)</option>
            </select>
          </div>
          <div class="form-group checkbox">
            <input v-model="allowsComments" type="checkbox" />
            <label>Kommentare erlauben</label>
          </div>
          <div class="form-group checkbox">
            <input v-model="allowsSupportTips" type="checkbox" />
            <label>Fördertipps erlauben</label>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <h2>Kandidaten</h2>
          <button @click="addCandidate" class="btn-small">+ Kandidat hinzufügen</button>
        </div>

        <div v-if="candidates.length === 0" class="empty-state">
          Noch keine Kandidaten. Für die Korrektur und den PDF-Export wird mindestens ein Prüfling benötigt.
        </div>

        <div v-else class="candidate-list">
          <div v-for="(candidate, index) in candidates" :key="candidate.id" class="candidate-card">
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
          <button @click="store.addTask()" class="btn-small">+ Aufgabe hinzufügen</button>
        </div>

        <div v-if="store.tasks.length === 0" class="empty-state">
          Noch keine Aufgaben. Fügen Sie die erste Aufgabe hinzu.
        </div>

        <div v-else class="task-editor-list">
          <TaskEditor
            v-for="(task, index) in store.tasks"
            :key="task.id"
            :task="task"
            :index="index"
            :level="1"
            :mode="store.mode"
            :numbering-path="String(index + 1)"
            @remove="store.removeTask(task.id)"
            @moveUp="store.moveTask(store.tasks, index, -1)"
            @moveDown="store.moveTask(store.tasks, index, 1)"
          />
        </div>
      </section>

      <ExamParts />

      <section class="section">
        <CorrectionSheetPresetForm v-model="preset" />
      </section>

      <section class="section">
        <h2>Notenschlüssel</h2>
        <div class="form-group">
          <label>Schlüsseltyp</label>
          <select v-model="gradingKeyType">
            <option value="percentage">Prozent</option>
            <option value="points">Punkte</option>
            <option value="error-points">Fehlerpunkte</option>
          </select>
        </div>
        <div class="form-group">
          <label>Gesamtpunkte</label>
          <input :value="store.totalPoints" type="number" min="0" step="1" readonly />
        </div>
        <div class="form-group">
          <label>Rundung</label>
          <select v-model="roundingRuleType">
            <option value="up">Aufrunden</option>
            <option value="down">Abrunden</option>
            <option value="nearest">Kaufmännisch</option>
            <option value="none">Keine Rundung</option>
          </select>
        </div>
        <div v-if="gradeBoundaries.length > 0">
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
              <tr v-for="boundary in gradeBoundaries" :key="boundary.grade">
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
            <span class="value">{{ candidates.length }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Aufgaben gesamt</span>
            <span class="value">{{ store.flatTasks.length }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Punkte gesamt</span>
            <span class="value">{{ store.totalPoints }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Prüfungsteile</span>
            <span class="value">{{ store.parts.length }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Modus</span>
            <span class="value">{{ store.mode === 'simple' ? 'Einfach' : 'Komplex' }}</span>
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
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Exams } from '@viccoboard/core';
import { v4 as uuidv4 } from 'uuid';
import { createDefaultCorrectionSheetPreset } from '@viccoboard/exams';
import { useExamsBridge } from '../composables/useExamsBridge';
import { useExamBuilderStore } from '../stores/examBuilderStore';
import CorrectionSheetPresetForm from '../components/CorrectionSheetPresetForm.vue';
import TaskEditor from '../components/TaskEditor.vue';
import ExamParts from '../components/ExamParts.vue';

const router = useRouter();
const route = useRoute();
const store = useExamBuilderStore();
const { examRepository, getCorrectionSheetPreset, saveCorrectionSheetPreset } = useExamsBridge();

const candidates = ref<Exams.Candidate[]>([]);
const preset = ref<Exams.CorrectionSheetPreset>(createDefaultCorrectionSheetPreset('draft'));
const examDateValue = ref('');
const allowsComments = ref(false);
const allowsSupportTips = ref(false);
const gradingKeyType = ref<Exams.GradingKeyType>(Exams.GradingKeyType.Points);
const roundingRuleType = ref<Exams.RoundingRule['type']>('nearest');
const gradeBoundaries = ref<Exams.GradeBoundary[]>([]);
const examStatus = ref<Exams.Exam['status']>('draft');
const printPresets = ref<Exams.Exam['printPresets']>([]);
const isLoading = ref(true);

const isEditing = computed(() => !!route.params.id);

const canSave = computed(() => {
  return Boolean(
    store.canSave &&
    candidates.value.length > 0 &&
    candidates.value.every((candidate) => candidate.firstName.trim() && candidate.lastName.trim())
  );
});

const toDateInput = (value?: Date): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return date.toISOString().slice(0, 10);
};

const createDraftCandidate = (): Exams.Candidate => ({
  id: uuidv4(),
  examId: store.examId ?? 'draft',
  firstName: '',
  lastName: '',
  externalId: ''
});

const handleModeChange = () => {
  store.setMode(store.mode);
};

const addCandidate = () => {
  candidates.value.push(createDraftCandidate());
};

const removeCandidate = (index: number) => {
  candidates.value.splice(index, 1);
};

async function persistExam(): Promise<Exams.Exam> {
  const builtExam = store.buildExam();
  const examId = builtExam.id;
  const nextExam: Exams.Exam = {
    ...builtExam,
    date: examDateValue.value ? new Date(`${examDateValue.value}T00:00:00`) : undefined,
    structure: {
      ...builtExam.structure,
      allowsComments: allowsComments.value,
      allowsSupportTips: allowsSupportTips.value,
      totalPoints: store.totalPoints
    },
    gradingKey: {
      ...builtExam.gradingKey,
      type: gradingKeyType.value,
      totalPoints: store.totalPoints,
      gradeBoundaries: gradeBoundaries.value,
      roundingRule: {
        ...builtExam.gradingKey.roundingRule,
        type: roundingRuleType.value
      }
    },
    printPresets: printPresets.value,
    candidates: candidates.value.map((candidate) => ({
      ...candidate,
      examId
    })),
    status: examStatus.value
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
  if (!canSave.value) {
    return;
  }

  try {
    const savedExam = await persistExam();
    store.hydrateFromExam(savedExam);
    candidates.value = savedExam.candidates.map((candidate) => ({
      ...candidate,
      examId: savedExam.id
    }));
    examStatus.value = savedExam.status;
    printPresets.value = savedExam.printPresets;

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
  if (!store.examId) {
    return;
  }
  router.push(`/exams/${store.examId}/export`);
};

onMounted(async () => {
  store.reset();

  if (isEditing.value) {
    const id = route.params.id as string;
    const loaded = await examRepository?.findById(id);
    if (loaded) {
      store.hydrateFromExam(loaded);
      candidates.value = loaded.candidates.map((candidate) => ({
        ...candidate,
        examId: loaded.id
      }));
      examDateValue.value = toDateInput(loaded.date);
      allowsComments.value = loaded.structure.allowsComments;
      allowsSupportTips.value = loaded.structure.allowsSupportTips;
      gradingKeyType.value = loaded.gradingKey.type;
      roundingRuleType.value = loaded.gradingKey.roundingRule.type;
      gradeBoundaries.value = loaded.gradingKey.gradeBoundaries;
      examStatus.value = loaded.status;
      printPresets.value = loaded.printPresets;
      preset.value = await getCorrectionSheetPreset?.(loaded.id) ?? createDefaultCorrectionSheetPreset(loaded.id);
      isLoading.value = false;
      return;
    }
  }

  preset.value = createDefaultCorrectionSheetPreset('draft');
  examDateValue.value = '';
  allowsComments.value = false;
  allowsSupportTips.value = false;
  gradingKeyType.value = Exams.GradingKeyType.Points;
  roundingRuleType.value = 'nearest';
  gradeBoundaries.value = [];
  examStatus.value = 'draft';
  printPresets.value = [];
  candidates.value = [];
  isLoading.value = false;
});

onUnmounted(() => {
  store.reset();
});
</script>

<style scoped src="./KBRExamBuilder.css"></style>
