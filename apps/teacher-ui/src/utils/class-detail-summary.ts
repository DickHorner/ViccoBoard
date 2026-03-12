/**
 * Pure utility functions for the ClassDetail sport workbench view.
 * Keeps data-mapping logic testable independently of Vue.
 */

// ---------------------------------------------------------------------------
// Summary data
// ---------------------------------------------------------------------------

export interface ClassSportSummary {
  studentCount: number
  lessonCount: number
  gradeCategoryCount: number
  assessmentCount: number
}

/**
 * Build a sport summary for a class from raw counts.
 * Negative inputs are clamped to zero.
 */
export function buildClassSportSummary(
  studentCount: number,
  lessonCount: number,
  gradeCategoryCount: number,
  assessmentCount: number
): ClassSportSummary {
  return {
    studentCount: Math.max(0, studentCount),
    lessonCount: Math.max(0, lessonCount),
    gradeCategoryCount: Math.max(0, gradeCategoryCount),
    assessmentCount: Math.max(0, assessmentCount)
  }
}

// ---------------------------------------------------------------------------
// Sport work-area links
// ---------------------------------------------------------------------------

export interface SportWorkArea {
  label: string
  description: string
  icon: string
  /** Resolved route path (classId already interpolated). */
  to: string
}

/**
 * Returns the sport work areas a teacher can navigate to from a class detail
 * page.  Links that accept a classId query param are pre-filtered.
 */
export function buildSportWorkAreas(classId: string): SportWorkArea[] {
  return [
    {
      label: 'Anwesenheit',
      description: 'Anwesenheit für diese Klasse erfassen',
      icon: '✓',
      to: `/attendance?classId=${classId}`
    },
    {
      label: 'Stunden',
      description: 'Unterrichtsstunden dieser Klasse',
      icon: '📅',
      to: `/lessons?classId=${classId}`
    },
    {
      label: 'Bewertung & Tests',
      description: 'Kriterien, Zeitnoten, Cooper, Shuttle-Run, Sportabzeichen, BJS',
      icon: '🏅',
      to: '/grading'
    },
    {
      label: 'Statistiken',
      description: 'Leistungsüberblick und Anwesenheitsquoten',
      icon: '📊',
      to: '/subjects/sport/statistics'
    },
    {
      label: 'Tools',
      description: 'Timer, Scoreboard, Teams, Taktik und Feedback',
      icon: '🛠️',
      to: '/tools/timer'
    }
  ]
}
