import {
  INTERVAL_PRESETS,
  circleCircumference,
  calcRingOffset,
  calcTotalIntervalDurationMs,
} from '../src/utils/timer-presets'

describe('INTERVAL_PRESETS', () => {
  it('should have at least 4 presets', () => {
    expect(INTERVAL_PRESETS.length).toBeGreaterThanOrEqual(4)
  })

  it('every preset has work > 0, rounds >= 1, rest >= 0', () => {
    for (const p of INTERVAL_PRESETS) {
      expect(p.work).toBeGreaterThan(0)
      expect(p.rounds).toBeGreaterThanOrEqual(1)
      expect(p.rest).toBeGreaterThanOrEqual(0)
      expect(typeof p.label).toBe('string')
      expect(p.label.length).toBeGreaterThan(0)
    }
  })

  it('TABATA preset is 20/10×8', () => {
    const tabata = INTERVAL_PRESETS.find(p => p.label.startsWith('TABATA'))
    expect(tabata).toBeDefined()
    expect(tabata!.work).toBe(20)
    expect(tabata!.rest).toBe(10)
    expect(tabata!.rounds).toBe(8)
  })

  it('60/0×10 preset has rest = 0', () => {
    const noRest = INTERVAL_PRESETS.find(p => p.rest === 0)
    expect(noRest).toBeDefined()
    expect(noRest!.work).toBe(60)
    expect(noRest!.rounds).toBe(10)
  })
})

describe('circleCircumference', () => {
  it('computes 2πr', () => {
    expect(circleCircumference(80)).toBeCloseTo(2 * Math.PI * 80, 5)
  })

  it('returns 0 for r=0', () => {
    expect(circleCircumference(0)).toBe(0)
  })
})

describe('calcRingOffset', () => {
  const C = circleCircumference(80) // ≈ 502.65

  it('returns 0 (ring full) when timeRemaining = phaseDuration (phase just started)', () => {
    expect(calcRingOffset(10000, 10000, C)).toBeCloseTo(0, 5)
  })

  it('returns circumference (ring empty) when timeRemaining = 0 (phase finished)', () => {
    expect(calcRingOffset(0, 10000, C)).toBeCloseTo(C, 5)
  })

  it('returns half circumference at midpoint', () => {
    expect(calcRingOffset(5000, 10000, C)).toBeCloseTo(C / 2, 5)
  })

  it('clamps timeRemaining below 0 to 0', () => {
    expect(calcRingOffset(-100, 10000, C)).toBeCloseTo(C, 5)
  })

  it('clamps timeRemaining above phaseDuration to phaseDuration', () => {
    expect(calcRingOffset(20000, 10000, C)).toBeCloseTo(0, 5)
  })

  it('returns 0 when phaseDuration is 0 (avoid divide-by-zero)', () => {
    expect(calcRingOffset(0, 0, C)).toBe(0)
  })
})

describe('calcTotalIntervalDurationMs', () => {
  it('TABATA total = 8 × (20+10) × 1000 = 240000 ms', () => {
    expect(calcTotalIntervalDurationMs(20000, 10000, 8)).toBe(240000)
  })

  it('works with zero rest (60/0×10)', () => {
    expect(calcTotalIntervalDurationMs(60000, 0, 10)).toBe(600000)
  })

  it('single round', () => {
    expect(calcTotalIntervalDurationMs(30000, 10000, 1)).toBe(40000)
  })
})
