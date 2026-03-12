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

export interface LessonContext {
  lessonId: string
  classGroupId: string
}

export interface LessonToolEntry {
  to: string
  title: string
  description: string
}

const SPORT_TOOL_LABELS: Record<string, string> = {
  timer: 'Timer',
  multistop: 'Multistop',
  scoreboard: 'Scoreboard',
  teams: 'Teams',
  tournaments: 'Turnier',
  tactics: 'Taktikboard',
  feedback: 'Feedback',
}

export function formatToolLabel(toolType: string): string {
  return SPORT_TOOL_LABELS[toolType.toLowerCase()] ?? toolType
}

function appendLessonContext(path: string, ctx: LessonContext): string {
  return `${path}?lessonId=${encodeURIComponent(ctx.lessonId)}&classGroupId=${encodeURIComponent(ctx.classGroupId)}`
}

export const SPORT_TOOL_ROUTES: Record<string, string> = {
  timer: '/tools/timer',
  multistop: '/tools/multistop',
  scoreboard: '/tools/scoreboard',
  teams: '/tools/teams',
  tournaments: '/tools/tournaments',
  tactics: '/tools/tactics',
  feedback: '/tools/feedback',
}

export function buildSportToolEntries(ctx: LessonContext): LessonToolEntry[] {
  return [
    {
      to: appendLessonContext('/subjects/sport', ctx),
      title: 'Sport-Hub',
      description: 'Bewertung, Tests und Tools fuer diese Stunde.',
    },
    {
      to: appendLessonContext('/grading', ctx),
      title: 'Sport-Bewertung',
      description: 'Kategorien und Leistungserfassung oeffnen.',
    },
    {
      to: appendLessonContext(SPORT_TOOL_ROUTES.timer, ctx),
      title: 'Live-Tools',
      description: 'Timer, Teams, Scoreboard und weitere Unterrichtstools.',
    },
  ]
}

