import { buildShuttleRunSchedule, getCurrentShuttleSegment } from '../src/utils/shuttle-run-schedule'

describe('Shuttle run schedule', () => {
  it('builds ordered segments with cumulative timing', () => {
    const schedule = buildShuttleRunSchedule([
      { level: 2, lane: 1, speed: 9, duration: 2 },
      { level: 1, lane: 2, speed: 8.5, duration: 1 },
      { level: 1, lane: 1, speed: 8, duration: 1 }
    ])

    expect(schedule).toHaveLength(3)
    expect(schedule[0]).toMatchObject({ level: 1, lane: 1, startMs: 0, endMs: 1000 })
    expect(schedule[1]).toMatchObject({ level: 1, lane: 2, startMs: 1000, endMs: 2000 })
    expect(schedule[2]).toMatchObject({ level: 2, lane: 1, startMs: 2000, endMs: 4000 })
  })

  it('returns current segment based on elapsed time', () => {
    const schedule = buildShuttleRunSchedule([
      { level: 1, lane: 1, speed: 8, duration: 1 },
      { level: 1, lane: 2, speed: 8.5, duration: 1 }
    ])

    expect(getCurrentShuttleSegment(schedule, 0)?.lane).toBe(1)
    expect(getCurrentShuttleSegment(schedule, 999)?.lane).toBe(1)
    expect(getCurrentShuttleSegment(schedule, 1000)?.lane).toBe(2)
    expect(getCurrentShuttleSegment(schedule, 1500)?.lane).toBe(2)
    expect(getCurrentShuttleSegment(schedule, 2000)).toBeNull()
  })
})
