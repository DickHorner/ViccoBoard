import { describe, expect, it } from '@jest/globals';
import {
  BasketballShotCounter,
  BASKETBALL_ENTRY_Y_MAX,
  BASKETBALL_EXIT_Y_MIN,
  BASKETBALL_TRAJECTORY_TIMEOUT_MS,
} from '../src/services/basketball-shot-counter.service';

describe('BasketballShotCounter', () => {
  it('counts a downward top-to-bottom trajectory through the hoop zone', () => {
    const counter = new BasketballShotCounter();

    counter.processFrame({ x: 0.50, y: BASKETBALL_ENTRY_Y_MAX - 0.08, rimOcclusionObserved: false }, 0);
    counter.processFrame({ x: 0.52, y: 0.50, rimOcclusionObserved: true }, 40);
    counter.processFrame({ x: 0.51, y: BASKETBALL_EXIT_Y_MIN + 0.08, rimOcclusionObserved: false }, 80);

    expect(counter.getCount()).toBe(1);
  });

  it('does not count a downward trajectory without rim occlusion evidence', () => {
    const counter = new BasketballShotCounter();

    counter.processFrame({ x: 0.50, y: 0.25, rimOcclusionObserved: false }, 0);
    counter.processFrame({ x: 0.50, y: 0.50, rimOcclusionObserved: false }, 40);
    counter.processFrame({ x: 0.50, y: 0.75, rimOcclusionObserved: false }, 80);

    expect(counter.getCount()).toBe(0);
  });

  it('does not count a horizontal crossing through the zone', () => {
    const counter = new BasketballShotCounter();

    counter.processFrame({ x: 0.10, y: 0.30, rimOcclusionObserved: false }, 0);
    counter.processFrame({ x: 0.35, y: 0.31, rimOcclusionObserved: false }, 40);
    counter.processFrame({ x: 0.65, y: 0.32, rimOcclusionObserved: false }, 80);
    counter.processFrame({ x: 0.90, y: 0.31, rimOcclusionObserved: false }, 120);

    expect(counter.getCount()).toBe(0);
  });

  it('does not count bottom-to-top motion', () => {
    const counter = new BasketballShotCounter();

    counter.processFrame({ x: 0.50, y: 0.80, rimOcclusionObserved: false }, 0);
    counter.processFrame({ x: 0.50, y: 0.55, rimOcclusionObserved: false }, 40);
    counter.processFrame({ x: 0.50, y: 0.25, rimOcclusionObserved: false }, 80);

    expect(counter.getCount()).toBe(0);
  });

  it('rejects a downward path with too much lateral drift', () => {
    const counter = new BasketballShotCounter();

    counter.processFrame({ x: 0.15, y: 0.25, rimOcclusionObserved: false }, 0);
    counter.processFrame({ x: 0.50, y: 0.48, rimOcclusionObserved: true }, 40);
    counter.processFrame({ x: 0.75, y: 0.75, rimOcclusionObserved: false }, 80);

    expect(counter.getCount()).toBe(0);
  });

  it('tolerates small vertical jitter while the overall path moves down', () => {
    const counter = new BasketballShotCounter();

    counter.processFrame({ x: 0.48, y: 0.28, rimOcclusionObserved: false }, 0);
    counter.processFrame({ x: 0.49, y: 0.45, rimOcclusionObserved: true }, 40);
    counter.processFrame({ x: 0.50, y: 0.41, rimOcclusionObserved: false }, 80);
    counter.processFrame({ x: 0.51, y: 0.68, rimOcclusionObserved: false }, 120);

    expect(counter.getCount()).toBe(1);
  });

  it('expires an incomplete trajectory instead of joining unrelated motion later', () => {
    const counter = new BasketballShotCounter();

    counter.processFrame({ x: 0.50, y: 0.25, rimOcclusionObserved: false }, 0);
    counter.processFrame(null, BASKETBALL_TRAJECTORY_TIMEOUT_MS + 1);
    counter.processFrame({ x: 0.50, y: 0.75, rimOcclusionObserved: false }, BASKETBALL_TRAJECTORY_TIMEOUT_MS + 40);

    expect(counter.getCount()).toBe(0);
  });

  it('counts separate downward trajectories independently', () => {
    const counter = new BasketballShotCounter();

    counter.processFrame({ x: 0.50, y: 0.25, rimOcclusionObserved: false }, 0);
    counter.processFrame({ x: 0.50, y: 0.75, rimOcclusionObserved: false }, 50);
    counter.processFrame({ x: 0.48, y: 0.24, rimOcclusionObserved: false }, 200);
    counter.processFrame({ x: 0.49, y: 0.74, rimOcclusionObserved: true }, 250);

    expect(counter.getCount()).toBe(2);
  });

  it('resetTrajectory clears only the in-flight path and preserves completed shots', () => {
    const counter = new BasketballShotCounter();

    counter.processFrame({ x: 0.50, y: 0.25, rimOcclusionObserved: false }, 0);
    counter.processFrame({ x: 0.50, y: 0.75, rimOcclusionObserved: false }, 50);
    counter.processFrame({ x: 0.50, y: 0.25, rimOcclusionObserved: false }, 100);
    counter.resetTrajectory();
    counter.processFrame({ x: 0.50, y: 0.75, rimOcclusionObserved: false }, 140);

    expect(counter.getCount()).toBe(1);
  });

  it('reset clears count and any armed trajectory', () => {
    const counter = new BasketballShotCounter();

    counter.processFrame({ x: 0.50, y: 0.25, rimOcclusionObserved: false }, 0);
    counter.reset();
    counter.processFrame({ x: 0.50, y: 0.75, rimOcclusionObserved: false }, 40);

    expect(counter.getCount()).toBe(0);
  });
});
