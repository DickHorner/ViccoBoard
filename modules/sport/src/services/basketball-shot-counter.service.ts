export interface BasketballMotionObservation {
  /** Horizontal position within the target zone, normalized to [0, 1]. */
  x: number;
  /** Vertical position within the target zone, normalized to [0, 1], top = 0. */
  y: number;
}

export const BASKETBALL_ENTRY_Y_MAX = 0.42;
export const BASKETBALL_EXIT_Y_MIN = 0.62;
export const BASKETBALL_MIN_VERTICAL_TRAVEL = 0.22;
export const BASKETBALL_MAX_HORIZONTAL_DRIFT = 0.28;
export const BASKETBALL_MAX_UPWARD_STEP = 0.08;
export const BASKETBALL_TRAJECTORY_TIMEOUT_MS = 700;

type Phase = 'idle' | 'armed';

interface ArmedState {
  startX: number;
  startY: number;
  lastY: number;
  startedAtMs: number;
}

/**
 * Counts only downward motion trajectories through a configured hoop zone.
 *
 * The camera layer is responsible for producing a reliable motion centroid
 * inside that zone. This service intentionally has no video dependencies so
 * the direction rules remain deterministic and testable.
 */
export class BasketballShotCounter {
  private phase: Phase = 'idle';
  private armed: ArmedState | null = null;
  private count = 0;

  processFrame(observation: BasketballMotionObservation | null, timestampMs: number): void {
    this.assertTimestamp(timestampMs);

    if (
      this.phase === 'armed' &&
      this.armed &&
      timestampMs - this.armed.startedAtMs > BASKETBALL_TRAJECTORY_TIMEOUT_MS
    ) {
      this.clearTrajectory();
    }

    if (!observation) {
      return;
    }

    this.assertObservation(observation);

    if (this.phase === 'idle' || !this.armed) {
      if (observation.y <= BASKETBALL_ENTRY_Y_MAX) {
        this.arm(observation, timestampMs);
      }
      return;
    }

    const horizontalDrift = Math.abs(observation.x - this.armed.startX);
    if (horizontalDrift > BASKETBALL_MAX_HORIZONTAL_DRIFT) {
      this.clearTrajectory();
      return;
    }

    if (observation.y < this.armed.lastY - BASKETBALL_MAX_UPWARD_STEP) {
      this.clearTrajectory();
      if (observation.y <= BASKETBALL_ENTRY_Y_MAX) {
        this.arm(observation, timestampMs);
      }
      return;
    }

    const verticalTravel = observation.y - this.armed.startY;
    if (
      observation.y >= BASKETBALL_EXIT_Y_MIN &&
      verticalTravel >= BASKETBALL_MIN_VERTICAL_TRAVEL &&
      verticalTravel > horizontalDrift
    ) {
      this.count += 1;
      this.clearTrajectory();
      return;
    }

    this.armed.lastY = Math.max(this.armed.lastY, observation.y);
  }

  getCount(): number {
    return this.count;
  }

  reset(): void {
    this.count = 0;
    this.clearTrajectory();
  }

  private arm(observation: BasketballMotionObservation, timestampMs: number): void {
    this.phase = 'armed';
    this.armed = {
      startX: observation.x,
      startY: observation.y,
      lastY: observation.y,
      startedAtMs: timestampMs,
    };
  }

  private clearTrajectory(): void {
    this.phase = 'idle';
    this.armed = null;
  }

  private assertTimestamp(timestampMs: number): void {
    if (!Number.isFinite(timestampMs) || timestampMs < 0) {
      throw new Error('timestampMs must be a non-negative finite number');
    }
  }

  private assertObservation(observation: BasketballMotionObservation): void {
    if (
      !Number.isFinite(observation.x) ||
      !Number.isFinite(observation.y) ||
      observation.x < 0 ||
      observation.x > 1 ||
      observation.y < 0 ||
      observation.y > 1
    ) {
      throw new Error('Basketball motion coordinates must be between 0 and 1');
    }
  }
}
