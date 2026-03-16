import type { StudentLongTermNote, DevelopmentNote, CompetencyArea } from '../repositories/student-long-term-note.repository'
import type { CompetencyProgress, StudentGrowthAnalysis } from './long-term-note.types'

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
  lines.push('Long-Term Development Summary')
  lines.push(`School Year: ${note.schoolYear}`)
  lines.push(`Total Assessments: ${growth.totalNotes}`)
  lines.push(`Competencies Tracked: ${growth.competenciesTracked}`)
  lines.push('')
  lines.push('Progress Overview:')
  lines.push(`  • Improving: ${growth.improvingCount}`)
  lines.push(`  • Stable: ${growth.stableCount}`)
  lines.push(`  • Declining: ${growth.decliningCount}`)
  lines.push(`  • Average Trend: ${growth.averageTrend > 0 ? '+' : ''}${growth.averageTrend.toFixed(1)}%`)
  lines.push('')

  if (note.strengths.length > 0) {
    lines.push('Strengths:')
    note.strengths.forEach((strength: string) => lines.push(`  • ${strength}`))
    lines.push('')
  }
  if (note.focusAreas.length > 0) {
    lines.push('Areas for Development:')
    note.focusAreas.forEach((area: string) => lines.push(`  • ${area}`))
    lines.push('')
  }
  if (growth.recentAchievements.length > 0) {
    lines.push('Recent Achievements:')
    growth.recentAchievements.forEach((achievement) => lines.push(`  • ${achievement.achievement} (${achievement.date.toLocaleDateString()})`))
    lines.push('')
  }
  if (note.internalNotes) {
    lines.push('Notes:')
    lines.push(note.internalNotes)
  }
  return lines.join('\n')
}
