import {
  ToolPlugin,
  ToolConfig,
  ToolState,
  ToolLogEntry,
  ToolAction,
  ToolActionResult,
  ToolUIComponent
} from '@viccoboard/core';

type TimerMode = 'stopwatch' | 'countdown' | 'interval';

interface TimerStateData {
  mode: TimerMode;
  running: boolean;
  startTime: number | null;
  elapsedMs: number;
  durationMs: number | null;
  remainingMs: number | null;
  intervalMs: number | null;
  intervalCount: number;
  audioEnabled: boolean;
  completed: boolean;
}

interface TimerActionPayload {
  mode?: TimerMode;
  durationMs?: number;
  intervalMs?: number;
  audioEnabled?: boolean;
}

export class TimerToolPlugin implements ToolPlugin {
  id = 'timer';
  name = 'Timer';
  version = '1.0.0';
  description = 'Countdown, stopwatch, and interval timer';
  enabled = true;
  type: 'tool' = 'tool';
  category: 'timer' = 'timer';
  icon = 'timer';

  private state: TimerStateData;
  private logs: ToolLogEntry[] = [];
  private config: ToolConfig | null = null;

  constructor(private nowFn: () => number = () => Date.now()) {
    this.state = {
      mode: 'stopwatch',
      running: false,
      startTime: null,
      elapsedMs: 0,
      durationMs: null,
      remainingMs: null,
      intervalMs: null,
      intervalCount: 0,
      audioEnabled: true,
      completed: false
    };
  }

  initialize(config: ToolConfig): void {
    this.config = config;
    this.applyConfig(config.parameters || {});
  }

  getState(): ToolState {
    return {
      timestamp: new Date(this.nowFn()),
      data: { ...this.state },
      logs: [...this.logs]
    };
  }

  setState(state: ToolState): void {
    this.state = {
      ...this.state,
      ...(state.data as Partial<TimerStateData>)
    };
    this.logs = state.logs ? [...state.logs] : [];
  }

  getUIComponent(): ToolUIComponent {
    return {
      componentType: 'Timer',
      props: {
        mode: this.state.mode,
        running: this.state.running,
        elapsedMs: this.state.elapsedMs,
        remainingMs: this.state.remainingMs,
        durationMs: this.state.durationMs,
        intervalMs: this.state.intervalMs,
        intervalCount: this.state.intervalCount,
        completed: this.state.completed,
        audioEnabled: this.state.audioEnabled
      }
    };
  }

  handleAction(action: ToolAction): ToolActionResult {
    switch (action.type) {
      case 'configure':
        this.applyConfig(action.payload || {});
        return { success: true, data: { ...this.state } };

      case 'setMode':
        this.applyConfig({ mode: action.payload?.mode });
        return { success: true, data: { ...this.state } };

      case 'setDuration':
        this.applyConfig({ durationMs: action.payload?.durationMs });
        return { success: true, data: { ...this.state } };

      case 'setInterval':
        this.applyConfig({ intervalMs: action.payload?.intervalMs });
        return { success: true, data: { ...this.state } };

      case 'setAudio':
        this.applyConfig({ audioEnabled: action.payload?.audioEnabled });
        return { success: true, data: { ...this.state } };

      case 'start':
        return this.start();

      case 'stop':
        return this.stop();

      case 'reset':
        return this.reset();

      case 'tick':
        return this.tick();

      default:
        return { success: false, error: `Unknown action: ${action.type}` };
    }
  }

  private applyConfig(payload: TimerActionPayload): void {
    if (payload.mode) {
      this.state.mode = payload.mode;
      this.state.completed = false;
    }
    if (typeof payload.durationMs === 'number') {
      this.state.durationMs = Math.max(0, payload.durationMs);
    }
    if (typeof payload.intervalMs === 'number') {
      this.state.intervalMs = Math.max(0, payload.intervalMs);
      this.state.intervalCount = 0;
    }
    if (typeof payload.audioEnabled === 'boolean') {
      this.state.audioEnabled = payload.audioEnabled;
    }
    this.updateDerivedState();
  }

  private start(): ToolActionResult {
    if (this.state.running) {
      return { success: true, data: { ...this.state } };
    }
    if (this.state.mode === 'countdown' && this.state.durationMs === null) {
      return { success: false, error: 'Countdown requires durationMs' };
    }
    this.state.running = true;
    this.state.startTime = this.nowFn();
    this.state.completed = false;
    this.log('start', { mode: this.state.mode });
    return { success: true, data: { ...this.state } };
  }

  private stop(): ToolActionResult {
    if (!this.state.running) {
      return { success: true, data: { ...this.state } };
    }
    this.syncElapsed();
    this.state.running = false;
    this.state.startTime = null;
    this.updateDerivedState();
    this.log('stop', {
      elapsedMs: this.state.elapsedMs,
      remainingMs: this.state.remainingMs
    });
    return { success: true, data: { ...this.state } };
  }

  private reset(): ToolActionResult {
    this.state.running = false;
    this.state.startTime = null;
    this.state.elapsedMs = 0;
    this.state.intervalCount = 0;
    this.state.completed = false;
    this.updateDerivedState();
    this.log('reset', {});
    return { success: true, data: { ...this.state } };
  }

  private tick(): ToolActionResult {
    this.syncElapsed();
    this.updateDerivedState();

    if (this.state.mode === 'countdown' && this.state.remainingMs === 0) {
      if (!this.state.completed) {
        this.state.completed = true;
        this.state.running = false;
        this.state.startTime = null;
        this.log('complete', { elapsedMs: this.state.elapsedMs });
        return {
          success: true,
          data: { ...this.state },
          ...this.audioResult('complete')
        };
      }
    }

    if (this.state.mode === 'interval' && this.state.intervalMs) {
      const intervalCount = Math.floor(this.state.elapsedMs / this.state.intervalMs);
      if (intervalCount > this.state.intervalCount) {
        this.state.intervalCount = intervalCount;
        this.log('interval', { intervalCount });
        return {
          success: true,
          data: { ...this.state },
          ...this.audioResult('interval')
        };
      }
    }

    return { success: true, data: { ...this.state } };
  }

  private syncElapsed(): void {
    if (!this.state.running || this.state.startTime === null) {
      return;
    }
    const now = this.nowFn();
    const delta = now - this.state.startTime;
    this.state.elapsedMs = Math.max(0, this.state.elapsedMs + delta);
    this.state.startTime = now;
  }

  private updateDerivedState(): void {
    if (this.state.mode === 'countdown' && this.state.durationMs !== null) {
      const remaining = Math.max(this.state.durationMs - this.state.elapsedMs, 0);
      this.state.remainingMs = remaining;
      if (remaining === 0 && this.state.running) {
        this.state.completed = true;
        this.state.running = false;
        this.state.startTime = null;
      }
    } else {
      this.state.remainingMs = null;
    }
  }

  private log(action: string, data: Record<string, any>): void {
    this.logs.push({
      timestamp: new Date(this.nowFn()),
      action,
      data
    });
  }

  private audioResult(event: 'complete' | 'interval'): Partial<ToolActionResult> {
    if (!this.state.audioEnabled) {
      return {};
    }
    return { data: { ...this.state, audioCue: event } };
  }
}
