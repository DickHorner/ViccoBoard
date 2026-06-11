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
            <label>Klasse</label>
            <select v-model="store.classGroupId">
              <option value="">Keine Klasse zugeordnet</option>
              <option v-for="classGroup in classGroups" :key="classGroup.id" :value="classGroup.id">
                {{ classGroup.name }} ({{ classGroup.schoolYear }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Format</label>
            <div class="format-select-row">
              <select v-model="store.assessmentFormat">
                <option v-for="format in assessmentFormatOptions" :key="format.value" :value="format.value">
                  {{ format.label }}
                </option>
              </select>
              <button type="button" class="btn-secondary-small" @click="toggleFormatEditor">
                {{ showFormatEditor ? 'Schließen' : 'Bearbeiten' }}
              </button>
            </div>
          </div>
          <div v-if="showFormatEditor" class="format-editor">
            <div class="format-editor-list">
              <div v-for="format in assessmentFormatOptions" :key="format.value" class="format-editor-item">
                <input
                  v-if="format.custom"
                  class="format-editor-name"
                  :value="format.label"
                  type="text"
                  maxlength="80"
                  @change="updateCustomAssessmentFormatLabel(format.value, ($event.target as HTMLInputElement).value)"
                  @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
                />
                <span v-else>{{ format.label }}</span>
                <button
                  v-if="format.custom"
                  type="button"
                  class="btn-danger-small"
                  @click="removeCustomAssessmentFormat(format.value)"
                >
                  Entfernen
                </button>
              </div>
            </div>
            <form class="format-editor-add" @submit.prevent="addCustomAssessmentFormat">
              <input
                v-model="newAssessmentFormatLabel"
                type="text"
                placeholder="Neues Format"
                maxlength="80"
              />
              <button type="submit" class="btn-small" :disabled="!newAssessmentFormatLabel.trim()">Hinzufügen</button>
            </form>
          </div>
          <div v-else-if="isSelectedFormatMissing" class="format-missing">
            <span>{{ selectedAssessmentFormatLabel }}</span>
            <button type="button" class="btn-secondary-small" @click="restoreSelectedAssessmentFormat">
              Wieder hinzufügen
            </button>
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
          <button @click="addCandidate" class="btn-small">+ Kandidat manuell hinzufügen</button>
        </div>

        <div class="import-panel">
          <div>
            <strong>Zentrale Schülerdatenbank</strong>
            <p v-if="store.classGroupId">
              {{ classStudents.length }} Schüler in {{ selectedClassLabel }}
            </p>
            <p v-else>Optional: Wählen Sie eine Klasse aus, um Schüler oder komplette Klassen zu übernehmen.</p>
          </div>
          <div class="import-actions">
            <button
              class="btn-secondary-small"
              @click="importWholeClass"
              :disabled="!store.classGroupId || classStudents.length === 0"
            >
              Ganze Klasse übernehmen
            </button>
            <button
              class="btn-secondary-small"
              @click="importSelectedStudents"
              :disabled="selectedStudentIds.length === 0"
            >
              Auswahl übernehmen
            </button>
          </div>
        </div>

        <div v-if="availableImportStudents.length > 0" class="student-import-list">
          <label
            v-for="student in availableImportStudents"
            :key="student.id"
            class="student-import-item"
          >
            <input v-model="selectedStudentIds" type="checkbox" :value="student.id" />
            <span>{{ student.firstName }} {{ student.lastName }}</span>
            <small>{{ student.dateOfBirth ? formatGermanDateOfBirth(student.dateOfBirth) : 'Geburtsdatum fehlt' }}</small>
          </label>
        </div>
        <div v-else-if="store.classGroupId" class="empty-state">
          Alle Schüler der gewählten Klasse sind bereits als Prüflinge angelegt.
        </div>

        <div v-if="candidates.length === 0" class="empty-state">
          Noch keine Kandidaten. Die Prüfung kann als Vorlage gespeichert werden; für Korrektur und PDF-Export fügen Sie später Prüflinge hinzu.
        </div>

        <div v-else class="candidate-list">
          <div v-for="(candidate, index) in candidates" :key="candidate.id" class="candidate-card">
            <div class="candidate-card-header">
              <strong>{{ candidate.firstName || 'Neuer' }} {{ candidate.lastName || 'Prüfling' }}</strong>
              <small v-if="candidate.studentId">Aus Schülerdatenbank verknüpft</small>
            </div>
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

      <section v-if="store.assessmentFormat === 'gruppenarbeit'" class="section">
        <div class="section-header">
          <h2>Gruppenarbeiten</h2>
          <button @click="addCandidateGroup" class="btn-small">+ Gruppe hinzufügen</button>
        </div>

        <div v-if="store.candidateGroups.length === 0" class="empty-state">
          Legen Sie Gruppen an und ordnen Sie den Prüflingen ihre Gruppenarbeit zu.
        </div>

        <div v-else class="group-list">
          <div v-for="(group, index) in store.candidateGroups" :key="group.id" class="group-card">
            <div class="form-row">
              <div class="form-group">
                <label>Gruppenname</label>
                <input v-model="group.name" type="text" :placeholder="`Gruppe ${index + 1}`" />
              </div>
              <div class="form-group">
                <label>Thema</label>
                <input v-model="group.topic" type="text" placeholder="Thema oder Auftrag" />
              </div>
            </div>
            <div class="form-group">
              <label>Mitglieder</label>
              <div class="student-import-list compact">
                <label
                  v-for="candidate in candidates"
                  :key="`${group.id}-${candidate.id}`"
                  class="student-import-item"
                >
                  <input v-model="group.memberCandidateIds" type="checkbox" :value="candidate.id" />
                  <span>{{ candidate.firstName }} {{ candidate.lastName }}</span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label>Notizen</label>
              <textarea v-model="group.notes" placeholder="Optionale Hinweise zur Gruppenarbeit"></textarea>
            </div>
            <button @click="removeCandidateGroup(index)" class="btn-danger-small">Gruppe entfernen</button>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <div>
            <h2>Aufgabensammlung</h2>
            <p class="section-subtitle">
              Wiederverwendbare Aufgaben aus bestehenden Prüfungen übernehmen.
            </p>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="task-library-subject">Fach</label>
            <select id="task-library-subject" v-model="reusableTaskSubjectFilter">
              <option value="">Alle Fächer</option>
              <option
                v-for="subject in reusableTaskSubjects"
                :key="subject"
                :value="subject"
              >
                {{ subject }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="task-library-grade-level">Klassenstufe</label>
            <select id="task-library-grade-level" v-model="reusableTaskGradeLevelFilter">
              <option value="">Alle Klassenstufen</option>
              <option
                v-for="gradeLevel in reusableTaskGradeLevels"
                :key="gradeLevel"
                :value="gradeLevel"
              >
                {{ gradeLevel }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="task-library-search">Suche</label>
            <input
              id="task-library-search"
              v-model="reusableTaskQuery"
              type="text"
              placeholder="Titel oder Kriterien durchsuchen"
            />
          </div>
        </div>

        <div v-if="filteredReusableTasks.length === 0" class="empty-state">
          Noch keine passenden Aufgaben in der Sammlung.
        </div>

        <div v-else class="task-library-list">
          <article
            v-for="item in filteredReusableTasks"
            :key="item.id"
            class="task-library-card"
          >
            <div class="task-library-card-header">
              <div>
                <h3>{{ item.title || 'Ohne Titel' }}</h3>
                <p class="task-library-origin">Aus: {{ item.sourceExamTitle }}</p>
              </div>
              <span class="task-library-points">{{ item.points }} Punkte</span>
            </div>

            <div class="task-library-meta">
              <span v-if="item.subject">Fach: {{ item.subject }}</span>
              <span v-if="item.gradeLevel">Klassenstufe: {{ item.gradeLevel }}</span>
              <span v-if="item.task.children.length > 0">
                {{ item.task.children.length }} Teilaufgaben
              </span>
            </div>

            <p v-if="item.criteriaSummary" class="task-library-criteria">
              {{ item.criteriaSummary }}
            </p>

            <button
              class="btn-secondary-small"
              type="button"
              :disabled="!store.canInsertReusableTask(item)"
              :title="store.canInsertReusableTask(item) ? 'Aufgabe in die aktuelle Prüfung übernehmen' : 'Im einfachen Modus können nur Aufgaben ohne Teilaufgaben übernommen werden.'"
              @click="store.insertReusableTask(item)"
            >
              In Prüfung übernehmen
            </button>
          </article>
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
        <div class="form-row">
          <div class="form-group">
            <label>Vorgabe</label>
            <select v-model="selectedGradingPresetId" @change="applySelectedGradingPreset">
              <option value="">Keine Vorgabe</option>
              <option v-for="presetOption in gradingPresets" :key="presetOption.id" :value="presetOption.id">
                {{ presetOption.name }}
              </option>
            </select>
          </div>
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
        </div>
        <div v-if="selectedGradingPresetDescription" class="grading-preset-hint">
          {{ selectedGradingPresetDescription }}
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
            <span class="label">Gruppen</span>
            <span class="value">{{ store.candidateGroups.length }}</span>
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
            <span class="label">Format</span>
            <span class="value">{{ selectedAssessmentFormatLabel }}</span>
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Exams, type ClassGroup, type Student } from '@viccoboard/core';
import {
  KBR_GRADING_PRESETS,
  GradingKeyService,
  createDefaultCorrectionSheetPreset
} from '@viccoboard/exams';
import { createUuid as uuidv4 } from '@/utils/uuid';
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge';
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge';
import { useExamsBridge } from '../composables/useExamsBridge';
import {
  filterReusableTasks,
  useExamBuilderStore
} from '../stores/examBuilderStore';
import {
  createCandidateGroup,
  mapStudentToExamCandidate,
  mergeImportedCandidates,
  synchronizeCandidateGroups
} from '../utils/exam-candidates';
import { formatGermanDateOfBirth } from '../utils/locale-format';
import CorrectionSheetPresetForm from '../components/CorrectionSheetPresetForm.vue';
import TaskEditor from '../components/TaskEditor.vue';
import ExamParts from '../components/ExamParts.vue';

const router = useRouter();
const route = useRoute();
const store = useExamBuilderStore();

initializeSportBridge();
initializeStudentsBridge();

const sportBridge = getSportBridge();
const studentsBridge = getStudentsBridge();
const { examRepository, getCorrectionSheetPreset, saveCorrectionSheetPreset } = useExamsBridge();

const classGroups = ref<ClassGroup[]>([]);
const classStudents = ref<Student[]>([]);
const selectedStudentIds = ref<string[]>([]);
const candidates = ref<Exams.Candidate[]>([]);
const gradingPresets = KBR_GRADING_PRESETS;
const selectedGradingPresetId = ref('');
const preset = ref<Exams.CorrectionSheetPreset>(createDefaultCorrectionSheetPreset('draft'));
const examDateValue = ref('');
const reusableTaskSubjectFilter = ref('');
const reusableTaskGradeLevelFilter = ref('');
const reusableTaskQuery = ref('');
const allowsComments = ref(false);
const allowsSupportTips = ref(false);
const gradingKeyType = ref<Exams.GradingKeyType>(Exams.GradingKeyType.Points);
const roundingRuleType = ref<Exams.RoundingRule['type']>('nearest');
const gradeBoundaries = ref<Exams.GradeBoundary[]>([]);
const examStatus = ref<Exams.Exam['status']>('draft');
const printPresets = ref<Exams.Exam['printPresets']>([]);
const isLoading = ref(true);
const showFormatEditor = ref(false);
const newAssessmentFormatLabel = ref('');

type AssessmentFormatOption = {
  value: Exams.ExamAssessmentFormat;
  label: string;
  custom?: boolean;
};

const assessmentFormatStorageKey = 'viccoboard:kbr-assessment-formats';
const defaultAssessmentFormats: AssessmentFormatOption[] = [
  { value: 'klausur', label: 'Klausur' },
  { value: 'test', label: 'Test' },
  { value: 'mappenkorrektur', label: 'Mappenkorrektur' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'referat', label: 'Referat' },
  { value: 'referatsrueckmeldung', label: 'Referatsrückmeldung' },
  { value: 'facharbeit', label: 'Facharbeit' },
  { value: 'muendliche-pruefung', label: 'Mündliche Prüfung' },
  { value: 'gruppenarbeit', label: 'Gruppenarbeit' }
];
const customAssessmentFormats = ref<AssessmentFormatOption[]>([]);

const isEditing = computed(() => !!route.params.id);
const selectedClassLabel = computed(() => {
  const classGroup = classGroups.value.find((entry) => entry.id === store.classGroupId);
  return classGroup ? `${classGroup.name} (${classGroup.schoolYear})` : 'keine Klasse';
});
const assessmentFormatOptions = computed<AssessmentFormatOption[]>(() => {
  const options = [...defaultAssessmentFormats];
  for (const customFormat of customAssessmentFormats.value) {
    if (!options.some((format) => format.value === customFormat.value)) {
      options.push(customFormat);
    }
  }

  if (
    store.assessmentFormat &&
    !options.some((format) => format.value === store.assessmentFormat)
  ) {
    options.push({
      value: store.assessmentFormat,
      label: store.assessmentFormat,
      custom: true
    });
  }

  return options;
});
const selectedAssessmentFormatLabel = computed(() =>
  assessmentFormatOptions.value.find((format) => format.value === store.assessmentFormat)?.label ?? store.assessmentFormat
);
const isSelectedFormatMissing = computed(() =>
  Boolean(store.assessmentFormat) &&
  !defaultAssessmentFormats.some((format) => format.value === store.assessmentFormat) &&
  !customAssessmentFormats.value.some((format) => format.value === store.assessmentFormat)
);
const selectedGradingPresetDescription = computed(() =>
  gradingPresets.find((presetOption: Exams.GradingPreset) => presetOption.id === selectedGradingPresetId.value)?.description ?? ''
);
const reusableTaskSubjects = computed(() =>
  [...new Set(
    store.reusableTaskLibrary
      .map((item) => item.subject.trim())
      .filter((subject) => subject.length > 0)
  )].sort((a, b) => a.localeCompare(b, 'de'))
);
const reusableTaskGradeLevels = computed(() =>
  [...new Set(
    store.reusableTaskLibrary
      .map((item) => item.gradeLevel.trim())
      .filter((gradeLevel) => gradeLevel.length > 0)
  )].sort((a, b) => a.localeCompare(b, 'de'))
);
const filteredReusableTasks = computed(() =>
  filterReusableTasks(store.reusableTaskLibrary, {
    subject: reusableTaskSubjectFilter.value,
    gradeLevel: reusableTaskGradeLevelFilter.value,
    query: reusableTaskQuery.value
  })
);
const availableImportStudents = computed(() => {
  const existingStudentIds = new Set(
    candidates.value.map((candidate) => candidate.studentId).filter((studentId): studentId is string => Boolean(studentId))
  );
  return classStudents.value.filter((student) => !existingStudentIds.has(student.id));
});

const canSave = computed(() => {
  const hasValidCandidates = candidates.value.every((candidate) =>
    candidate.firstName.trim() && candidate.lastName.trim()
  );
  const hasValidGroups = candidates.value.length === 0 ||
    store.assessmentFormat !== 'gruppenarbeit' ||
    store.candidateGroups.every((group: Exams.CandidateGroup) =>
      group.name.trim().length > 0 && group.memberCandidateIds.length > 0
    );

  return Boolean(store.canSave && hasValidCandidates && hasValidGroups);
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

const matchPresetByBoundaries = (boundaries: Exams.GradeBoundary[]): string => {
  const serializedBoundaries = JSON.stringify(
    boundaries.map((boundary: Exams.GradeBoundary) => ({
      grade: boundary.grade,
      minPercentage: boundary.minPercentage,
      maxPercentage: boundary.maxPercentage,
      displayValue: boundary.displayValue
    }))
  );

  return gradingPresets.find((presetOption: Exams.GradingPreset) =>
    JSON.stringify(
      presetOption.boundaries.map((boundary: Exams.GradeBoundary) => ({
        grade: boundary.grade,
        minPercentage: boundary.minPercentage,
        maxPercentage: boundary.maxPercentage,
        displayValue: boundary.displayValue
      }))
    ) === serializedBoundaries
  )?.id ?? '';
};

const syncGroupAssignments = () => {
  if (store.assessmentFormat !== 'gruppenarbeit') {
    store.candidateGroups = [];
    return;
  }

  store.candidateGroups = synchronizeCandidateGroups(store.candidateGroups, candidates.value);
};

const normalizeAssessmentFormatValue = (label: string): Exams.ExamAssessmentFormat => {
  const normalized = label
    .trim()
    .toLocaleLowerCase('de-DE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `custom-${normalized || Date.now()}` as Exams.ExamAssessmentFormat;
};

const persistCustomAssessmentFormats = () => {
  window.localStorage.setItem(
    assessmentFormatStorageKey,
    JSON.stringify(customAssessmentFormats.value)
  );
};

const loadCustomAssessmentFormats = () => {
  const serialized = window.localStorage.getItem(assessmentFormatStorageKey);
  if (!serialized) {
    customAssessmentFormats.value = [];
    return;
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      customAssessmentFormats.value = [];
      return;
    }

    customAssessmentFormats.value = parsed
      .filter((format): format is AssessmentFormatOption =>
        typeof format?.value === 'string' &&
        typeof format?.label === 'string' &&
        format.value.trim().length > 0 &&
        format.label.trim().length > 0
      )
      .map((format) => ({
        value: format.value,
        label: format.label.trim(),
        custom: true
      }));
  } catch {
    customAssessmentFormats.value = [];
  }
};

const toggleFormatEditor = () => {
  showFormatEditor.value = !showFormatEditor.value;
};

const addCustomAssessmentFormat = () => {
  const label = newAssessmentFormatLabel.value.trim();
  if (!label) {
    return;
  }

  const existing = assessmentFormatOptions.value.find((format) =>
    format.label.localeCompare(label, 'de', { sensitivity: 'accent' }) === 0
  );
  if (existing) {
    store.assessmentFormat = existing.value;
    newAssessmentFormatLabel.value = '';
    return;
  }

  let value = normalizeAssessmentFormatValue(label);
  let suffix = 2;
  while (assessmentFormatOptions.value.some((format) => format.value === value)) {
    value = `${normalizeAssessmentFormatValue(label)}-${suffix}` as Exams.ExamAssessmentFormat;
    suffix += 1;
  }

  const format = { value, label, custom: true };
  customAssessmentFormats.value.push(format);
  store.assessmentFormat = value;
  newAssessmentFormatLabel.value = '';
  persistCustomAssessmentFormats();
};

const removeCustomAssessmentFormat = (value: Exams.ExamAssessmentFormat) => {
  customAssessmentFormats.value = customAssessmentFormats.value.filter((format) => format.value !== value);
  if (store.assessmentFormat === value) {
    store.assessmentFormat = 'klausur';
  }
  persistCustomAssessmentFormats();
};

const updateCustomAssessmentFormatLabel = (value: Exams.ExamAssessmentFormat, nextLabel: string) => {
  const label = nextLabel.trim();
  const format = customAssessmentFormats.value.find((entry) => entry.value === value);
  if (!format) {
    return;
  }

  if (!label) {
    return;
  }

  const duplicate = assessmentFormatOptions.value.some((entry) =>
    entry.value !== value &&
    entry.label.localeCompare(label, 'de', { sensitivity: 'accent' }) === 0
  );
  if (duplicate) {
    return;
  }

  format.label = label;
  persistCustomAssessmentFormats();
};

const restoreSelectedAssessmentFormat = () => {
  if (!store.assessmentFormat) {
    return;
  }

  customAssessmentFormats.value.push({
    value: store.assessmentFormat,
    label: selectedAssessmentFormatLabel.value,
    custom: true
  });
  persistCustomAssessmentFormats();
  showFormatEditor.value = true;
};

const loadClassGroups = async () => {
  classGroups.value = await sportBridge.classGroupRepository.findAll();
};

const loadStudentsForSelectedClass = async () => {
  selectedStudentIds.value = [];

  if (!store.classGroupId) {
    classStudents.value = [];
    return;
  }

  classStudents.value = await studentsBridge.studentRepository.findByClassGroup(store.classGroupId);
};

const handleModeChange = () => {
  store.setMode(store.mode);
};

const addCandidate = () => {
  candidates.value.push(createDraftCandidate());
  syncGroupAssignments();
};

const removeCandidate = (index: number) => {
  candidates.value.splice(index, 1);
  syncGroupAssignments();
};

const importStudents = (studentsToImport: Student[]) => {
  const mappedCandidates = studentsToImport.map((student) =>
    mapStudentToExamCandidate(student, store.examId ?? 'draft')
  );
  candidates.value = mergeImportedCandidates(candidates.value, mappedCandidates).map((candidate) => ({
    ...candidate,
    examId: store.examId ?? 'draft'
  }));
  selectedStudentIds.value = [];
  syncGroupAssignments();
};

const importWholeClass = () => {
  importStudents(availableImportStudents.value);
};

const importSelectedStudents = () => {
  const selectedStudents = availableImportStudents.value.filter((student) =>
    selectedStudentIds.value.includes(student.id)
  );
  importStudents(selectedStudents);
};

const addCandidateGroup = () => {
  store.candidateGroups.push(createCandidateGroup(`Gruppe ${store.candidateGroups.length + 1}`));
};

const removeCandidateGroup = (index: number) => {
  store.candidateGroups.splice(index, 1);
};

const applySelectedGradingPreset = () => {
  const selectedPreset = gradingPresets.find((presetOption: Exams.GradingPreset) => presetOption.id === selectedGradingPresetId.value);
  if (!selectedPreset) {
    return;
  }

  gradeBoundaries.value = GradingKeyService.generatePercentageBoundaries(selectedPreset);
  gradingKeyType.value = Exams.GradingKeyType.Percentage;
  roundingRuleType.value = selectedPreset.defaultRounding.type;
};

async function persistExam(): Promise<Exams.Exam> {
  syncGroupAssignments();

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
    candidateGroups: store.assessmentFormat === 'gruppenarbeit'
      ? synchronizeCandidateGroups(store.candidateGroups, candidates.value)
      : [],
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
    selectedGradingPresetId.value = matchPresetByBoundaries(savedExam.gradingKey.gradeBoundaries);

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

watch(() => store.classGroupId, async () => {
  await loadStudentsForSelectedClass();
});

watch(() => store.assessmentFormat, () => {
  syncGroupAssignments();
});

watch(candidates, () => {
  syncGroupAssignments();
}, { deep: true });

onMounted(async () => {
  loadCustomAssessmentFormats();
  store.reset();
  await loadClassGroups();
  await store.loadReusableTasks();

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
      selectedGradingPresetId.value = matchPresetByBoundaries(loaded.gradingKey.gradeBoundaries);
      examStatus.value = loaded.status;
      printPresets.value = loaded.printPresets;
      preset.value = await getCorrectionSheetPreset?.(loaded.id) ?? createDefaultCorrectionSheetPreset(loaded.id);
      await loadStudentsForSelectedClass();
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
  selectedGradingPresetId.value = '';
  examStatus.value = 'draft';
  printPresets.value = [];
  candidates.value = [];
  await loadStudentsForSelectedClass();
  isLoading.value = false;
});

onUnmounted(() => {
  store.reset();
});
</script>

<style scoped src="./KBRExamBuilder.css"></style>
