import { participationEntryDay } from '../src/utils/participation-entry-day'

describe('dated participation assessments', () => {
  it('uses explicit assessment dates instead of the later save timestamp', () => {
    const entry = {
      timestamp: new Date('2026-11-20T12:00:00'),
      metadata: { assessmentDate: '2026-10-16', schoolYear: '2026/2027' }
    }
    expect(participationEntryDay(entry)).toBe('2026-10-16')
  })

  it('maps previously saved assessments without a date to their recording day', () => {
    const timestamp = new Date(2026, 10, 20, 9)
    expect(participationEntryDay({ timestamp, metadata: { schoolYear: '2026/2027' } })).toBe('2026-11-20')
  })

  it('does not treat malformed legacy date metadata as a valid assessment date', () => {
    const timestamp = new Date(2026, 10, 20, 9)
    expect(participationEntryDay({ timestamp, metadata: { assessmentDate: 'unknown' } })).toBe('2026-11-20')
  })
})
