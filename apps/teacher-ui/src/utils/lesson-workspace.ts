export type LessonWorkspaceSubject = 'sport' | 'kbr' | 'generic'

export function resolveLessonWorkspaceSubject(subjectProfile?: string): LessonWorkspaceSubject {
  const normalized = subjectProfile?.trim().toLowerCase()

  if (!normalized) {
    return 'generic'
  }

  if (normalized.includes('sport')) {
    return 'sport'
  }

  if (normalized.includes('kbr')) {
    return 'kbr'
  }

  return 'generic'
}

