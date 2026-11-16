import type { Sport } from '@viccoboard/core'

type DatedPerformanceEntry = Pick<Sport.PerformanceEntry, 'timestamp' | 'metadata'>

export function isPerformanceEntryInSchoolYear(
  entry: DatedPerformanceEntry,
  schoolYear: string
): boolean {
  const recordedYear = entry.metadata?.schoolYear
  if (typeof recordedYear === 'string') return recordedYear === schoolYear

  const date = entry.timestamp
  if (!Number.isFinite(date.getTime())) return false
  const startYear = date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1
  return schoolYear === `${startYear}/${startYear + 1}`
}
