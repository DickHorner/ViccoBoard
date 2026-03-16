<template>
  <div class="correction-container">
    <div class="correction-header">
      <div class="header-info">
        <h1>{{ exam?.title || 'Prüfungskorrektur' }}</h1>
        <p v-if="exam" class="exam-meta">{{ candidates.length }} Schüler | Gesamt: {{ exam.gradingKey.totalPoints }} Punkte</p>
      </div>
      <div class="header-actions">
        <button @click="saveCorrectionBatch" class="btn-primary" :disabled="!hasChanges">
          {{ hasChanges ? 'Alle Änderungen speichern' : 'Alles gespeichert' }}
        </button>
        <button @click="goBack" class="btn-secondary">Zurück zu den Prüfungen</button>
      </div>
    </div>

    <div v-if="exam" class="correction-layout">
      <!-- Candidates List (Sidebar) -->
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
              {{ formatCorrectionStatus(currentCorrection.status) }}
            </span>
          </div>

          <!-- Scoring Mode Selector -->
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

          <!-- Task Scoring -->
          <div class="scoring-section">
            <h3>Aufgabenbewertung</h3>
            <div v-for="task in exam.structure.tasks" :key="task.id" class="task-scoring">
              <div class="task-title">
                <label>{{ task.title }}</label>
                <span class="max-points">(max. {{ task.points }})</span>
              </div>

              <!-- Numeric Scoring Mode -->
              <div v-if="scoringMode === 'numeric'" class="score-input-group">
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
                  {{ pointsToNextGrade }} Punkte bis zur nächsten Note
                </span>
              </div>

              <!-- Alternative Scoring Mode -->
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

              <!-- Task Comment (optional) -->
              <div v-if="exam.structure.allowsComments" class="comment-box">
                <textarea
                  v-model="taskComments[task.id]"
                  :placeholder="`Kommentar zu ${task.title}...`"
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

          <!-- Support Tips -->
          <div v-if="exam.structure.allowsSupportTips" class="support-tips-section">
            <h3>Fördertipps</h3>
            <div class="tips-input">
              <button @click="showTipsModal = true" class="btn-secondary-small">
                + Fördertipps zuweisen
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
            <h3>Besondere Leistung</h3>
            <label class="checkbox-label">
              <input v-model="markAsSpecial" type="checkbox" />
              Diese Arbeit als besonders markieren
            </label>
            <div v-if="markAsSpecial" class="special-input">
              <textarea
                v-model="specialNotes"
                placeholder="Notizen zu besonderen Aspekten dieser Arbeit..."
                class="comment-input"
                rows="3"
              ></textarea>
            </div>
          </div>

          <!-- Tab Navigation Enhancement -->
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

          <!-- Save Button -->
          <div class="action-buttons">
            <button @click="saveCorrectionForCandidate" class="btn-primary">
              Speichern und weiter
            </button>
            <button @click="finalizeCorrectionForCandidate" class="btn-success">
              Als abgeschlossen markieren
            </button>
          </div>
        </div>

        <div v-else class="no-candidate">
          Wählen Sie einen Schüler aus, um mit der Korrektur zu beginnen.
        </div>
      </div>
    </div>

    <!-- Support Tips Modal -->
    <div v-if="showTipsModal" class="modal-overlay" @click.self="showTipsModal = false">
      <div class="modal-content">
        <h3>Fördertipps zuweisen</h3>
        <input
          v-model="tipsSearchQuery"
          type="text"
          placeholder="Fördertipps suchen..."
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
          <button @click="applySelectedTips" class="btn-primary">Übernehmen</button>
          <button @click="showTipsModal = false" class="btn-secondary">Abbrechen</button>
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
import {
  GradingKeyService,
  AlternativeGradingService,
  AlternativeGradingUIHelper,
  STANDARD_ALTERNATIVE_SCALE,
  type AlternativeGradeType,
} from '@viccoboard/exams';

const router = useRouter();

// Props/State
const exam = ref<Exams.Exam | null>(null);
const candidates = ref<Exams.Candidate[]>([]);
const corrections = ref<Map<string, Exams.CorrectionEntry>>(new Map());
const currentCandidate = ref<Exams.Candidate | null>(null);
const currentCorrection = ref<Exams.CorrectionEntry | null>(null);

// UI State
const candidateFilter = ref('');
const scoringMode = ref<'numeric' | 'alternative'>('numeric');
const taskScores = ref<Record<string, number>>({});
const taskAlternativeGrades = ref<Record<string, AlternativeGradeType>>({});
const taskComments = ref<Record<string, string>>({});
const markAsSpecial = ref(false);
const specialNotes = ref('');
const showTipsModal = ref(false);
const tipsSearchQuery = ref('');
const selectedTipsIds = ref<string[]>([]);
const allSupportTips = ref<Exams.SupportTip[]>([]);
const hasChanges = ref(false);

// Alternative grading configuration
const alternativeGrades = computed(() =>
  AlternativeGradingUIHelper.getAllGradeButtons(STANDARD_ALTERNATIVE_SCALE)
);

const filteredCandidates = computed(() => {
  const filter = candidateFilter.value.toLowerCase();
  return candidates.value.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(filter)
  );
});

const currentCandidateIndex = computed(() =>
  candidates.value.findIndex(c => c.id === currentCandidate.value?.id)
);

const totalPoints = computed(() => {
  if (scoringMode.value === 'numeric') {
    return Object.values(taskScores.value).reduce((sum, pts) => sum + pts, 0);
  } else {
    // Calculate from alternative grades
    if (!exam.value) return 0;
    return exam.value.structure.tasks.reduce((sum, task) => {
      const grade = taskAlternativeGrades.value[task.id];
      if (grade) {
        return sum + AlternativeGradingService.toNumericPoints(grade, task.points, STANDARD_ALTERNATIVE_SCALE);
      }
      return sum;
    }, 0);
  }
});

const percentageScore = computed(() => {
  if (!exam.value || exam.value.gradingKey.totalPoints === 0) return 0;
  return (totalPoints.value / exam.value.gradingKey.totalPoints) * 100;
});

const currentGrade = computed(() => {
  if (!exam.value) return 'k. A.';
  const result = GradingKeyService.calculateGrade(totalPoints.value, exam.value.gradingKey);
  return result.grade;
});

const pointsToNextGrade = computed(() => {
  if (!exam.value) return 0;
  return GradingKeyService.pointsToNextGrade(totalPoints.value, exam.value.gradingKey);
});

const formatCorrectionStatus = (status: Exams.CorrectionEntry['status']): string => {
  switch (status) {
    case 'completed':
      return 'abgeschlossen';
    case 'in-progress':
      return 'in Bearbeitung';
    default:
      return 'offen';
  }
};

// Methods
const selectCandidate = (candidate: Exams.Candidate) => {
  saveCorrectionForCandidate();
  currentCandidate.value = candidate;
  loadCorrectionForCandidate(candidate);
};

const loadCorrectionForCandidate = async (candidate: Exams.Candidate) => {
  // Simulate loading - in real implementation, fetch from repository
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

  // Load task scores
  taskScores.value = {};
  taskAlternativeGrades.value = {};
  taskComments.value = {};
  if (exam.value) {
    exam.value.structure.tasks.forEach(task => {
      const score = correction?.taskScores.find(ts => ts.taskId === task.id);
      taskScores.value[task.id] = score?.points || 0;
      if (score?.alternativeGrading) {
        taskAlternativeGrades.value[task.id] = score.alternativeGrading.type;
      }
      taskComments.value[task.id] = score?.comment || '';
    });
  }
};

const onScoringModeChange = () => {
  // When switching modes, convert scores
  if (scoringMode.value === 'alternative' && exam.value) {
    // Convert numeric to alternative
    exam.value.structure.tasks.forEach(task => {
      const numericPoints = taskScores.value[task.id] || 0;
      const grade = AlternativeGradingService.fromNumericPoints(
        numericPoints,
        task.points,
        STANDARD_ALTERNATIVE_SCALE
      );
      taskAlternativeGrades.value[task.id] = grade;
    });
  } else if (scoringMode.value === 'numeric' && exam.value) {
    // Convert alternative to numeric (already handled by computed totalPoints)
    exam.value.structure.tasks.forEach(task => {
      const grade = taskAlternativeGrades.value[task.id];
      if (grade) {
        const points = AlternativeGradingService.toNumericPoints(
          grade,
          task.points,
          STANDARD_ALTERNATIVE_SCALE
        );
        taskScores.value[task.id] = points;
      }
    });
  }
};

const setAlternativeGrade = (taskId: string, grade: AlternativeGradeType) => {
  taskAlternativeGrades.value[taskId] = grade;
  updateGrade();
};

const getGradeLabel = (grade: AlternativeGradeType): string => {
  const config = AlternativeGradingService.getGradeConfig(grade, STANDARD_ALTERNATIVE_SCALE);
  return `${config.emoji} ${config.label}`;
};

const getAlternativeGradePoints = (taskId: string, maxPoints: number): number => {
  const grade = taskAlternativeGrades.value[taskId];
  if (!grade) return 0;
  return AlternativeGradingService.toNumericPoints(grade, maxPoints, STANDARD_ALTERNATIVE_SCALE);
};

const saveCorrectionForCandidate = async () => {
  if (!currentCandidate.value || !currentCorrection.value || !exam.value) return;

  const taskScoresArray: Exams.TaskScore[] = exam.value.structure.tasks.map(task => {
    const score: Exams.TaskScore = {
      taskId: task.id,
      points: scoringMode.value === 'numeric' ? (taskScores.value[task.id] || 0) : getAlternativeGradePoints(task.id, task.points),
      maxPoints: task.points,
      comment: taskComments.value[task.id],
      timestamp: new Date()
    };

    // Add alternative grading info if in alternative mode
    if (scoringMode.value === 'alternative' && taskAlternativeGrades.value[task.id]) {
      score.alternativeGrading = AlternativeGradingService.createAlternativeGrading(
        taskAlternativeGrades.value[task.id],
        task.points,
        STANDARD_ALTERNATIVE_SCALE
      );
    }

    return score;
  });

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
  // Grade updates automatically via computed properties
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
  // Save all corrections
  console.log('Speichere alle Korrekturen...', corrections.value);
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

const goBack = () => {
  router.push('/exams');
};

onMounted(async () => {
  // Load exam and candidates from route params
  // For now, mock data
  exam.value = {
    id: 'exam-1',
    title: 'Mathetest',
    mode: Exams.ExamMode.Simple,
    structure: {
      parts: [],
      tasks: [
        {
          id: 'task-1',
          level: 1,
          order: 0,
          title: 'Aufgabe 1',
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
          title: 'Aufgabe 2',
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

<style scoped src="./CorrectionCompactUI_v2.css"></style>
