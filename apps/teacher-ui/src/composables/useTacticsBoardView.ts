import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Sport } from '@viccoboard/core'

import { getSportBridge, initializeSportBridge } from './useSportBridge'

type ToolType = Sport.TacticsMarking['type']

const CANVAS_W = 680
const CANVAS_H = 450

export function useTacticsBoardView() {
  const { t } = useI18n()

  initializeSportBridge()
  const bridge = getSportBridge()

  const tools: Array<{ type: ToolType; labelKey: string; icon: string }> = [
    { type: 'player', labelKey: 'TACTICS.toolPlayer', icon: '👤' },
    { type: 'ball', labelKey: 'TACTICS.toolBall', icon: '⚽' },
    { type: 'arrow', labelKey: 'TACTICS.toolArrow', icon: '↗' },
    { type: 'line', labelKey: 'TACTICS.toolLine', icon: '—' },
    { type: 'circle', labelKey: 'TACTICS.toolCircle', icon: '○' },
    { type: 'text', labelKey: 'TACTICS.toolText', icon: 'T' }
  ]

  const activeTool = ref<ToolType>('player')
  const activeColor = ref<'red' | 'blue'>('red')
  const background = ref<Sport.TacticsBoardSnapshot['background']>('field')
  const markings = ref<Sport.TacticsMarking[]>([])
  const boardCanvas = ref<HTMLCanvasElement | null>(null)

  const snapshotTitle = ref('')
  const snapshotSport = ref('')
  const saving = ref(false)
  const saveMessage = ref('')
  const snapshots = ref<Sport.TacticsBoardSnapshot[]>([])

  let isDrawing = false
  let drawStart = { x: 0, y: 0 }

  function getCtx(): CanvasRenderingContext2D | null {
    return boardCanvas.value?.getContext('2d') ?? null
  }

  function canvasPoint(event: MouseEvent | { clientX: number; clientY: number }): { x: number; y: number } {
    const rect = boardCanvas.value!.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    }
  }

  function drawBackground(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    if (background.value === 'custom') {
      ctx.fillStyle = '#f9f9f9'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      return
    }
    ctx.fillStyle = '#4a9e4a'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    if (background.value === 'field') drawFootballField(ctx)
    else if (background.value === 'court') drawBasketballCourt(ctx)
    else if (background.value === 'pitch') drawHandballPitch(ctx)
  }

  function drawFootballField(ctx: CanvasRenderingContext2D): void {
    ctx.strokeRect(20, 20, CANVAS_W - 40, CANVAS_H - 40)
    ctx.beginPath()
    ctx.moveTo(CANVAS_W / 2, 20)
    ctx.lineTo(CANVAS_W / 2, CANVAS_H - 20)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(CANVAS_W / 2, CANVAS_H / 2, 50, 0, Math.PI * 2)
    ctx.stroke()
    const paW = 120
    const paH = 220
    ctx.strokeRect(20, (CANVAS_H - paH) / 2, paW, paH)
    ctx.strokeRect(CANVAS_W - 20 - paW, (CANVAS_H - paH) / 2, paW, paH)
  }

  function drawBasketballCourt(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#c8a46e'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.strokeStyle = 'white'
    ctx.strokeRect(20, 20, CANVAS_W - 40, CANVAS_H - 40)
    ctx.beginPath()
    ctx.moveTo(CANVAS_W / 2, 20)
    ctx.lineTo(CANVAS_W / 2, CANVAS_H - 20)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(CANVAS_W / 2, CANVAS_H / 2, 40, 0, Math.PI * 2)
    ctx.stroke()
    const paintW = 100
    const paintH = 180
    ctx.strokeRect(20, (CANVAS_H - paintH) / 2, paintW, paintH)
    ctx.strokeRect(CANVAS_W - 20 - paintW, (CANVAS_H - paintH) / 2, paintW, paintH)
  }

  function drawHandballPitch(ctx: CanvasRenderingContext2D): void {
    ctx.strokeRect(20, 20, CANVAS_W - 40, CANVAS_H - 40)
    ctx.beginPath()
    ctx.moveTo(CANVAS_W / 2, 20)
    ctx.lineTo(CANVAS_W / 2, CANVAS_H - 20)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(20, CANVAS_H / 2, 100, -Math.PI / 2, Math.PI / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(CANVAS_W - 20, CANVAS_H / 2, 100, Math.PI / 2, -Math.PI / 2)
    ctx.stroke()
  }

  function drawMarking(ctx: CanvasRenderingContext2D, marking: Sport.TacticsMarking): void {
    const color = (marking.properties.color as string) || '#cc0000'
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 2
    const { x, y } = marking.position
    switch (marking.type) {
      case 'player':
        ctx.beginPath()
        ctx.arc(x, y, 14, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1.5
        ctx.stroke()
        break
      case 'ball':
        ctx.beginPath()
        ctx.arc(x, y, 10, 0, Math.PI * 2)
        ctx.fillStyle = '#f0f0f0'
        ctx.fill()
        ctx.strokeStyle = '#555'
        ctx.lineWidth = 1.5
        ctx.stroke()
        break
      case 'arrow': {
        const ex = (marking.properties.endX as number) ?? x + 40
        const ey = (marking.properties.endY as number) ?? y
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(ex, ey)
        ctx.stroke()
        const angle = Math.atan2(ey - y, ex - x)
        ctx.beginPath()
        ctx.moveTo(ex, ey)
        ctx.lineTo(ex - 12 * Math.cos(angle - 0.4), ey - 12 * Math.sin(angle - 0.4))
        ctx.lineTo(ex - 12 * Math.cos(angle + 0.4), ey - 12 * Math.sin(angle + 0.4))
        ctx.closePath()
        ctx.fill()
        break
      }
      case 'line': {
        const ex = (marking.properties.endX as number) ?? x + 40
        const ey = (marking.properties.endY as number) ?? y
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(ex, ey)
        ctx.stroke()
        break
      }
      case 'circle': {
        const radius = (marking.properties.radius as number) ?? 30
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.stroke()
        break
      }
      case 'text': {
        const label = (marking.properties.label as string) || '?'
        ctx.font = 'bold 14px sans-serif'
        ctx.fillText(label, x, y)
        break
      }
    }
  }

  function redraw(): void {
    const ctx = getCtx()
    if (!ctx) return
    drawBackground(ctx)
    for (const marking of markings.value) drawMarking(ctx, marking)
  }

  function onPointerDown(event: MouseEvent): void {
    isDrawing = true
    drawStart = canvasPoint(event)
    if (['player', 'ball', 'text'].includes(activeTool.value)) {
      placeMarking(drawStart.x, drawStart.y, drawStart.x, drawStart.y)
      isDrawing = false
    }
  }

  function onPointerMove(event: MouseEvent): void {
    if (!isDrawing || !['arrow', 'line', 'circle'].includes(activeTool.value)) return
    const point = canvasPoint(event)
    redraw()
    const ctx = getCtx()
    if (!ctx) return
    drawMarking(ctx, {
      id: '__preview__',
      type: activeTool.value,
      position: { x: drawStart.x, y: drawStart.y },
      properties: {
        color: activeColor.value === 'red' ? '#cc0000' : '#0044cc',
        endX: point.x,
        endY: point.y,
        radius: Math.hypot(point.x - drawStart.x, point.y - drawStart.y)
      }
    })
  }

  function onPointerUp(event: MouseEvent | Event): void {
    if (!isDrawing) return
    isDrawing = false
    const point = canvasPoint(event as MouseEvent)
    if (['arrow', 'line', 'circle'].includes(activeTool.value)) {
      placeMarking(drawStart.x, drawStart.y, point.x, point.y)
    }
  }

  function onTouchStart(event: TouchEvent): void {
    if (event.touches.length > 0) {
      const touch = event.touches[0]
      onPointerDown({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent)
    }
  }

  function onTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0) {
      const touch = event.touches[0]
      onPointerMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent)
    }
  }

  function placeMarking(sx: number, sy: number, ex: number, ey: number): void {
    const color = activeColor.value === 'red' ? '#cc0000' : '#0044cc'
    const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    let props: Record<string, unknown> = { color }
    if (activeTool.value === 'arrow' || activeTool.value === 'line') {
      props = { ...props, endX: ex, endY: ey }
    } else if (activeTool.value === 'circle') {
      props = { ...props, radius: Math.max(10, Math.hypot(ex - sx, ey - sy)) }
    } else if (activeTool.value === 'text') {
      props = { ...props, label: window.prompt('Text eingeben / Enter text:') || '?' }
    }
    markings.value.push({
      id,
      type: activeTool.value,
      position: { x: sx, y: sy },
      properties: props
    })
    redraw()
  }

  function clearBoard(): void {
    markings.value = []
    redraw()
  }

  async function loadSnapshots(): Promise<void> {
    snapshots.value = await bridge.tacticsSnapshotRepository.findAll()
    snapshots.value.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async function saveSnapshot(): Promise<void> {
    if (!snapshotTitle.value.trim()) {
      snapshotTitle.value = ''
      return
    }
    saving.value = true
    saveMessage.value = ''
    try {
      await bridge.saveTacticsSnapshotUseCase.execute({
        title: snapshotTitle.value.trim(),
        sport: snapshotSport.value.trim(),
        markings: markings.value,
        background: background.value
      })
      saveMessage.value = t('TACTICS.saveSuccess')
      snapshotTitle.value = ''
      await loadSnapshots()
    } finally {
      saving.value = false
    }
  }

  function reopenSnapshot(snapshot: Sport.TacticsBoardSnapshot): void {
    markings.value = snapshot.markings.map((marking) => ({ ...marking }))
    background.value = snapshot.background
    snapshotTitle.value = snapshot.title
    snapshotSport.value = snapshot.sport
    redraw()
  }

  async function deleteSnapshot(id: string): Promise<void> {
    await bridge.tacticsSnapshotRepository.delete(id)
    await loadSnapshots()
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  watch(background, () => redraw())

  onMounted(async () => {
    redraw()
    await loadSnapshots()
  })

  return {
    activeColor,
    activeTool,
    background,
    boardCanvas,
    CANVAS_H,
    CANVAS_W,
    clearBoard,
    deleteSnapshot,
    formatDate,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onTouchMove,
    onTouchStart,
    reopenSnapshot,
    saveMessage,
    saveSnapshot,
    saving,
    snapshotSport,
    snapshots,
    snapshotTitle,
    tools,
    t
  }
}
