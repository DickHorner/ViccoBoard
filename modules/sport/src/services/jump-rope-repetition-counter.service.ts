export const JUMP_ROPE_MAX_PERSONS = 4;
export const JUMP_ROPE_MIN_AMPLITUDE = 0.035;
export const JUMP_ROPE_MIN_INTERVAL_MS = 180;
export const JUMP_ROPE_MAX_CYCLE_MS = 1500;

type JumpPhase = 'seeking-low' | 'rising';

interface JumpPersonState {
  count: number;
  phase: JumpPhase;
  low: number | null;
  peak: number | null;
  cycleStartedAtMs: number | null;
  lastCountAtMs: number;
}

export class JumpRopeRepetitionCounter {
  private readonly states: JumpPersonState[];

  constructor(maxPersons: number) {
    if (!Number.isInteger(maxPersons) || maxPersons < 1 || maxPersons > JUMP_ROPE_MAX_PERSONS) {
      throw new Error(`maxPersons must be an integer between 1 and ${JUMP_ROPE_MAX_PERSONS}`);
    }

    this.states = Array.from({ length: maxPersons }, () => this.createState());
  }

  processFrame(personIndex: number, normalizedHeight: number, timestampMs: number): void {
    this.assertPersonIndex(personIndex);
    this.assertHeight(normalizedHeight);
    this.assertTimestamp(timestampMs);

    const state = this.states[personIndex];

    if (state.low === null) {
      state.low = normalizedHeight;
      state.peak = normalizedHeight;
      return;
    }

    if (state.phase === 'seeking-low') {
      state.low = Math.min(state.low, normalizedHeight);

      if (normalizedHeight - state.low >= JUMP_ROPE_MIN_AMPLITUDE) {
        state.phase = 'rising';
        state.peak = normalizedHeight;
        state.cycleStartedAtMs = timestampMs;
      }
      return;
    }

    if (state.cycleStartedAtMs === null || state.peak === null) {
      this.resetCycle(state, normalizedHeight);
      return;
    }

    if (timestampMs - state.cycleStartedAtMs > JUMP_ROPE_MAX_CYCLE_MS) {
      this.resetCycle(state, normalizedHeight);
      return;
    }

    state.peak = Math.max(state.peak, normalizedHeight);
    const amplitude = state.peak - state.low;
    const returnedFromPeak = state.peak - normalizedHeight >= JUMP_ROPE_MIN_AMPLITUDE;

    if (!returnedFromPeak) {
      return;
    }

    const enoughTimeSinceLastCount =
      timestampMs - state.lastCountAtMs >= JUMP_ROPE_MIN_INTERVAL_MS;

    if (amplitude >= JUMP_ROPE_MIN_AMPLITUDE && enoughTimeSinceLastCount) {
      state.count += 1;
      state.lastCountAtMs = timestampMs;
    }

    this.resetCycle(state, normalizedHeight);
  }

  getCount(personIndex: number): number {
    this.assertPersonIndex(personIndex);
    return this.states[personIndex].count;
  }

  reset(personIndex?: number): void {
    if (personIndex === undefined) {
      for (let index = 0; index < this.states.length; index += 1) {
        this.states[index] = this.createState();
      }
      return;
    }

    this.assertPersonIndex(personIndex);
    this.states[personIndex] = this.createState();
  }

  private resetCycle(state: JumpPersonState, normalizedHeight: number): void {
    state.phase = 'seeking-low';
    state.low = normalizedHeight;
    state.peak = normalizedHeight;
    state.cycleStartedAtMs = null;
  }

  private createState(): JumpPersonState {
    return {
      count: 0,
      phase: 'seeking-low',
      low: null,
      peak: null,
      cycleStartedAtMs: null,
      lastCountAtMs: Number.NEGATIVE_INFINITY,
    };
  }

  private assertPersonIndex(personIndex: number): void {
    if (!Number.isInteger(personIndex) || personIndex < 0 || personIndex >= this.states.length) {
      throw new Error(`personIndex must be between 0 and ${this.states.length - 1}`);
    }
  }

  private assertHeight(normalizedHeight: number): void {
    if (!Number.isFinite(normalizedHeight) || normalizedHeight < 0 || normalizedHeight > 1) {
      throw new Error('normalizedHeight must be between 0 and 1');
    }
  }

  private assertTimestamp(timestampMs: number): void {
    if (!Number.isFinite(timestampMs) || timestampMs < 0) {
      throw new Error('timestampMs must be a non-negative finite number');
    }
  }
}
