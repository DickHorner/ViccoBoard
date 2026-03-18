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
  dice: 'Wuerfeln',
  'video-delay': 'Video Delay',
  'finish-camera': 'Zielkamera',
  'pushup-tracking': 'Liegestuetze Tracking',
  'tracking-basketball': 'Basketball Trefferquote',
  'slow-motion': 'Slow Motion Analyse',
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
  dice: '/tools/dice',
  'video-delay': '/tools/video-delay',
  'finish-camera': '/tools/finish-camera',
  'pushup-tracking': '/tools/pushup-tracking',
  'tracking-basketball': '/tools/tracking-basketball',
  'slow-motion': '/tools/slow-motion',
}

export function buildSportToolEntries(ctx: LessonContext): LessonToolEntry[] {
  return [
    {
      to: appendLessonContext('/subjects/sport', ctx),
      title: 'Sport-Hub',
      description: 'Bewertung, Tests und Tools für diese Stunde.',
    },
    {
      to: appendLessonContext('/grading', ctx),
      title: 'Sport-Bewertung',
      description: 'Kategorien und Leistungserfassung öffnen.',
    },
    {
      to: appendLessonContext(SPORT_TOOL_ROUTES.timer, ctx),
      title: 'Live-Tools',
      description: 'Timer, Teams, Scoreboard und weitere Unterrichtstools.',
    },
  ]
}

