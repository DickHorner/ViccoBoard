import {
  createLocalPointTracker,
  trackLocalPoint,
  type PixelFrame
} from '../src/utils/local-point-tracker'

function createFrame(width = 48, height = 36): PixelFrame {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let index = 3; index < data.length; index += 4) {
    data[index] = 255
  }
  return { width, height, data }
}

function paintPattern(frame: PixelFrame, centerX: number, centerY: number, offset = 0): void {
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const x = centerX + dx
      const y = centerY + dy
      const value = 80 + offset + (dx + 4) * 8 + (dy + 4) * 5
      const index = (y * frame.width + x) * 4
      frame.data[index] = value
      frame.data[index + 1] = value
      frame.data[index + 2] = value
    }
  }
}

describe('local point tracker', () => {
  it('tracks a seeded patch within the local search window', () => {
    const first = createFrame()
    paintPattern(first, 20, 18)

    const state = createLocalPointTracker(first, 20, 18)
    expect(state).not.toBeNull()

    const next = createFrame()
    paintPattern(next, 24, 15)

    const result = trackLocalPoint(next, state!)
    expect(result.status).toBe('tracked')
    if (result.status === 'tracked') {
      expect(result.state.x).toBe(24)
      expect(result.state.y).toBe(15)
    }
  })

  it('adapts to small frame-to-frame brightness changes', () => {
    const first = createFrame()
    paintPattern(first, 20, 18)

    const state = createLocalPointTracker(first, 20, 18)
    expect(state).not.toBeNull()

    const next = createFrame()
    paintPattern(next, 22, 19, 8)

    const result = trackLocalPoint(next, state!)
    expect(result.status).toBe('tracked')
    if (result.status === 'tracked') {
      expect(result.state.x).toBe(22)
      expect(result.state.y).toBe(19)
    }
  })

  it('reports lost instead of jumping when the seeded feature disappears', () => {
    const first = createFrame()
    paintPattern(first, 20, 18)

    const state = createLocalPointTracker(first, 20, 18)
    expect(state).not.toBeNull()

    const result = trackLocalPoint(createFrame(), state!)
    expect(result.status).toBe('lost')
  })

  it('reports lost when motion exceeds the local search window', () => {
    const first = createFrame()
    paintPattern(first, 16, 18)

    const state = createLocalPointTracker(first, 16, 18)
    expect(state).not.toBeNull()

    const next = createFrame()
    paintPattern(next, 34, 18)

    const result = trackLocalPoint(next, state!)
    expect(result.status).toBe('lost')
  })

  it('rejects low-information seed patches instead of reporting false tracking', () => {
    const frame = createFrame()

    expect(createLocalPointTracker(frame, 20, 18)).toBeNull()
  })

  it('rejects seed points too close to the frame edge', () => {
    const frame = createFrame()
    paintPattern(frame, 4, 4)

    expect(createLocalPointTracker(frame, 2, 2)).toBeNull()
  })
})
