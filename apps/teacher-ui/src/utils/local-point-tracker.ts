export interface PixelFrame {
  width: number
  height: number
  data: Uint8ClampedArray
}

export interface LocalPointTrackerState {
  x: number
  y: number
  patchRadius: number
  template: Uint8Array
  anchorTemplate: Uint8Array
}

export type LocalPointTrackResult =
  | { status: 'tracked'; state: LocalPointTrackerState; score: number }
  | { status: 'lost'; score: number }

const PATCH_RADIUS = 4
const SEARCH_RADIUS = 12
const MAX_FRAME_SCORE = 32
const MAX_ANCHOR_SCORE = 72
const MIN_TEMPLATE_CONTRAST = 18

export function createLocalPointTracker(
  frame: PixelFrame,
  x: number,
  y: number
): LocalPointTrackerState | null {
  const centerX = Math.round(x)
  const centerY = Math.round(y)
  const template = extractGrayPatch(frame, centerX, centerY, PATCH_RADIUS)
  if (!template || getTemplateContrast(template) < MIN_TEMPLATE_CONTRAST) {
    return null
  }

  return {
    x: centerX,
    y: centerY,
    patchRadius: PATCH_RADIUS,
    template,
    anchorTemplate: template.slice()
  }
}

export function trackLocalPoint(
  frame: PixelFrame,
  state: LocalPointTrackerState
): LocalPointTrackResult {
  let bestX = state.x
  let bestY = state.y
  let bestScore = scorePatch(frame, state.template, bestX, bestY, state.patchRadius)

  for (let y = state.y - SEARCH_RADIUS; y <= state.y + SEARCH_RADIUS; y += 1) {
    for (let x = state.x - SEARCH_RADIUS; x <= state.x + SEARCH_RADIUS; x += 1) {
      if (x === state.x && y === state.y) {
        continue
      }

      const score = scorePatch(frame, state.template, x, y, state.patchRadius)
      if (score < bestScore) {
        bestScore = score
        bestX = x
        bestY = y
      }
    }
  }

  if (!Number.isFinite(bestScore) || bestScore > MAX_FRAME_SCORE) {
    return { status: 'lost', score: bestScore }
  }

  const anchorScore = scorePatch(
    frame,
    state.anchorTemplate,
    bestX,
    bestY,
    state.patchRadius
  )
  if (!Number.isFinite(anchorScore) || anchorScore > MAX_ANCHOR_SCORE) {
    return { status: 'lost', score: anchorScore }
  }

  const template = extractGrayPatch(frame, bestX, bestY, state.patchRadius)
  if (!template) {
    return { status: 'lost', score: bestScore }
  }

  return {
    status: 'tracked',
    score: bestScore,
    state: {
      x: bestX,
      y: bestY,
      patchRadius: state.patchRadius,
      template,
      anchorTemplate: state.anchorTemplate
    }
  }
}

function extractGrayPatch(
  frame: PixelFrame,
  centerX: number,
  centerY: number,
  radius: number
): Uint8Array | null {
  if (
    centerX - radius < 0 ||
    centerY - radius < 0 ||
    centerX + radius >= frame.width ||
    centerY + radius >= frame.height
  ) {
    return null
  }

  const size = radius * 2 + 1
  const patch = new Uint8Array(size * size)
  let targetIndex = 0

  for (let y = centerY - radius; y <= centerY + radius; y += 1) {
    for (let x = centerX - radius; x <= centerX + radius; x += 1) {
      const sourceIndex = (y * frame.width + x) * 4
      patch[targetIndex] = Math.round(
        (frame.data[sourceIndex] + frame.data[sourceIndex + 1] + frame.data[sourceIndex + 2]) / 3
      )
      targetIndex += 1
    }
  }

  return patch
}

function getTemplateContrast(template: Uint8Array): number {
  let min = 255
  let max = 0

  for (const value of template) {
    min = Math.min(min, value)
    max = Math.max(max, value)
  }

  return max - min
}

function scorePatch(
  frame: PixelFrame,
  template: Uint8Array,
  centerX: number,
  centerY: number,
  radius: number
): number {
  if (
    centerX - radius < 0 ||
    centerY - radius < 0 ||
    centerX + radius >= frame.width ||
    centerY + radius >= frame.height
  ) {
    return Number.POSITIVE_INFINITY
  }

  let difference = 0
  let templateIndex = 0

  for (let y = centerY - radius; y <= centerY + radius; y += 1) {
    for (let x = centerX - radius; x <= centerX + radius; x += 1) {
      const sourceIndex = (y * frame.width + x) * 4
      const gray = Math.round(
        (frame.data[sourceIndex] + frame.data[sourceIndex + 1] + frame.data[sourceIndex + 2]) / 3
      )
      difference += Math.abs(template[templateIndex] - gray)
      templateIndex += 1
    }
  }

  return difference / template.length
}
