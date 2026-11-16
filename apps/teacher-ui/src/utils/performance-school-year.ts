import type { Sport } from '@viccoboard/core'
import { schoolYearForDate } from './exam-school-year'

type DatedPerformanceEntry = Pick<Sport.PerformanceEntry, 'timestamp' | 'metadata'>

export function isPerformanceEntryInSchoolYear(
  entry: DatedPerformanceEntry,
  schoolYear: string
): boolean {
  const recordedYear = entry.metadata?.schoolYear
  if (typeof recordedYear === 'string') return recordedYear === schoolYear

  return schoolYearForDate(entry.timestamp) === schoolYear
}
