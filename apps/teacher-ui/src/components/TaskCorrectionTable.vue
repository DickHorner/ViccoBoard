<template>
  <section class="task-correction-table">
    <div class="task-correction-header">
      <div>
        <h2>Aufgabenweise Korrektur</h2>
        <p>Eine Aufgabe über alle Prüflinge korrigieren und vorhandene Aufgabenkommentare wiederverwenden.</p>
      </div>
      <button class="btn-primary" :disabled="!hasChanges || !recordCorrectionUseCase" @click="saveTaskRows">
        {{ hasChanges ? 'Tabellenänderungen speichern' : 'Alles gespeichert' }}
      </button>
    </div>

    <div class="task-correction-controls">
      <label>
        Aufgabe
        <select :value="selectedTaskId" @change="onSelectedTaskChange">
          <option v-for="task in correctionTasks" :key="task.id" :value="task.id">
            {{ task.title }} · {{ task.points }} Punkte
          </option>
        </select>
      </label>
      <div class="task-correction-sort">
        <span>Sortierung</span>
        <button :class="['btn-secondary', { active: sort === 'candidate' }]" @click="sortBy('candidate')">
          Prüfling
        </button>
        <button :class="['btn-secondary', { active: sort === 'points' }]" @click="sortBy('points')">
          Punkte
        </button>
      </div>
    </div>

    <div v-if="!selectedTask" class="no-candidate">
      Keine korrekturrelevante Aufgabe vorhanden.
    </div>

    <div v-else class="task-correction-scroll">
      <table class="task-correction-grid">
        <thead>
          <tr>
            <th>Prüfling</th>
            <th>Status</th>
            <th>Punkte</th>
            <th>Aufgabenkommentar</th>
            <th>Kommentar übernehmen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.candidate.id">
            <td class="candidate-name">{{ row.candidateName }}</td>
            <td>
              <span class="status" :class="`status-${row.status}`">
                {{ formatCorrectionStatus(row.status) }}
              </span>
            </td>
            <td>
              <input
                v-model.number="row.draft.points"
                type="number"
                min="0"
                :max="selectedTask.points"
                step="0.5"
                class="score-input"
                @input="markDirty(row.candidate.id)"
              />
              <span class="criterion-max">/ {{ selectedTask.points }}</span>
            </td>
            <td>
              <textarea
                v-model="row.draft.comment"
                rows="2"
                class="comment-input"
                :placeholder="`Kommentar zu ${selectedTask.title}...`"
                @input="markDirty(row.candidate.id)"
              ></textarea>
            </td>
            <td>
              <select class="reuse-select" @change="reuseComment(row.candidate.id, $event)">
                <option value="">Kommentar auswählen …</option>
                <option
                  v-for="comment in commentSuggestionsForCandidate(row.candidate.id)"
                  :key="comment.text"
                  :value="comment.text"
                >
                  {{ comment.text }} ({{ comment.frequency }}×)
                </option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Exams } from '@viccoboard/core';
import { getCorrectionRelevantTaskNodes } from '@viccoboard/exams';

import {
  buildTaskCorrectionTaskScores,
  useTaskCorrectionTable
} from '../composables/useTaskCorrectionTable';

interface RecordCorrectionUseCaseLike {
  execute(input: {
    examId: string;
    candidateId: string;
    taskScores?: Exams.TaskScore[];
    finalizeCorrection?: boolean;
  }): Promise<Exams.CorrectionEntry>;
}

interface Props {
  exam: Exams.Exam;
  candidates: Exams.Candidate[];
  corrections: Map<string, Exams.CorrectionEntry>;
  recordCorrectionUseCase?: RecordCorrectionUseCaseLike;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  saved: [corrections: Exams.CorrectionEntry[]]
}>();

const correctionTasks = computed(() => getCorrectionRelevantTaskNodes(props.exam.structure.tasks));
const candidatesRef = computed(() => props.candidates);
const correctionsRef = computed(() => props.corrections);

const {
  applyReusableComment,
  commentSuggestionsForCandidate,
  drafts,
  ensureSelectedTask,
  rows,
  selectTask,
  selectedTask,
  selectedTaskId,
  sort,
  sortBy
} = useTaskCorrectionTable({
  candidates: candidatesRef,
  corrections: correctionsRef,
  tasks: correctionTasks
});

const dirtyCandidateIds = ref<Set<string>>(new Set());
const hasChanges = ref(false);

watch(
  () => [
    props.exam.id,
    props.candidates.length,
    props.corrections,
    correctionTasks.value.map((task) => task.id).join('|')
  ],
  () => {
    ensureSelectedTask();
    dirtyCandidateIds.value = new Set();
    hasChanges.value = false;
  },
  { immediate: true }
);

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

function markDirty(candidateId: string): void {
  dirtyCandidateIds.value = new Set(dirtyCandidateIds.value).add(candidateId);
  hasChanges.value = true;
}

function buildTaskScores(candidateId: string): Exams.TaskScore[] {
  if (!selectedTask.value) return [];
  return buildTaskCorrectionTaskScores(
    correctionTasks.value,
    selectedTask.value,
    props.corrections.get(candidateId),
    drafts.value[candidateId] ?? { points: 0, comment: '' }
  );
}

async function saveTaskRows(): Promise<void> {
  if (!props.recordCorrectionUseCase || !selectedTask.value || dirtyCandidateIds.value.size === 0) {
    return;
  }

  const savedCorrections: Exams.CorrectionEntry[] = [];
  for (const candidateId of dirtyCandidateIds.value) {
    const saved = await props.recordCorrectionUseCase.execute({
      examId: props.exam.id,
      candidateId,
      taskScores: buildTaskScores(candidateId)
    });
    savedCorrections.push(saved);
  }

  emit('saved', savedCorrections);
  dirtyCandidateIds.value = new Set();
  hasChanges.value = false;
}

async function onSelectedTaskChange(event: Event): Promise<void> {
  const target = event.target as HTMLSelectElement | null;
  if (!target) return;
  if (hasChanges.value) {
    await saveTaskRows();
  }
  selectTask(target.value);
  dirtyCandidateIds.value = new Set();
  hasChanges.value = false;
}

function reuseComment(candidateId: string, event: Event): void {
  const target = event.target as HTMLSelectElement | null;
  const text = target?.value ?? '';
  if (!text) return;

  applyReusableComment(candidateId, text);
  markDirty(candidateId);
  target.value = '';
}
</script>
