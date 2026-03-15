/**
 * PushupRepetitionCounter Service
 *
 * Counts push-up repetitions for up to 4 persons simultaneously using a
 * state-machine approach driven by normalised height values (0 = lowest/down,
 * 1 = highest/up).  The service is deliberately free of any video/camera
 * dependencies so it can be unit-tested with reproducible input sequences.
 */

export type PushupQuality = 'good' | 'partial' | 'bad';

export interface PushupPersonResult {
  personId: number;
  count: number;
  quality: PushupQuality;
}

/** Maximum number of persons that can be tracked simultaneously. */
export const PUSHUP_MAX_PERSONS = 4;

/**
 * Normalised-height threshold below which the person is considered to be in
 * the "down" phase of a push-up (arms bent, chest near the floor).
 *
 * This value represents approximately 35 % of the visible body-height range
 * in the camera frame. It was chosen to ensure only genuine downward
 * movement (past the halfway point) triggers the down-phase transition,
 * while still allowing the "bad" quality band (PARTIAL_MAX < h ≤ DOWN)
 * to be reachable for reps that are technically valid but shallow.
 */
export const PUSHUP_DOWN_THRESHOLD = 0.35;

/**
 * Normalised-height threshold above which the person is considered to have
 * returned to the "up" phase (arms extended), completing one repetition.
 *
 * Set to 70 % of the visible body-height range so that partial returns
 * (accidentally bobbing up slightly) do not trigger false rep counts.
 */
export const PUSHUP_UP_THRESHOLD = 0.70;

/**
 * If the minimum height reached during the down phase is at or below this
 * value (20 % of body-height range) the repetition quality is rated "good".
 * This corresponds to a chest-near-floor position in a full push-up.
 */
export const PUSHUP_GOOD_QUALITY_MAX = 0.20;

/**
 * If the minimum height is above GOOD but at or below this value (30 % of
 * body-height range) the quality is rated "partial".  Must be strictly less
 * than PUSHUP_DOWN_THRESHOLD so that the "bad" quality band
 * (PARTIAL_MAX < height ≤ DOWN_THRESHOLD) is reachable.
 */
export const PUSHUP_PARTIAL_QUALITY_MAX = 0.30;

type Phase = 'idle' | 'up' | 'down';

interface PersonState {
  count: number;
  quality: PushupQuality;
  phase: Phase;
  /** Lowest normalised height seen during the current down phase. */
  minHeightSeen: number;
}

function makeState(): PersonState {
  return { count: 0, quality: 'good', phase: 'idle', minHeightSeen: 1 };
}

export class PushupRepetitionCounter {
  private states: PersonState[];
  private readonly maxPersons: number;

  constructor(maxPersons = 4) {
    if (!Number.isInteger(maxPersons) || maxPersons < 1 || maxPersons > PUSHUP_MAX_PERSONS) {
      throw new Error(`maxPersons must be an integer between 1 and ${PUSHUP_MAX_PERSONS}`);
    }
    this.maxPersons = maxPersons;
    this.states = Array.from({ length: maxPersons }, makeState);
  }

  /**
   * Feed a single normalised-height observation for one person.
   *
   * @param personIndex  Zero-based person index (0 … maxPersons-1).
   * @param normalizedHeight  Value in [0, 1] where 0 = lowest body position
   *   (chest near floor) and 1 = highest body position (arms fully extended).
   */
  processFrame(personIndex: number, normalizedHeight: number): void {
    if (!Number.isInteger(personIndex) || personIndex < 0 || personIndex >= this.maxPersons) {
      throw new Error(
        `personIndex must be an integer between 0 and ${this.maxPersons - 1}`
      );
    }
    if (
      typeof normalizedHeight !== 'number' ||
      isNaN(normalizedHeight) ||
      normalizedHeight < 0 ||
      normalizedHeight > 1
    ) {
      throw new Error('normalizedHeight must be a number between 0 and 1');
    }

    const state = this.states[personIndex];

    if (state.phase === 'idle' || state.phase === 'up') {
      if (normalizedHeight <= PUSHUP_DOWN_THRESHOLD) {
        // Transition to down phase
        state.phase = 'down';
        state.minHeightSeen = normalizedHeight;
      } else if (state.phase === 'idle') {
        // First high-enough frame — establish "up" baseline
        state.phase = 'up';
      }
    } else {
      // phase === 'down'
      if (normalizedHeight < state.minHeightSeen) {
        state.minHeightSeen = normalizedHeight;
      }
      if (normalizedHeight >= PUSHUP_UP_THRESHOLD) {
        // Returned to up position — count the completed repetition
        state.count += 1;
        state.quality = this.evaluateQuality(state.minHeightSeen);
        state.phase = 'up';
        state.minHeightSeen = 1;
      }
    }
  }

  /** Returns the current rep count for the given person. */
  getCount(personIndex: number): number {
    return this.states[personIndex].count;
  }

  /** Returns the quality rating of the most recently completed rep. */
  getQuality(personIndex: number): PushupQuality {
    return this.states[personIndex].quality;
  }

  /** Returns a snapshot of all tracked persons' counts and quality ratings. */
  getResults(): PushupPersonResult[] {
    return this.states.map((s, i) => ({
      personId: i,
      count: s.count,
      quality: s.quality,
    }));
  }

  /** Sum of rep counts across all tracked persons. */
  getTotalReps(): number {
    return this.states.reduce((sum, s) => sum + s.count, 0);
  }

  /**
   * Average rep count per tracked person slot.
   * (Includes all slots even if some persons were never detected.)
   */
  getAverage(): number {
    return this.getTotalReps() / this.maxPersons;
  }

  /**
   * Resets counters and state-machine state.
   * @param personIndex  If provided, resets only that person; otherwise resets all.
   */
  reset(personIndex?: number): void {
    if (personIndex !== undefined) {
      if (!Number.isInteger(personIndex) || personIndex < 0 || personIndex >= this.maxPersons) {
        throw new Error(
          `personIndex must be an integer between 0 and ${this.maxPersons - 1}`
        );
      }
      this.states[personIndex] = makeState();
    } else {
      this.states = Array.from({ length: this.maxPersons }, makeState);
    }
  }

  private evaluateQuality(minHeight: number): PushupQuality {
    if (minHeight <= PUSHUP_GOOD_QUALITY_MAX) return 'good';
    if (minHeight <= PUSHUP_PARTIAL_QUALITY_MAX) return 'partial';
    return 'bad';
  }
}
