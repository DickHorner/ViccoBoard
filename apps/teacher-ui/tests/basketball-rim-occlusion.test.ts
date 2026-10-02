import {
  hasBasketballRimOcclusionEvidence,
  type BasketballPixelFrame
} from '../src/utils/basketball-rim-occlusion'

function createFrame(width = 40, height = 30): BasketballPixelFrame {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let index = 3; index < data.length; index += 4) {
    data[index] = 255
  }
  return { width, height, data }
}

function paintHorizontalEdge(frame: BasketballPixelFrame, y: number, xStart: number, xEnd: number): void {
  for (let x = xStart; x <= xEnd; x += 1) {
    setPixel(frame, x, y - 1, 40)
    setPixel(frame, x, y, 110)
    setPixel(frame, x, y + 1, 210)
  }
}

function paintBlock(
  frame: BasketballPixelFrame,
  xStart: number,
  xEnd: number,
  yStart: number,
  yEnd: number,
  value: number
): void {
  for (let y = yStart; y <= yEnd; y += 1) {
    for (let x = xStart; x <= xEnd; x += 1) {
      setPixel(frame, x, y, value)
    }
  }
}

function setPixel(frame: BasketballPixelFrame, x: number, y: number, value: number): void {
  const index = (y * frame.width + x) * 4
  frame.data[index] = value
  frame.data[index + 1] = value
  frame.data[index + 2] = value
}

describe('basketball rim occlusion evidence', () => {
  it('accepts a crossing when the reference rim edge stays visible', () => {
    const reference = createFrame()
    paintHorizontalEdge(reference, 15, 10, 29)
    const current = {
      ...reference,
      data: reference.data.slice()
    }

    expect(hasBasketballRimOcclusionEvidence(reference, current, {
      minX: 12,
      maxX: 27,
      minY: 10,
      maxY: 20
    })).toBe(true)
  })

  it('rejects a crossing when the moving object covers the rim edge', () => {
    const reference = createFrame()
    paintHorizontalEdge(reference, 15, 10, 29)
    const current = {
      ...reference,
      data: reference.data.slice()
    }
    paintBlock(current, 12, 27, 13, 17, 150)

    expect(hasBasketballRimOcclusionEvidence(reference, current, {
      minX: 12,
      maxX: 27,
      minY: 10,
      maxY: 20
    })).toBe(false)
  })

  it('rejects motion that does not span the ring plane', () => {
    const reference = createFrame()
    paintHorizontalEdge(reference, 15, 10, 29)
    const current = {
      ...reference,
      data: reference.data.slice()
    }

    expect(hasBasketballRimOcclusionEvidence(reference, current, {
      minX: 12,
      maxX: 27,
      minY: 2,
      maxY: 10
    })).toBe(false)
  })

  it('rejects a target area without a horizontal rim edge', () => {
    const reference = createFrame()
    const current = createFrame()

    expect(hasBasketballRimOcclusionEvidence(reference, current, {
      minX: 12,
      maxX: 27,
      minY: 10,
      maxY: 20
    })).toBe(false)
  })
})
