<template>
  <div class="correction-container">
    <div class="correction-header">
      <div class="header-info">
        <h1>{{ exam?.title || 'Prüfungskorrektur' }}</h1>
        <p v-if="exam" class="exam-meta">
          {{ candidates.length }} Prüflinge | Gesamt: {{ exam.gradingKey.totalPoints }} Punkte
        </p>
      </div>
      <div class="header-actions">
        <button @click="saveCurrentCandidate(false)" class="btn-primary" :disabled="!hasChanges || !currentCandidate">
          {{ hasChanges ? 'Aktuellen Stand speichern' : 'Alles gespeichert' }}
        </button>
        <button @click="openExportPage" class="btn-secondary" :disabled="!exam">Export</button>
        <button @click="goBack" class="btn-secondary">Zurück zu den Prüfungen</button>
      </div>
    </div>

    <div v-if="loadError" class="no-candidate">{{ loadError }}</div>

    <div v-else-if="exam" class="correction-layout">
      <div class="candidates-sidebar">
        <div class="sidebar-header">
          <h3>Schüler ({{ candidates.length }})</h3>
          <input
            v-model="candidateFilter"
            type="text"
            placeholder="Suchen..."
            class="filter-input"
          />
        </div>
        <div v-if="filteredCandidates.length === 0" class="no-candidate">
          Keine passenden Prüflinge.
        </div>
        <div v-else class="candidates-list">
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

      <div class="correction-panel">
        <div v-if="currentCandidate && exam" class="correction-form">
          <div class="candidate-header">
            <h2>{{ currentCandidate.firstName }} {{ currentCandidate.lastName }}</h2>
            <span class="status" :class="`status-${currentCorrectionStatus}`">
              {{ formatCorrectionStatus(currentCorrectionStatus) }}
            </span>
          </div>

          <div class="scoring-mode-section">
            <h3>Bewertungsmodus</h3>
            <div class="mode-selector">
              <label class="mode-option">
                <input
                  v-model="scoringMode"
                  type="radio"
                  value="numeric"
                  @change="onScoringModeChange"
                />
                <span>Numerische Punkte</span>
              </label>
              <label class="mode-option">
                <input
                  v-model="scoringMode"
                  type="radio"
                  value="alternative"
                  @change="onScoringModeChange"
                />
                <span>Alternative Bewertung (++/+/0/-/--)</span>
              </label>
            </div>
          </div>

          <div class="scoring-section">
            <h3>Aufgabenbewertung</h3>
            <div v-for="task in exam.structure.tasks" :key="task.id" class="task-scoring">
              <div class="task-title">
                <label>{{ task.title }}</label>
                <span class="max-points">(max. {{ task.points }})</span>
              </div>

              <div v-if="scoringMode === 'numeric'" class="score-input-group">
                <input
                  v-model.number="taskScores[task.id]"
                  type="number"
                  min="0"
                  :max="task.points"
                  step="0.5"
                  class="score-input"
                  @input="markDirty"
                />
                <span class="points-to-next">
                  {{ pointsToNextGrade }} Punkte bis zur nächsten Notenstufe
                </span>
              </div>

              <div v-else class="alternative-score-group">
                <div class="grade-buttons">
                  <button
                    v-for="grade in alternativeGrades"
                    :key="grade.type"
                    :class="['grade-btn', { active: taskAlternativeGrades[task.id] === grade.type }]"
                    :style="{ backgroundColor: grade.backgroundColor }"
                    :title="grade.title"
                    @click="setAlternativeGrade(task.id, grade.type)"
                  >
                    {{ grade.label }}
                  </button>
                </div>
                <div v-if="taskAlternativeGrades[task.id]" class="selected-grade-info">
                  <span class="grade-label">{{ getGradeLabel(taskAlternativeGrades[task.id]) }}</span>
                  <span class="grade-points">(≈ {{ getAlternativeGradePoints(task.id, task.points) }} Punkte)</span>
                </div>
              </div>

              <div v-if="exam.structure.allowsComments" class="comment-box">
                <textarea
                  v-model="taskComments[task.id]"
                  :placeholder="`Kommentar zu ${task.title}...`"
                  class="comment-input"
                  rows="2"
                  @input="markDirty"
                ></textarea>
              </div>
            </div>
          </div>

          <div class="total-score-section">
            <div class="score-display">
              <div class="score-item">
                <label>Gesamtpunkte</label>
                <span class="score-value">{{ totalPoints }}/{{ exam.gradingKey.totalPoints }}</span>
              </div>
              <div class="score-item">
                <label>Prozent</label>
                <span class="score-value">{{ percentageScore.toFixed(1) }}%</span>
              </div>
              <div class="score-item highlight">
                <label>Note</label>
                <span class="grade-value">{{ currentGrade }}</span>
              </div>
            </div>
          </div>

          <div class="comment-box">
            <label>Allgemeiner Endkommentar</label>
            <textarea
              v-model="generalComment"
              class="comment-input"
              rows="4"
              placeholder="Zusammenfassende Rückmeldung für den Prüfling..."
              @input="markDirty"
            ></textarea>
          </div>

          <div class="nav-buttons">
            <button
              v-if="currentCandidateIndex > 0"
              @click="selectCandidate(candidates[currentCandidateIndex - 1])"
              class="btn-nav"
            >
              ← Vorherige
            </button>
            <button
              v-if="currentCandidateIndex < candidates.length - 1"
              @click="selectCandidate(candidates[currentCandidateIndex + 1])"
              class="btn-nav"
            >
              Nächste →
            </button>
          </div>

          <div class="action-buttons">
            <button @click="openPreviewForCurrentCandidate" class="btn-secondary">
              Bogenvorschau
            </button>
            <button @click="exportCurrentCandidate" class="btn-secondary">
              Aktuellen Bogen exportieren
            </button>
            <button @click="exportAllCandidates" class="btn-secondary">
              Alle Bögen exportieren
            </button>
            <button @click="saveCurrentCandidate(false)" class="btn-primary">
              Speichern
            </button>
            <button @click="saveCurrentCandidate(true)" class="btn-success">
              Als abgeschlossen markieren
            </button>
          </div>
        </div>

        <div v-else class="no-candidate">
          Wählen Sie einen Schüler aus, um mit der Korrektur zu beginnen.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Exams } from '@viccoboard/core';
import {
  GradingKeyService,
  AlternativeGradingService,
  AlternativeGradingUIHelper,
  STANDARD_ALTERNATIVE_SCALE,
  type AlternativeGradeType,
} from '@viccoboard/exams';
import { useExamsBridge } from '../composables/useExamsBridge';
import { downloadBytes } from '../utils/download';

const router = useRouter();
const route = useRoute();
const {
  getExam,
  findCorrectionsByExam,
  recordCorrectionUseCase,
  exportCurrentCorrectionSheetPdf,
  exportAllCorrectionSheetsPdf
} = useExamsBridge();

const exam = ref<Exams.Exam | null>(null);
const corrections = ref<Map<string, Exams.CorrectionEntry>>(new Map());
const currentCandidate = ref<Exams.Candidate | null>(null);
const loadError = ref('');
const candidateFilter = ref('');
const scoringMode = ref<'numeric' | 'alternative'>('numeric');
const taskScores = ref<Record<string, number>>({});
const taskAlternativeGrades = ref<Record<string, AlternativeGradeType>>({});
const taskComments = ref<Record<string, string>>({});
const generalComment = ref('');
const hasChanges = ref(false);

const alternativeGrades = computed(() =>
  AlternativeGradingUIHelper.getAllGradeButtons(STANDARD_ALTERNATIVE_SCALE)
);

const candidates = computed(() => exam.value?.candidates ?? []);

const filteredCandidates = computed(() => {
  const filter = candidateFilter.value.toLowerCase();
  return candidates.value.filter((candidate) =>
    `${candidate.firstName} ${candidate.lastName}`.toLowerCase().includes(filter)
  );
});

const currentCandidateIndex = computed(() =>
  candidates.value.findIndex(candidate => candidate.id === currentCandidate.value?.id)
);

const currentCorrection = computed(() => {
  if (!currentCandidate.value) {
    return null;
  }
  return corrections.value.get(currentCandidate.value.id) ?? null;
});

const currentCorrectionStatus = computed(() =>
  currentCorrection.value?.status ?? 'not-started'
);

const totalPoints = computed(() => {
  if (!exam.value) return 0;
  if (scoringMode.value === 'numeric') {
    return Object.values(taskScores.value).reduce((sum, pts) => sum + (pts || 0), 0);
  }
  return exam.value.structure.tasks.reduce((sum, task) => {
    const grade = taskAlternativeGrades.value[task.id];
    if (!grade) {
      return sum;
    }
    return sum + AlternativeGradingService.toNumericPoints(grade, task.points, STANDARD_ALTERNATIVE_SCALE);
  }, 0);
});

const percentageScore = computed(() => {
  if (!exam.value || exam.value.gradingKey.totalPoints === 0) return 0;
  return (totalPoints.value / exam.value.gradingKey.totalPoints) * 100;
});

const currentGrade = computed(() => {
  if (!exam.value) return 'k. A.';
  return GradingKeyService.calculateGrade(totalPoints.value, exam.value.gradingKey).grade;
});

const pointsToNextGrade = computed(() => {
  if (!exam.value) return 0;
  return GradingKeyService.pointsToNextGrade(totalPoints.value, exam.value.gradingKey);
});

function formatCorrectionStatus(status: Exams.CorrectionEntry['status'] | 'not-started'): string {
  switch (status) {
    case 'completed':
      return 'abgeschlossen';
    case 'in-progress':
      return 'in Bearbeitung';
    default:
      return 'offen';
  }
}

function markDirty(): void {
  hasChanges.value = true;
}

async function loadExamData(): Promise<void> {
  try {
    const examId = String(route.params.id);
    const loadedExam = await getExam(examId);
    if (!loadedExam) {
      loadError.value = 'Die angeforderte Prüfung wurde nicht gefunden.';
      return;
    }

    exam.value = loadedExam;
    const loadedCorrections = await findCorrectionsByExam(examId);
    corrections.value = new Map(loadedCorrections.map((entry) => [entry.candidateId, entry]));

    if (loadedExam.candidates.length > 0) {
      await selectCandidate(loadedExam.candidates[0]);
      return;
    }

    loadError.value = 'Diese Prüfung enthält noch keine Prüflinge.';
  } catch (error) {
    console.error('Failed to load correction page:', error);
    loadError.value = 'Die Korrekturansicht konnte nicht geladen werden.';
  }
}

async function selectCandidate(candidate: Exams.Candidate): Promise<void> {
  if (currentCandidate.value?.id === candidate.id) {
    return;
  }

  if (hasChanges.value) {
    await saveCurrentCandidate(false);
  }

  currentCandidate.value = candidate;
  hydrateCandidateState(candidate.id);
  hasChanges.value = false;
}

function hydrateCandidateState(candidateId: string): void {
  if (!exam.value) {
    return;
  }

  const correction = corrections.value.get(candidateId);
  taskScores.value = {};
  taskAlternativeGrades.value = {};
  taskComments.value = {};
  generalComment.value = '';

  for (const task of exam.value.structure.tasks) {
    const score = correction?.taskScores.find((entry) => entry.taskId === task.id);
    taskScores.value[task.id] = score?.points ?? 0;
    if (score?.alternativeGrading) {
      taskAlternativeGrades.value[task.id] = score.alternativeGrading.type;
    }
    taskComments.value[task.id] = score?.comment ?? '';
  }

  const examComment = correction?.comments
    ?.filter((comment) => comment.level === 'exam')
    ?.sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime())
  const latestExamComment = examComment?.[examComment.length - 1];

  generalComment.value = latestExamComment?.text ?? '';
  scoringMode.value = Object.keys(taskAlternativeGrades.value).length > 0 ? 'alternative' : 'numeric';
}

function onScoringModeChange(): void {
  if (!exam.value) {
    return;
  }

  if (scoringMode.value === 'alternative') {
    for (const task of exam.value.structure.tasks) {
      const numericPoints = taskScores.value[task.id] || 0;
      taskAlternativeGrades.value[task.id] = AlternativeGradingService.fromNumericPoints(
        numericPoints,
        task.points,
        STANDARD_ALTERNATIVE_SCALE
      );
    }
  } else {
    for (const task of exam.value.structure.tasks) {
      const grade = taskAlternativeGrades.value[task.id];
      if (grade) {
        taskScores.value[task.id] = AlternativeGradingService.toNumericPoints(
          grade,
          task.points,
          STANDARD_ALTERNATIVE_SCALE
        );
      }
    }
  }

  markDirty();
}

function setAlternativeGrade(taskId: string, grade: AlternativeGradeType): void {
  taskAlternativeGrades.value[taskId] = grade;
  markDirty();
}

function getGradeLabel(grade: AlternativeGradeType): string {
  const config = AlternativeGradingService.getGradeConfig(grade, STANDARD_ALTERNATIVE_SCALE);
  return `${config.emoji} ${config.label}`;
}

function getAlternativeGradePoints(taskId: string, maxPoints: number): number {
  const grade = taskAlternativeGrades.value[taskId];
  if (!grade) return 0;
  return AlternativeGradingService.toNumericPoints(grade, maxPoints, STANDARD_ALTERNATIVE_SCALE);
}

async function saveCurrentCandidate(finalize: boolean): Promise<void> {
  if (!exam.value || !currentCandidate.value || !recordCorrectionUseCase) {
    return;
  }

  const taskScoresPayload: Exams.TaskScore[] = exam.value.structure.tasks.map((task) => {
    const payload: Exams.TaskScore = {
      taskId: task.id,
      points: scoringMode.value === 'numeric'
        ? (taskScores.value[task.id] || 0)
        : getAlternativeGradePoints(task.id, task.points),
      maxPoints: task.points,
      comment: taskComments.value[task.id] || undefined,
      timestamp: new Date()
    };

    if (scoringMode.value === 'alternative' && taskAlternativeGrades.value[task.id]) {
      payload.alternativeGrading = AlternativeGradingService.createAlternativeGrading(
        taskAlternativeGrades.value[task.id],
        task.points,
        STANDARD_ALTERNATIVE_SCALE
      );
    }

    return payload;
  });

  const comments: Array<Partial<Pick<Exams.CorrectionComment, 'id' | 'timestamp'>> & Omit<Exams.CorrectionComment, 'id' | 'timestamp'>> =
    generalComment.value.trim()
      ? [{
          level: 'exam',
          text: generalComment.value.trim(),
          printable: true,
          availableAfterReturn: true
        }]
      : [];

  const saved = await recordCorrectionUseCase.execute({
    examId: exam.value.id,
    candidateId: currentCandidate.value.id,
    taskScores: taskScoresPayload,
    comments,
    finalizeCorrection: finalize
  });

  corrections.value = new Map(corrections.value).set(currentCandidate.value.id, saved);
  hasChanges.value = false;
  hydrateCandidateState(currentCandidate.value.id);
}

function getCorrectionStatus(candidateId: string): string | null {
  const correction = corrections.value.get(candidateId);
  return correction ? correction.status : null;
}

function correctionPercentage(candidateId: string): number {
  const correction = corrections.value.get(candidateId);
  if (!correction || !exam.value) return 0;
  const scoredTasks = correction.taskScores.filter(score => score.points > 0 || score.comment).length;
  const totalTasks = exam.value.structure.tasks.length;
  return totalTasks > 0 ? Math.round((scoredTasks / totalTasks) * 100) : 0;
}

async function exportCurrentCandidate(): Promise<void> {
  if (!exam.value || !currentCandidate.value || !exportCurrentCorrectionSheetPdf) {
    return;
  }

  await saveCurrentCandidate(false);
  const pdfDocument = await exportCurrentCorrectionSheetPdf(exam.value.id, currentCandidate.value.id);
  downloadBytes(pdfDocument.bytes, pdfDocument.fileName, 'application/pdf');
}

async function exportAllCandidates(): Promise<void> {
  if (!exam.value || !exportAllCorrectionSheetsPdf) {
    return;
  }

  await saveCurrentCandidate(false);
  const pdfDocument = await exportAllCorrectionSheetsPdf(exam.value.id);
  downloadBytes(pdfDocument.bytes, pdfDocument.fileName, 'application/pdf');
}

function openPreviewForCurrentCandidate(): void {
  if (!exam.value || !currentCandidate.value) {
    return;
  }

  router.push({
    path: `/exams/${exam.value.id}/export`,
    query: { candidateId: currentCandidate.value.id }
  });
}

function openExportPage(): void {
  if (!exam.value) {
    return;
  }
  router.push(`/exams/${exam.value.id}/export`);
}

function goBack(): void {
  router.push('/exams');
}

onMounted(() => {
  loadExamData();
});
</script>

<style scoped src="./CorrectionCompactUI_v2.css"></style>
