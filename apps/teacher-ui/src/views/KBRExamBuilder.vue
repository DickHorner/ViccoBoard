<template>
  <div class="exam-builder-page">
    <div class="builder-header">
      <div>
        <h1>{{ isEditing ? 'Prüfung bearbeiten' : 'Prüfung erstellen' }}</h1>
        <p v-if="exam">{{ exam.mode === 'simple' ? 'Einfach: flache Aufgabenliste' : 'Komplex: verschachtelte Aufgaben (3 Ebenen)' }}</p>
      </div>
      <div class="actions">
        <button @click="goBack" class="btn-secondary">Abbrechen</button>
        <button @click="saveExam" class="btn-primary" :disabled="!canSave">Prüfung speichern</button>
      </div>
    </div>

    <div v-if="exam" class="builder-content">
      <!-- Exam Details Section -->
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

      <!-- Tasks Section -->
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
              <input v-model.number="task.points" type="number" min="0" step="1" />
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

          <!-- Criteria for this task -->
          <div v-if="task.criteria.length > 0" class="criteria-list">
            <h4>Kriterien</h4>
            <div v-for="(criterion, cidx) in task.criteria" :key="criterion.id" class="criterion-item">
              <input v-model="criterion.text" type="text" placeholder="Kriterium beschreiben" class="criterion-input" />
              <input v-model.number="criterion.points" type="number" min="0" step="0.5" class="points-input" title="Punkte" />
              <button @click="removeCriterion(idx, cidx)" class="btn-danger-small">Entfernen</button>
            </div>
          </div>
          <button @click="addCriterion(idx)" class="btn-secondary-small">+ Kriterium hinzufügen</button>

          <!-- Subtasks for complex mode -->
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

      <!-- Exam Parts Section -->
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

      <!-- Grading Key Section -->
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

      <!-- Summary -->
      <section class="section summary">
        <h2>Zusammenfassung</h2>
        <div class="summary-grid">
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
import { useExamsBridge } from '../composables/useExamsBridge';

const router = useRouter();
const route = useRoute();
const { examRepository } = useExamsBridge();

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
    title: `Aufgabe ${exam.value.structure.tasks.length + 1}`,
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

const updateTotalPoints = () => {
  if (!exam.value) return;
  const taskPoints = exam.value.structure.tasks.reduce((sum, task) => sum + task.points, 0);
  exam.value.gradingKey.totalPoints = taskPoints;
};

const saveExam = async () => {
  if (!exam.value || !canSave.value) return;
  try {
    if (isEditing.value) {
      await examRepository?.update(exam.value.id, exam.value);
    } else {
      await examRepository?.create(exam.value);
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
    const loaded = await examRepository?.findById(id);
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
    };
  }
});
</script>

<style scoped src="./KBRExamBuilder.css"></style>
