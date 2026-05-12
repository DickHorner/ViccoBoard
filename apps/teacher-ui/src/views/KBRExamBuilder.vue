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
            <select v-model="store.assessmentFormat">
              <option v-for="format in assessmentFormats" :key="format.value" :value="format.value">
                {{ format.label }}
              </option>
            </select>
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
            <p v-else>Wählen Sie oben eine Klasse aus, um Schüler oder komplette Klassen zu übernehmen.</p>
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
          Noch keine Kandidaten. Für die Korrektur und den PDF-Export wird mindestens ein Prüfling benötigt.
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
          <h2>Aufgabensammlung</h2>
          <span class="collection-count">{{ filteredReusableTasks.length }} Aufgaben</span>
        </div>

        <div class="collection-filters">
          <div class="form-group">
            <label>Fach</label>
            <select v-model="taskCollectionSubject">
              <option value="">Alle Fächer</option>
              <option v-for="subject in taskCollectionSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Klassenstufe</label>
            <select v-model="taskCollectionGradeLevel">
              <option value="">Alle Klassenstufen</option>
              <option v-for="gradeLevel in taskCollectionGradeLevels" :key="gradeLevel" :value="gradeLevel">
                {{ gradeLevel }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Suche</label>
            <input v-model="taskCollectionQuery" type="text" placeholder="Titel oder Kriterien" />
          </div>
        </div>

        <div v-if="taskCollectionLoading" class="empty-state">
          Aufgabensammlung wird geladen...
        </div>
        <div v-else-if="filteredReusableTasks.length === 0" class="empty-state">
          Keine passenden Aufgaben in der Sammlung.
        </div>
        <div v-else class="task-collection-list">
          <article
            v-for="entry in filteredReusableTasks"
            :key="`${entry.examId}-${entry.task.id}`"
            class="task-collection-card"
          >
            <div class="task-collection-main">
              <h3>{{ entry.task.title }}</h3>
              <div class="task-collection-meta">
                <span>{{ entry.task.points }} Punkte</span>
                <span v-if="entry.task.bonusPoints">{{ entry.task.bonusPoints }} Bonuspunkte</span>
                <span v-if="entry.task.subject">{{ entry.task.subject }}</span>
                <span v-if="entry.task.gradeLevel">Klasse {{ entry.task.gradeLevel }}</span>
                <span>{{ entry.examTitle }}</span>
              </div>
              <p v-if="entry.task.criteria.length > 0" class="task-collection-criteria">
                {{ entry.task.criteria.map((criterion) => criterion.text).join(' · ') }}
              </p>
              <small v-if="entry.childTasks.length > 0">
                {{ entry.childTasks.length }} Teilaufgaben
              </small>
            </div>
            <button class="btn-secondary-small" type="button" @click="insertReusableTask(entry)">
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
import { useExamBuilderStore } from '../stores/examBuilderStore';
import {
  cloneTaskDraftFromNode,
  collectReusableTasks,
  filterReusableTasks,
  type ReusableTaskEntry
} from '../utils/task-collection';
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
const allowsComments = ref(false);
const allowsSupportTips = ref(false);
const gradingKeyType = ref<Exams.GradingKeyType>(Exams.GradingKeyType.Points);
const roundingRuleType = ref<Exams.RoundingRule['type']>('nearest');
const gradeBoundaries = ref<Exams.GradeBoundary[]>([]);
const examStatus = ref<Exams.Exam['status']>('draft');
const printPresets = ref<Exams.Exam['printPresets']>([]);
const isLoading = ref(true);
const taskCollectionLoading = ref(false);
const reusableTaskEntries = ref<ReusableTaskEntry[]>([]);
const taskCollectionSubject = ref('');
const taskCollectionGradeLevel = ref('');
const taskCollectionQuery = ref('');

const assessmentFormats: Array<{ value: Exams.ExamAssessmentFormat; label: string }> = [
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

const isEditing = computed(() => !!route.params.id);
const selectedClassLabel = computed(() => {
  const classGroup = classGroups.value.find((entry) => entry.id === store.classGroupId);
  return classGroup ? `${classGroup.name} (${classGroup.schoolYear})` : 'keine Klasse';
});
const selectedAssessmentFormatLabel = computed(() =>
  assessmentFormats.find((format) => format.value === store.assessmentFormat)?.label ?? 'Klausur'
);
const selectedGradingPresetDescription = computed(() =>
  gradingPresets.find((presetOption: Exams.GradingPreset) => presetOption.id === selectedGradingPresetId.value)?.description ?? ''
);
const availableImportStudents = computed(() => {
  const existingStudentIds = new Set(
    candidates.value.map((candidate) => candidate.studentId).filter((studentId): studentId is string => Boolean(studentId))
  );
  return classStudents.value.filter((student) => !existingStudentIds.has(student.id));
});
const filteredReusableTasks = computed(() =>
  filterReusableTasks(reusableTaskEntries.value, {
    subject: taskCollectionSubject.value,
    gradeLevel: taskCollectionGradeLevel.value,
    query: taskCollectionQuery.value
  })
);
const taskCollectionSubjects = computed(() =>
  Array.from(new Set(
    reusableTaskEntries.value
      .map((entry) => entry.task.subject?.trim())
      .filter((subject): subject is string => Boolean(subject))
  )).sort((a, b) => a.localeCompare(b, 'de'))
);
const taskCollectionGradeLevels = computed(() =>
  Array.from(new Set(
    reusableTaskEntries.value
      .map((entry) => entry.task.gradeLevel?.trim())
      .filter((gradeLevel): gradeLevel is string => Boolean(gradeLevel))
  )).sort((a, b) => a.localeCompare(b, 'de', { numeric: true }))
);

const canSave = computed(() => {
  const hasValidCandidates = candidates.value.every((candidate) => candidate.firstName.trim() && candidate.lastName.trim());
  const hasValidGroups = candidates.value.length === 0 || store.assessmentFormat !== 'gruppenarbeit' || store.candidateGroups.every((group: Exams.CandidateGroup) =>
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

const loadReusableTasks = async () => {
  taskCollectionLoading.value = true;
  try {
    const exams = await examRepository?.findAll() ?? [];
    reusableTaskEntries.value = collectReusableTasks(exams);
  } finally {
    taskCollectionLoading.value = false;
  }
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

const insertReusableTask = (entry: ReusableTaskEntry) => {
  store.tasks.push(cloneTaskDraftFromNode(entry.task, entry.childTasks, uuidv4));
  store.recalculateTaskPoints();
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
  store.reset();
  await Promise.all([loadClassGroups(), loadReusableTasks()]);

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
