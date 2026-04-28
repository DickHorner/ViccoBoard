/**
 * Core types for the Tasks module.
 * Reuses ClassGroup and Student IDs from @viccoboard/core — no new person/class modelling.
 */

// ============================================================================
// Target
// ============================================================================

export type TeacherTaskTargetKind = 'class' | 'student';

export interface TeacherTaskTarget {
  /** 'class' → classGroupId is set; 'student' → studentId is set */
  kind: TeacherTaskTargetKind;
  /** ID of the ClassGroup (required when kind === 'class') */
  classGroupId?: string;
  /** ID of the Student (required when kind === 'student') */
  studentId?: string;
}

// ============================================================================
// Checklist item
// ============================================================================

export interface TeacherTaskChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

// ============================================================================
// Per-participant completion state (optional, class tasks only)
// ============================================================================

export interface TeacherTaskParticipantState {
  /** studentId from the linked class */
  studentId: string;
  done: boolean;
  note?: string;
}

// ============================================================================
// Task
// ============================================================================

export interface TeacherTask {
  id: string;
  title: string;
  description?: string;
  target: TeacherTaskTarget;
  /** ISO 8601 date string (YYYY-MM-DD) */
  dueDate?: string;
  /** Optional early reminder date — must be ≤ dueDate */
  preReminderAt?: string;
  checklist: TeacherTaskChecklistItem[];
  /** Per-student completion tracking — only meaningful for class targets */
  participantStates: TeacherTaskParticipantState[];
  done: boolean;
  createdAt: Date;
  lastModified: Date;
}
