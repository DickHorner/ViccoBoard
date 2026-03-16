import type { Sport } from '@viccoboard/core'

export interface ShuttleResult {
  level: number | ''
  lane: number | ''
  grade?: string | number
  stopped?: boolean
}

export interface SessionSnapshot {
  categoryId: string
  selectedTableId: string
  selectedConfigId: string
  elapsedMs: number
  soundEnabled: boolean
  results: Record<string, ShuttleResult>
  savedAt: string
}

export interface HistoryGroup {
  date: string
  entries: Sport.PerformanceEntry[]
}

export function sessionKey(categoryId: string): string {
  return `shuttle-session:${categoryId}`
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${pad(minutes)}:${pad(seconds)}`
}

export function formatSessionDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function playBeep() {
  try {
    const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return
    const audioContext = new AudioCtor()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.value = 0.3
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  } catch (error) {
    console.warn('Audio not available:', error)
  }
}
