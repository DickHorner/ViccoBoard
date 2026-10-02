export interface BasketballPixelFrame {
  width: number
  height: number
  data: Uint8ClampedArray
}

export interface BasketballMotionBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const RIM_BAND_Y_MIN = 0.44
const RIM_BAND_Y_MAX = 0.56
const MIN_REFERENCE_EDGE_GRADIENT = 28
const MAX_STABLE_PIXEL_DIFFERENCE = 20
const MIN_EDGE_COLUMNS = 6
const MIN_STABLE_EDGE_FRACTION = 0.65

/**
 * Looks for the visual signature of the ball passing behind the front rim:
 * motion spans the ring plane while a horizontal edge from the empty-hoop
 * reference frame stays visible through the moving object's x-range.
 */
export function hasBasketballRimOcclusionEvidence(
  reference: BasketballPixelFrame,
  current: BasketballPixelFrame,
  motionBounds: BasketballMotionBounds
): boolean {
  if (
    reference.width !== current.width ||
    reference.height !== current.height ||
    reference.data.length !== current.data.length ||
    reference.width < 3 ||
    reference.height < 3
  ) {
    return false
  }

  const bandStart = Math.max(1, Math.floor(reference.height * RIM_BAND_Y_MIN))
  const bandEnd = Math.min(reference.height - 2, Math.ceil(reference.height * RIM_BAND_Y_MAX))

  if (motionBounds.minY > bandStart || motionBounds.maxY < bandEnd) {
    return false
  }

  const xStart = Math.max(0, Math.floor(motionBounds.minX))
  const xEnd = Math.min(reference.width - 1, Math.ceil(motionBounds.maxX))
  if (xEnd - xStart + 1 < MIN_EDGE_COLUMNS) {
    return false
  }

  let edgeColumns = 0
  let stableEdgeColumns = 0

  for (let x = xStart; x <= xEnd; x += 1) {
    let strongestGradient = 0
    let strongestY = -1

    for (let y = bandStart; y <= bandEnd; y += 1) {
      const above = grayAt(reference, x, y - 1)
      const below = grayAt(reference, x, y + 1)
      const gradient = Math.abs(above - below)

      if (gradient > strongestGradient) {
        strongestGradient = gradient
        strongestY = y
      }
    }

    if (strongestGradient < MIN_REFERENCE_EDGE_GRADIENT || strongestY < 0) {
      continue
    }

    edgeColumns += 1
    if (pixelDifference(reference, current, x, strongestY) <= MAX_STABLE_PIXEL_DIFFERENCE) {
      stableEdgeColumns += 1
    }
  }

  if (edgeColumns < MIN_EDGE_COLUMNS) {
    return false
  }

  return stableEdgeColumns / edgeColumns >= MIN_STABLE_EDGE_FRACTION
}

function grayAt(frame: BasketballPixelFrame, x: number, y: number): number {
  const index = (y * frame.width + x) * 4
  return (frame.data[index] + frame.data[index + 1] + frame.data[index + 2]) / 3
}

function pixelDifference(
  reference: BasketballPixelFrame,
  current: BasketballPixelFrame,
  x: number,
  y: number
): number {
  const index = (y * reference.width + x) * 4
  return (
    Math.abs(reference.data[index] - current.data[index]) +
    Math.abs(reference.data[index + 1] - current.data[index + 1]) +
    Math.abs(reference.data[index + 2] - current.data[index + 2])
  ) / 3
}
