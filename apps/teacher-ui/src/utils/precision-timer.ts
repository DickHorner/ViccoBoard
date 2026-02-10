/**
 * High-Precision Timer Utility
 * Uses performance.now() for accurate timing (Safari requirement)
 * 
 * performance.now() provides microsecond precision and is monotonic,
 * unlike Date.now() which has millisecond precision and can jump.
 */

export interface TimerState {
  running: boolean;
  startTime: number | null;
  pausedTime: number;
  elapsed: number;
}

export type TimerCallback = (elapsed: number) => void;

export class PrecisionTimer {
  private state: TimerState;
  private rafId: number | null = null;
  private callback: TimerCallback | null = null;

  constructor() {
    this.state = {
      running: false,
      startTime: null,
      pausedTime: 0,
      elapsed: 0
    };
  }

  /**
   * Start the timer
   */
  start(callback?: TimerCallback): void {
    if (this.state.running) {
      return;
    }

    if (callback) {
      this.callback = callback;
    }

    this.state.running = true;
    this.state.startTime = performance.now() - this.state.pausedTime;
    this.tick();
  }

  /**
   * Pause the timer
   */
  pause(): void {
    if (!this.state.running) {
      return;
    }

    this.state.running = false;
    this.state.pausedTime = this.state.elapsed;
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Stop and reset the timer
   */
  stop(): void {
    this.pause();
    this.state.startTime = null;
    this.state.pausedTime = 0;
    this.state.elapsed = 0;
  }

  /**
   * Get current elapsed time in milliseconds
   */
  getElapsed(): number {
    return this.state.elapsed;
  }

  /**
   * Get current state
   */
  getState(): Readonly<TimerState> {
    return { ...this.state };
  }

  /**
   * Check if timer is running
   */
  isRunning(): boolean {
    return this.state.running;
  }

  /**
   * Internal tick function using requestAnimationFrame
   */
  private tick = (): void => {
    if (!this.state.running || this.state.startTime === null) {
      return;
    }

    this.state.elapsed = performance.now() - this.state.startTime;

    if (this.callback) {
      this.callback(this.state.elapsed);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  /**
   * Clean up
   */
  dispose(): void {
    this.stop();
    this.callback = null;
  }
}

/**
 * Format milliseconds to MM:SS.mmm
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor(ms % 1000);

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

/**
 * Format milliseconds to MM:SS
 */
export function formatTimeSimple(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Convert seconds to milliseconds
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}

/**
 * Convert milliseconds to seconds
 */
export function msToSeconds(ms: number): number {
  return ms / 1000;
}
