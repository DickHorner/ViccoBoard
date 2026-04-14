import type { StudentLongTermNote, DevelopmentNote, CompetencyArea } from '../repositories/student-long-term-note.repository'
import type { CompetencyProgress, StudentGrowthAnalysis } from './long-term-note.types'

const formatGermanDate = (date: Date): string =>
  new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)

export function calculateCompetencyProgress(
  competency: CompetencyArea,
  assessments: Array<{ date: Date; score: number; examId?: string }>
): CompetencyProgress {
  if (assessments.length === 0) {
    return {
      competencyId: competency.id,
      competencyName: competency.name,
      assessments: [],
      trend: competency.trend,
      averageScore: 0,
      latestScore: 0,
      trendPercentage: 0
    }
  }

  const sortedAssessments = [...assessments].sort((a, b) => a.date.getTime() - b.date.getTime())
  const scores = sortedAssessments.map((assessment) => assessment.score)
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length
  const latestScore = scores[scores.length - 1]
  const previousScore = scores.length > 1 ? scores[scores.length - 2] : undefined

  let trendPercentage = 0
  if (previousScore !== undefined) {
    trendPercentage = ((latestScore - previousScore) / previousScore) * 100
  }

  let trend: 'improving' | 'stable' | 'declining' | 'new' = competency.trend
  if (scores.length > 1) {
    if (trendPercentage > 5) trend = 'improving'
    else if (trendPercentage < -5) trend = 'declining'
    else trend = 'stable'
  }

  return {
    competencyId: competency.id,
    competencyName: competency.name,
    assessments: sortedAssessments,
    trend,
    averageScore,
    latestScore,
    previousScore,
    trendPercentage
  }
}

export function compareCompetencyAcrossStudents(
  notes: Map<string, StudentLongTermNote>,
  competencyName: string
): Array<{ studentId: string; studentName: string; averageScore: number; trend: string }> {
  const results: Array<{ studentId: string; studentName: string; averageScore: number; trend: string }> = []
  for (const [studentId, note] of notes) {
    const competency = note.competencyAreas.find((candidate: CompetencyArea) => candidate.name === competencyName)
    if (competency) {
      results.push({
        studentId,
        studentName: studentId,
        averageScore: 0,
        trend: competency.trend
      })
    }
  }
  return results
}

export function identifyStudentsNeedingSupport(
  notes: StudentLongTermNote[],
  criteriaOptions?: {
    minFocusAreas?: number
    maxImprovingCompetencies?: number
    hasChallenges?: boolean
  }
): StudentLongTermNote[] {
  return notes.filter((note) => {
    const criteria = criteriaOptions || { minFocusAreas: 2, maxImprovingCompetencies: 2, hasChallenges: true }
    let needsSupport = false
    if (criteria.minFocusAreas && note.focusAreas.length >= criteria.minFocusAreas) needsSupport = true
    if (criteria.hasChallenges && note.developmentNotes.some((entry: DevelopmentNote) => entry.category === 'challenge')) {
      needsSupport = true
    }
    return needsSupport
  })
}

export function generateProgressSummary(
  note: StudentLongTermNote,
  growth: StudentGrowthAnalysis
): string {
  const lines: string[] = []
  lines.push('Langzeitentwicklungsübersicht')
  lines.push(`Schuljahr: ${note.schoolYear}`)
  lines.push(`Erfasste Beobachtungen: ${growth.totalNotes}`)
  lines.push(`Verfolgte Kompetenzen: ${growth.competenciesTracked}`)
  lines.push('')
  lines.push('Verlaufsübersicht:')
  lines.push(`  • Verbessernd: ${growth.improvingCount}`)
  lines.push(`  • Stabil: ${growth.stableCount}`)
  lines.push(`  • Rückläufig: ${growth.decliningCount}`)
  lines.push(`  • Durchschnittlicher Trend: ${growth.averageTrend > 0 ? '+' : ''}${growth.averageTrend.toFixed(1)}%`)
  lines.push('')

  if (note.strengths.length > 0) {
    lines.push('Stärken:')
    note.strengths.forEach((strength: string) => lines.push(`  • ${strength}`))
    lines.push('')
  }
  if (note.focusAreas.length > 0) {
    lines.push('Entwicklungsfelder:')
    note.focusAreas.forEach((area: string) => lines.push(`  • ${area}`))
    lines.push('')
  }
  if (growth.recentAchievements.length > 0) {
    lines.push('Aktuelle Erfolge:')
    growth.recentAchievements.forEach((achievement) => lines.push(`  • ${achievement.achievement} (${formatGermanDate(achievement.date)})`))
    lines.push('')
  }
  if (note.internalNotes) {
    lines.push('Notizen:')
    lines.push(note.internalNotes)
  }
  return lines.join('\n')
}
