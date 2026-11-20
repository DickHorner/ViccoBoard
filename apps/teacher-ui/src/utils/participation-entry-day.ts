import type { Sport } from '@viccoboard/core'

export function participationEntryDay(entry: Pick<Sport.PerformanceEntry, 'metadata' | 'timestamp'>): string {
  const recorded = entry.metadata?.assessmentDate
  if (typeof recorded === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(recorded)) return recorded

  const date = entry.timestamp
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
