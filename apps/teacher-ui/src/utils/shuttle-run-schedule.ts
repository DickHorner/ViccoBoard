import type { Sport} from '@viccoboard/core'

export interface ShuttleRunSegment {
  level: number
  lane: number
  durationMs: number
  startMs: number
  endMs: number
}

export function buildShuttleRunSchedule(levels: Sport.ShuttleRunLevel[]): ShuttleRunSegment[] {
  const ordered = [...levels].sort((a, b) => a.level - b.level || a.lane - b.lane)
  let offset = 0

  return ordered.map((entry) => {
    const durationMs = Math.max(0, Number(entry.duration) || 0) * 1000
    const startMs = offset
    const endMs = startMs + durationMs
    offset = endMs

    return {
      level: entry.level,
      lane: entry.lane,
      durationMs,
      startMs,
      endMs
    }
  })
}

export function getCurrentShuttleSegment(schedule: ShuttleRunSegment[], elapsedMs: number): ShuttleRunSegment | null {
  if (schedule.length === 0) return null
  if (elapsedMs >= schedule[schedule.length - 1].endMs) return null

  return schedule.find((segment) => elapsedMs < segment.endMs) || null
}
