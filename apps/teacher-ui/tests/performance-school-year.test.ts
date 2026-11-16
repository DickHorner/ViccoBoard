import type { Sport } from '@viccoboard/core'
import { isPerformanceEntryInSchoolYear } from '../src/utils/performance-school-year'

function entry(timestamp: string, schoolYear?: string): Pick<Sport.PerformanceEntry, 'timestamp' | 'metadata'> {
  return {
    timestamp: new Date(timestamp),
    metadata: schoolYear === undefined ? undefined : { schoolYear }
  }
}

describe('performance entry school-year scope', () => {
  test('keeps preexisting entries in their recorded school year based on date', () => {
    const previous = entry('2026-06-15T12:00:00')
    const current = entry('2026-11-15T12:00:00')

    expect(isPerformanceEntryInSchoolYear(previous, '2025/2026')).toBe(true)
    expect(isPerformanceEntryInSchoolYear(previous, '2026/2027')).toBe(false)
    expect(isPerformanceEntryInSchoolYear(current, '2026/2027')).toBe(true)
  })

  test('uses the explicitly recorded school year even when saved later', () => {
    const retroactive = entry('2026-11-15T12:00:00', '2025/2026')

    expect(isPerformanceEntryInSchoolYear(retroactive, '2025/2026')).toBe(true)
    expect(isPerformanceEntryInSchoolYear(retroactive, '2026/2027')).toBe(false)
  })

  test('only selects the current-year entry when reusing a category', () => {
    const oldEntry = entry('2026-06-15T12:00:00')
    const newEntry = entry('2026-11-15T12:00:00', '2026/2027')
    const entries = [newEntry, oldEntry]

    expect(entries.find(candidate => isPerformanceEntryInSchoolYear(candidate, '2025/2026')))
      .toBe(oldEntry)
    expect(entries.find(candidate => isPerformanceEntryInSchoolYear(candidate, '2026/2027')))
      .toBe(newEntry)
  })
})
