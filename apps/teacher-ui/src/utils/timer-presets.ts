/**
 * Interval timer preset definitions and helper math used by Timer.vue.
 * Extracted here so they can be unit-tested without a DOM / Vue context.
 */

export interface IntervalPreset {
  /** Human-readable label shown on the chip */
  label: string
  /** Work phase duration in seconds */
  work: number
  /** Rest phase duration in seconds (0 = no rest) */
  rest: number
  /** Number of rounds */
  rounds: number
}

/** Standard interval-training presets */
export const INTERVAL_PRESETS: IntervalPreset[] = [
  { label: 'TABATA (20/10×8)', work: 20, rest: 10, rounds: 8 },
  { label: '30/10×8', work: 30, rest: 10, rounds: 8 },
  { label: '60/0×10', work: 60, rest: 0, rounds: 10 },
  { label: '45/15×6', work: 45, rest: 15, rounds: 6 },
  { label: '30/30×6', work: 30, rest: 30, rounds: 6 },
  { label: '20/40×10', work: 20, rest: 40, rounds: 10 },
]

/** SVG circle circumference for radius r */
export function circleCircumference(r: number): number {
  return 2 * Math.PI * r
}

/**
 * Calculate stroke-dashoffset for a depleting progress ring.
 *
 * SVG semantics:
 *   dashoffset = 0            → ring fully visible (full)
 *   dashoffset = circumference → ring fully hidden  (empty)
 *
 * This function returns an offset that represents **remaining time**:
 *   - At phase start  (timeRemaining = phaseDurationMs) → dashoffset = 0  (ring full)
 *   - At phase finish (timeRemaining = 0)               → dashoffset = circumference (ring empty)
 */
export function calcRingOffset(
  timeRemaining: number,
  phaseDurationMs: number,
  circumference: number,
): number {
  if (phaseDurationMs <= 0) return 0
  const remaining = Math.max(0, Math.min(timeRemaining, phaseDurationMs))
  return circumference * (1 - remaining / phaseDurationMs)
}

/**
 * Total duration of an interval workout in milliseconds.
 * = rounds × (workMs + restMs)
 */
export function calcTotalIntervalDurationMs(
  workMs: number,
  restMs: number,
  rounds: number,
): number {
  return rounds * (workMs + restMs)
}
