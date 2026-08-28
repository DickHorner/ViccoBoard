import { computed, ref } from 'vue';
import type { Exams } from '@viccoboard/core';

type ReadonlyValue<T> = { readonly value: T };

export type TaskCorrectionSort = 'candidate' | 'points';

export interface TaskCorrectionDraft {
  points: number;
  comment: string;
}

export interface ReusableTaskComment {
  text: string;
  frequency: number;
  lastUsed: Date;
  candidateIds: string[];
}

export interface TaskCorrectionRow {
  candidate: Exams.Candidate;
  candidateName: string;
  correction: Exams.CorrectionEntry | null;
  score: Exams.TaskScore | null;
  draft: TaskCorrectionDraft;
  status: Exams.CorrectionEntry['status'] | 'not-started';
}

interface TaskCorrectionTableInput {
  candidates: ReadonlyValue<Exams.Candidate[]>;
  corrections: ReadonlyValue<Map<string, Exams.CorrectionEntry>>;
  tasks: ReadonlyValue<Exams.TaskNode[]>;
}

function candidateName(candidate: Exams.Candidate): string {
  return `${candidate.firstName} ${candidate.lastName}`.trim();
}

function readScore(
  correction: Exams.CorrectionEntry | undefined,
  taskId: string
): Exams.TaskScore | undefined {
  return correction?.taskScores.find((score) => score.taskId === taskId);
}

function dateFrom(value: Date | string | undefined): Date {
  if (!value) return new Date(0);
  return value instanceof Date ? value : new Date(value);
}

export function useTaskCorrectionTable(input: TaskCorrectionTableInput) {
  const selectedTaskId = ref('');
  const sort = ref<TaskCorrectionSort>('candidate');
  const drafts = ref<Record<string, TaskCorrectionDraft>>({});

  const selectedTask = computed(() =>
    input.tasks.value.find((task) => task.id === selectedTaskId.value) ?? null
  );

  function hydrateDrafts(): void {
    const task = selectedTask.value;
    if (!task) {
      drafts.value = {};
      return;
    }

    const nextDrafts: Record<string, TaskCorrectionDraft> = {};
    for (const candidate of input.candidates.value) {
      const score = readScore(input.corrections.value.get(candidate.id), task.id);
      nextDrafts[candidate.id] = {
        points: score?.points ?? 0,
        comment: score?.comment ?? ''
      };
    }

    drafts.value = nextDrafts;
  }

  function ensureSelectedTask(): void {
    if (selectedTaskId.value && input.tasks.value.some((task) => task.id === selectedTaskId.value)) {
      hydrateDrafts();
      return;
    }

    selectedTaskId.value = input.tasks.value[0]?.id ?? '';
    hydrateDrafts();
  }

  function selectTask(taskId: string): void {
    selectedTaskId.value = taskId;
    hydrateDrafts();
  }

  function sortBy(field: TaskCorrectionSort): void {
    sort.value = field;
  }

  const rows = computed<TaskCorrectionRow[]>(() => {
    const task = selectedTask.value;
    if (!task) return [];

    const nextRows = input.candidates.value.map((candidate) => {
      const correction = input.corrections.value.get(candidate.id) ?? null;
      const score = readScore(correction ?? undefined, task.id) ?? null;
      const draft = drafts.value[candidate.id] ?? {
        points: score?.points ?? 0,
        comment: score?.comment ?? ''
      };

      return {
        candidate,
        candidateName: candidateName(candidate),
        correction,
        score,
        draft,
        status: correction?.status ?? 'not-started'
      };
    });

    return nextRows.sort((left, right) => {
      if (sort.value === 'points') {
        const byPoints = right.draft.points - left.draft.points;
        if (byPoints !== 0) return byPoints;
      }

      return left.candidateName.localeCompare(right.candidateName);
    });
  });

  const reusableComments = computed<ReusableTaskComment[]>(() => {
    const taskId = selectedTaskId.value;
    if (!taskId) return [];

    const commentMap = new Map<string, ReusableTaskComment>();
    for (const correction of input.corrections.value.values()) {
      const score = readScore(correction, taskId);
      const text = score?.comment?.trim();
      if (!text) continue;

      const existing = commentMap.get(text);
      if (existing) {
        existing.frequency += 1;
        existing.candidateIds.push(correction.candidateId);
        if (dateFrom(score?.timestamp) > existing.lastUsed) {
          existing.lastUsed = dateFrom(score?.timestamp);
        }
        continue;
      }

      commentMap.set(text, {
        text,
        frequency: 1,
        lastUsed: dateFrom(score?.timestamp),
        candidateIds: [correction.candidateId]
      });
    }

    return [...commentMap.values()].sort((left, right) =>
      right.frequency - left.frequency ||
      right.lastUsed.getTime() - left.lastUsed.getTime() ||
      left.text.localeCompare(right.text)
    );
  });

  function commentSuggestionsForCandidate(candidateId: string): ReusableTaskComment[] {
    const currentComment = drafts.value[candidateId]?.comment.trim();
    return reusableComments.value.filter((comment) =>
      !comment.candidateIds.includes(candidateId) && comment.text !== currentComment
    );
  }

  function applyReusableComment(candidateId: string, text: string): void {
    const draft = drafts.value[candidateId];
    if (!draft) return;
    draft.comment = text;
  }

  return {
    applyReusableComment,
    commentSuggestionsForCandidate,
    drafts,
    ensureSelectedTask,
    hydrateDrafts,
    reusableComments,
    rows,
    selectTask,
    selectedTask,
    selectedTaskId,
    sort,
    sortBy
  };
}
