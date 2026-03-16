import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

type AnnotTool = 'pen' | 'arrow' | 'circle' | 'line'
type Resolution = 'sd' | 'hd'

interface DrawPoint {
  x: number
  y: number
}

interface Annotation {
  type: AnnotTool
  color: string
  points: DrawPoint[]
}

interface BufferFrame {
  t: number
  bmp: ImageBitmap
}

const RESOLUTION_MAP: Record<Resolution, { w: number; h: number }> = {
  sd: { w: 640, h: 360 },
  hd: { w: 1280, h: 720 }
}

export function useVideoDelayView() {
  const { t } = useI18n()

  const cameraActive = ref(false)
  const cameraError = ref('')
  const mediaStream = ref<MediaStream | null>(null)
  const delaySeconds = ref(3)
  const selectedFps = ref(30)
  const selectedResolution = ref<Resolution>('sd')

  const activeTool = ref<AnnotTool>('pen')
  const activeColor = ref('#ff0000')
  const annotations = ref<Annotation[]>([])
  let currentAnnotation: Annotation | null = null
  let isDrawing = false

  const liveVideo = ref<HTMLVideoElement | null>(null)
  const delayCanvas = ref<HTMLCanvasElement | null>(null)
  const annotCanvas = ref<HTMLCanvasElement | null>(null)

  let captureCanvas: HTMLCanvasElement | null = null
  let captureCtx: CanvasRenderingContext2D | null = null
  const frameBuffer: BufferFrame[] = []
  let rafId: number | null = null
  let lastCaptureTs = 0

  const captureW = computed(() => RESOLUTION_MAP[selectedResolution.value].w)
  const captureH = computed(() => RESOLUTION_MAP[selectedResolution.value].h)

  const annotTools: Array<{ type: AnnotTool; icon: string; labelKey: string }> = [
    { type: 'pen', icon: '✏️', labelKey: 'DELAY.toolPen' },
    { type: 'arrow', icon: '➡️', labelKey: 'DELAY.toolArrow' },
    { type: 'circle', icon: '⭕', labelKey: 'DELAY.toolCircle' },
    { type: 'line', icon: '📏', labelKey: 'DELAY.toolLine' }
  ]

  const annotColors = [
    { value: '#ff0000', label: 'Red' },
    { value: '#ffcc00', label: 'Yellow' },
    { value: '#00cc44', label: 'Green' },
    { value: '#0044ff', label: 'Blue' },
    { value: '#ffffff', label: 'White' }
  ]

  const annotToolCursor = 'crosshair'

  async function startCamera(): Promise<void> {
    cameraError.value = ''
    const { w, h } = RESOLUTION_MAP[selectedResolution.value]
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: w },
          height: { ideal: h },
          frameRate: { ideal: selectedFps.value }
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
      captureCanvas.width = w
      captureCanvas.height = h
      captureCtx = captureCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D

      cameraActive.value = true
      startRenderLoop()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('notallowed')) {
        cameraError.value = t('DELAY.noCameraPermission')
      } else {
        cameraError.value = message
      }
    }
  }

  function stopCamera(): void {
    cameraActive.value = false
    stopRenderLoop()
    if (mediaStream.value) {
      for (const track of mediaStream.value.getTracks()) track.stop()
      mediaStream.value = null
    }
    if (liveVideo.value) liveVideo.value.srcObject = null
    for (const frame of frameBuffer) frame.bmp.close()
    frameBuffer.length = 0
    clearDelayCanvas()
    captureCanvas = null
    captureCtx = null
  }

  function startRenderLoop(): void {
    lastCaptureTs = 0
    const captureIntervalMs = 1000 / selectedFps.value
    function loop(ts: number): void {
      if (!cameraActive.value) return
      if (ts - lastCaptureTs >= captureIntervalMs) {
        lastCaptureTs = ts
        captureFrameAsync()
      }
      renderDelayedFrame()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
  }

  function stopRenderLoop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function captureFrameAsync(): void {
    if (!captureCtx || !captureCanvas || !liveVideo.value) return
    const video = liveVideo.value
    if (video.readyState < 2 || video.paused) return
    captureCtx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height)
    createImageBitmap(captureCanvas).then((bmp) => {
      frameBuffer.push({ t: Date.now(), bmp })
      trimBuffer()
    }).catch(() => {})
  }

  function trimBuffer(): void {
    const maxKeepMs = (10 + 2) * 1000
    const now = Date.now()
    while (frameBuffer.length > 0 && now - frameBuffer[0].t > maxKeepMs) {
      frameBuffer.shift()!.bmp.close()
    }
  }

  function renderDelayedFrame(): void {
    const ctx = delayCanvas.value?.getContext('2d') as CanvasRenderingContext2D | null
    if (!ctx) return
    const targetTime = Date.now() - delaySeconds.value * 1000
    let best: BufferFrame | null = null
    for (let i = frameBuffer.length - 1; i >= 0; i--) {
      if (frameBuffer[i].t <= targetTime) {
        best = frameBuffer[i]
        break
      }
    }
    if (best) {
      ctx.drawImage(best.bmp, 0, 0, captureW.value, captureH.value)
    } else if (delaySeconds.value === 0 && frameBuffer.length > 0) {
      ctx.drawImage(frameBuffer[frameBuffer.length - 1].bmp, 0, 0, captureW.value, captureH.value)
    }
  }

  function clearDelayCanvas(): void {
    const ctx = delayCanvas.value?.getContext('2d') as CanvasRenderingContext2D | null
    if (!ctx) return
    ctx.clearRect(0, 0, captureW.value, captureH.value)
  }

  function getAnnotCtx(): CanvasRenderingContext2D | null {
    return (annotCanvas.value?.getContext('2d') as CanvasRenderingContext2D | null) ?? null
  }

  function canvasPoint(event: { clientX: number; clientY: number }): DrawPoint {
    const canvas = annotCanvas.value
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    }
  }

  function onDrawStart(event: MouseEvent): void {
    isDrawing = true
    currentAnnotation = {
      type: activeTool.value,
      color: activeColor.value,
      points: [canvasPoint(event)]
    }
  }

  function onDrawMove(event: MouseEvent): void {
    if (!isDrawing || !currentAnnotation) return
    const point = canvasPoint(event)
    if (activeTool.value === 'pen') {
      currentAnnotation.points.push(point)
      redrawAnnotations()
    } else {
      redrawAnnotations({ preview: { ...currentAnnotation, points: [currentAnnotation.points[0], point] } })
    }
  }

  function onDrawEnd(event: MouseEvent | Event): void {
    if (!isDrawing || !currentAnnotation) return
    isDrawing = false
    const finalPoint = event instanceof MouseEvent
      ? canvasPoint(event)
      : currentAnnotation.points[currentAnnotation.points.length - 1]
    if (activeTool.value === 'pen') {
      annotations.value.push({ ...currentAnnotation })
    } else {
      annotations.value.push({
        type: currentAnnotation.type,
        color: currentAnnotation.color,
        points: [currentAnnotation.points[0], finalPoint]
      })
    }
    currentAnnotation = null
    redrawAnnotations()
  }

  function touchToPoint(touch: Touch): DrawPoint {
    return canvasPoint({ clientX: touch.clientX, clientY: touch.clientY })
  }

  function onTouchDrawStart(event: TouchEvent): void {
    if (event.touches.length > 0) {
      isDrawing = true
      currentAnnotation = {
        type: activeTool.value,
        color: activeColor.value,
        points: [touchToPoint(event.touches[0])]
      }
    }
  }

  function onTouchDrawMove(event: TouchEvent): void {
    if (!isDrawing || !currentAnnotation || event.touches.length === 0) return
    const point = touchToPoint(event.touches[0])
    if (activeTool.value === 'pen') {
      currentAnnotation.points.push(point)
      redrawAnnotations()
    } else {
      redrawAnnotations({ preview: { ...currentAnnotation, points: [currentAnnotation.points[0], point] } })
    }
  }

  function clearAnnotations(): void {
    annotations.value = []
    currentAnnotation = null
    isDrawing = false
    const ctx = getAnnotCtx()
    if (ctx) ctx.clearRect(0, 0, captureW.value, captureH.value)
  }

  function redrawAnnotations(opts?: { preview?: Annotation }): void {
    const ctx = getAnnotCtx()
    if (!ctx) return
    ctx.clearRect(0, 0, captureW.value, captureH.value)
    for (const annotation of annotations.value) drawAnnotation(ctx, annotation)
    if (opts?.preview) drawAnnotation(ctx, opts.preview)
  }

  function drawAnnotation(ctx: CanvasRenderingContext2D, annotation: Annotation): void {
    if (annotation.points.length === 0) return
    ctx.strokeStyle = annotation.color
    ctx.fillStyle = annotation.color
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const [start] = annotation.points
    const end = annotation.points[annotation.points.length - 1]

    switch (annotation.type) {
      case 'pen':
        if (annotation.points.length < 2) return
        ctx.beginPath()
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y)
        for (let i = 1; i < annotation.points.length; i++) {
          ctx.lineTo(annotation.points[i].x, annotation.points[i].y)
        }
        ctx.stroke()
        break
      case 'line':
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
        break
      case 'arrow': {
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
        const angle = Math.atan2(end.y - start.y, end.x - start.x)
        const headLen = 18
        ctx.beginPath()
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(end.x - headLen * Math.cos(angle - 0.4), end.y - headLen * Math.sin(angle - 0.4))
        ctx.lineTo(end.x - headLen * Math.cos(angle + 0.4), end.y - headLen * Math.sin(angle + 0.4))
        ctx.closePath()
        ctx.fill()
        break
      }
      case 'circle': {
        const radius = Math.max(4, Math.hypot(end.x - start.x, end.y - start.y))
        ctx.beginPath()
        ctx.arc(start.x, start.y, radius, 0, Math.PI * 2)
        ctx.stroke()
        break
      }
    }
  }

  onBeforeUnmount(() => {
    if (cameraActive.value) stopCamera()
  })

  return {
    activeColor,
    activeTool,
    annotCanvas,
    annotColors,
    annotToolCursor,
    annotTools,
    cameraActive,
    cameraError,
    captureH,
    captureW,
    clearAnnotations,
    delayCanvas,
    delaySeconds,
    liveVideo,
    onDrawEnd,
    onDrawMove,
    onDrawStart,
    onTouchDrawMove,
    onTouchDrawStart,
    selectedFps,
    selectedResolution,
    startCamera,
    stopCamera
  }
}
