import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { BasketballShotCounter } from '@viccoboard/sport'

import { getSportBridge } from './useSportBridge'
import { hasBasketballRimOcclusionEvidence } from '../utils/basketball-rim-occlusion'

interface ZoneRect {
  x: number
  y: number
  w: number
  h: number
}

interface DrawOrigin {
  x: number
  y: number
}

const CAPTURE_W = 640
const CAPTURE_H = 360
const MOTION_PIXEL_THRESHOLD = 30
const MIN_ZONE_SIZE = 10

export function useTrackingBasketballView() {
  const { t } = useI18n()

  const cameraActive = ref(false)
  const cameraError = ref('')
  const mediaStream = ref<MediaStream | null>(null)
  const targetZone = ref<ZoneRect | null>(null)
  let isDefiningZone = false
  let zoneOrigin: DrawOrigin | null = null
  let draftZone: ZoneRect | null = null

  const trackingActive = ref(false)
  const shotCount = ref(0)
  const sessionSaved = ref(false)
  const sensitivity = ref(5)

  let sessionStartTime = 0
  const sessionElapsedMs = ref(0)
  let timerHandle: ReturnType<typeof setInterval> | null = null

  const liveVideo = ref<HTMLVideoElement | null>(null)
  const mainCanvas = ref<HTMLCanvasElement | null>(null)

  let captureCanvas: HTMLCanvasElement | null = null
  let captureCtx: CanvasRenderingContext2D | null = null
  let prevFrameData: ImageData | null = null
  let rimReferenceFrame: ImageData | null = null
  let rafId: number | null = null

  const shotCounter = new BasketballShotCounter()

  function getMotionThreshold(): number {
    return 0.25 - (sensitivity.value - 1) * (0.21 / 9)
  }

  const formattedTime = computed(() => {
    const totalSec = Math.floor(sessionElapsedMs.value / 1000)
    const minutes = Math.floor(totalSec / 60)
    const seconds = totalSec % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  const sensitivityLabel = computed(() => String(sensitivity.value))

  const statusText = computed(() => {
    if (trackingActive.value) return t('TRACKING.basketball.status.running')
    if (shotCount.value > 0) return t('TRACKING.basketball.status.stopped')
    return t('TRACKING.basketball.status.ready')
  })

  const statusClass = computed(() => {
    if (trackingActive.value) return 'status-pill--running'
    if (shotCount.value > 0) return 'status-pill--stopped'
    return 'status-pill--ready'
  })

  async function startCamera(): Promise<void> {
    cameraError.value = ''
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: CAPTURE_W },
          height: { ideal: CAPTURE_H },
          frameRate: { ideal: 30 },
          facingMode: { ideal: 'environment' }
        },
        audio: false
      })

      mediaStream.value = stream
      const video = liveVideo.value
      if (!video) throw new Error('Video element not available')
      video.srcObject = stream
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve()
        video.onerror = (event) => reject(event)
      })
      await video.play()

      captureCanvas = document.createElement('canvas')
      captureCanvas.width = CAPTURE_W
      captureCanvas.height = CAPTURE_H
      const ctx2d = captureCanvas.getContext('2d', { willReadFrequently: true })
      if (!ctx2d) throw new Error('Failed to get 2D canvas context')
      captureCtx = ctx2d

      cameraActive.value = true
      startRenderLoop()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('notallowed')) {
        cameraError.value = t('TRACKING.basketball.noCameraPermission')
      } else {
        cameraError.value = message
      }
    }
  }

  function stopCamera(): void {
    stopTracking()
    cameraActive.value = false
    stopRenderLoop()
    if (mediaStream.value) {
      for (const track of mediaStream.value.getTracks()) track.stop()
      mediaStream.value = null
    }
    if (liveVideo.value) liveVideo.value.srcObject = null
    prevFrameData = null
    rimReferenceFrame = null
    draftZone = null
    isDefiningZone = false
  }

  function retryCamera(): void {
    cameraError.value = ''
    void startCamera()
  }

  function startRenderLoop(): void {
    if (rafId !== null) return
    function loop(): void {
      if (!cameraActive.value) return
      rafId = requestAnimationFrame(loop)
      renderFrame()
    }
    rafId = requestAnimationFrame(loop)
  }

  function stopRenderLoop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function renderFrame(): void {
    const video = liveVideo.value
    const canvas = mainCanvas.value
    if (!video || !canvas || !captureCtx || !captureCanvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    captureCtx.drawImage(video, 0, 0, CAPTURE_W, CAPTURE_H)
    ctx.drawImage(captureCanvas, 0, 0)

    const zone = draftZone ?? targetZone.value
    if (zone) drawZoneOverlay(ctx, zone, !!draftZone)
    if (trackingActive.value && targetZone.value) detectShot(captureCtx, targetZone.value)
  }

  function drawZoneOverlay(ctx: CanvasRenderingContext2D, zone: ZoneRect, isDraft: boolean): void {
    ctx.save()
    ctx.strokeStyle = isDraft ? 'rgba(255, 200, 0, 0.9)' : 'rgba(255, 80, 0, 0.9)'
    ctx.lineWidth = 3
    ctx.setLineDash(isDraft ? [8, 4] : [])
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h)
    ctx.beginPath()
    ctx.moveTo(zone.x, zone.y + zone.h / 2)
    ctx.lineTo(zone.x + zone.w, zone.y + zone.h / 2)
    ctx.stroke()
    ctx.fillStyle = isDraft ? 'rgba(255, 200, 0, 0.08)' : 'rgba(255, 80, 0, 0.10)'
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h)
    ctx.setLineDash([])
    ctx.fillStyle = isDraft ? 'rgba(255, 200, 0, 1)' : 'rgba(255, 80, 0, 1)'
    ctx.font = 'bold 14px system-ui, sans-serif'
    ctx.fillText('🎯', zone.x + 4, zone.y + 18)
    ctx.restore()
  }

  function detectShot(ctx: CanvasRenderingContext2D, zone: ZoneRect): void {
    const x = Math.max(0, Math.round(zone.x))
    const y = Math.max(0, Math.round(zone.y))
    const w = Math.min(Math.round(zone.w), CAPTURE_W - x)
    const h = Math.min(Math.round(zone.h), CAPTURE_H - y)
    if (w <= 0 || h <= 0) return

    const currentFrame = ctx.getImageData(x, y, w, h)
    if (!prevFrameData || prevFrameData.width !== w || prevFrameData.height !== h) {
      prevFrameData = currentFrame
      rimReferenceFrame = currentFrame
      return
    }

    const d1 = currentFrame.data
    const d2 = prevFrameData.data
    let changedPixels = 0
    let totalMotion = 0
    let weightedX = 0
    let weightedY = 0
    let minMotionX = w
    let maxMotionX = -1
    let minMotionY = h
    let maxMotionY = -1
    const totalPixels = w * h

    for (let i = 0; i < d1.length; i += 4) {
      const dr = Math.abs(d1[i] - d2[i])
      const dg = Math.abs(d1[i + 1] - d2[i + 1])
      const db = Math.abs(d1[i + 2] - d2[i + 2])
      const motion = (dr + dg + db) / 3
      if (motion <= MOTION_PIXEL_THRESHOLD) continue

      const pixelIndex = i / 4
      const pixelX = pixelIndex % w
      const pixelY = Math.floor(pixelIndex / w)
      changedPixels++
      totalMotion += motion
      weightedX += motion * pixelX
      weightedY += motion * pixelY
      minMotionX = Math.min(minMotionX, pixelX)
      maxMotionX = Math.max(maxMotionX, pixelX)
      minMotionY = Math.min(minMotionY, pixelY)
      maxMotionY = Math.max(maxMotionY, pixelY)
    }

    const motionFraction = changedPixels / totalPixels
    const threshold = getMotionThreshold()
    const now = Date.now()

    if (motionFraction > threshold && totalMotion > 0) {
      const rimOcclusionObserved = rimReferenceFrame
        ? hasBasketballRimOcclusionEvidence(rimReferenceFrame, currentFrame, {
            minX: minMotionX,
            maxX: maxMotionX,
            minY: minMotionY,
            maxY: maxMotionY
          })
        : false

      shotCounter.processFrame({
        x: weightedX / totalMotion / (w - 1),
        y: weightedY / totalMotion / (h - 1),
        rimOcclusionObserved
      }, now)
    } else {
      shotCounter.processFrame(null, now)
    }

    shotCount.value = shotCounter.getCount()
    prevFrameData = currentFrame
  }

  function getCanvasCoords(event: MouseEvent | Touch): { x: number; y: number } {
    const canvas = mainCanvas.value
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = CAPTURE_W / rect.width
    const scaleY = CAPTURE_H / rect.height
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    }
  }

  function onZoneStart(event: MouseEvent): void {
    if (trackingActive.value) return
    isDefiningZone = true
    zoneOrigin = getCanvasCoords(event)
    draftZone = null
  }

  function onZoneMove(event: MouseEvent): void {
    if (!isDefiningZone || !zoneOrigin) return
    draftZone = buildRect(zoneOrigin, getCanvasCoords(event))
  }

  function onZoneEnd(): void {
    if (!isDefiningZone || !draftZone) {
      isDefiningZone = false
      return
    }
    if (Math.abs(draftZone.w) > MIN_ZONE_SIZE && Math.abs(draftZone.h) > MIN_ZONE_SIZE) {
      targetZone.value = normalizeRect(draftZone)
      shotCounter.resetTrajectory()
      rimReferenceFrame = null
    }
    draftZone = null
    isDefiningZone = false
    zoneOrigin = null
    prevFrameData = null
  }

  function onTouchZoneStart(event: TouchEvent): void {
    if (trackingActive.value) return
    const touch = event.touches[0]
    if (!touch) return
    isDefiningZone = true
    zoneOrigin = getCanvasCoords(touch)
    draftZone = null
  }

  function onTouchZoneMove(event: TouchEvent): void {
    if (!isDefiningZone || !zoneOrigin) return
    const touch = event.touches[0]
    if (!touch) return
    draftZone = buildRect(zoneOrigin, getCanvasCoords(touch))
  }

  function buildRect(origin: DrawOrigin, current: { x: number; y: number }): ZoneRect {
    return { x: origin.x, y: origin.y, w: current.x - origin.x, h: current.y - origin.y }
  }

  function normalizeRect(rect: ZoneRect): ZoneRect {
    return {
      x: rect.w >= 0 ? rect.x : rect.x + rect.w,
      y: rect.h >= 0 ? rect.y : rect.y + rect.h,
      w: Math.abs(rect.w),
      h: Math.abs(rect.h)
    }
  }

  function clearZone(): void {
    targetZone.value = null
    prevFrameData = null
    rimReferenceFrame = null
    shotCounter.resetTrajectory()
  }

  function startTracking(): void {
    if (!targetZone.value) return
    trackingActive.value = true
    sessionSaved.value = false
    shotCounter.resetTrajectory()
    prevFrameData = null
    rimReferenceFrame = null
    sessionElapsedMs.value = 0
    sessionStartTime = Date.now()
    timerHandle = setInterval(() => {
      sessionElapsedMs.value = Date.now() - sessionStartTime
    }, 500)
  }

  function stopTracking(): void {
    if (!trackingActive.value) return
    trackingActive.value = false
    shotCounter.resetTrajectory()
    if (timerHandle !== null) {
      clearInterval(timerHandle)
      timerHandle = null
    }
    void saveSession()
  }

  function resetSession(): void {
    if (trackingActive.value) return
    shotCounter.reset()
    shotCount.value = shotCounter.getCount()
    sessionElapsedMs.value = 0
    prevFrameData = null
    rimReferenceFrame = null
    sessionSaved.value = false
  }

  async function saveSession(): Promise<void> {
    if (shotCount.value === 0) return
    try {
      const bridge = getSportBridge()
      await bridge.toolSessionRepository.create({
        toolType: 'tracking-basketball',
        sessionMetadata: {
          shots: shotCount.value,
          durationMs: sessionElapsedMs.value,
          sensitivity: sensitivity.value
        },
        startedAt: new Date(sessionStartTime),
        endedAt: new Date()
      })
      sessionSaved.value = true
    } catch (error) {
      console.warn('Failed to save basketball tracking session:', error)
    }
  }

  onBeforeUnmount(() => {
    stopRenderLoop()
    if (timerHandle !== null) clearInterval(timerHandle)
    if (mediaStream.value) {
      for (const track of mediaStream.value.getTracks()) track.stop()
    }
  })

  return {
    cameraActive,
    cameraError,
    captureH: CAPTURE_H,
    captureW: CAPTURE_W,
    clearZone,
    formattedTime,
    liveVideo,
    mainCanvas,
    onTouchZoneMove,
    onTouchZoneStart,
    onZoneEnd,
    onZoneMove,
    onZoneStart,
    resetSession,
    retryCamera,
    sensitivity,
    sensitivityLabel,
    sessionSaved,
    shotCount,
    startCamera,
    startTracking,
    statusClass,
    statusText,
    stopCamera,
    stopTracking,
    targetZone,
    trackingActive
  }
}
