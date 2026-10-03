import { describe, expect, it } from '@jest/globals';
import {
  JumpRopeRepetitionCounter,
  JUMP_ROPE_MAX_CYCLE_MS,
  JUMP_ROPE_MIN_INTERVAL_MS,
} from '../src/services/jump-rope-repetition-counter.service';

describe('JumpRopeRepetitionCounter', () => {
  it('rejects unsupported person counts', () => {
    expect(() => new JumpRopeRepetitionCounter(0)).toThrow()
    expect(() => new JumpRopeRepetitionCounter(5)).toThrow()
  })

  it('counts one complete rise-and-return cycle', () => {
    const counter = new JumpRopeRepetitionCounter(1);

    counter.processFrame(0, 0.50, 0);
    counter.processFrame(0, 0.55, 60);
    counter.processFrame(0, 0.58, 100);
    counter.processFrame(0, 0.53, 150);

    expect(counter.getCount(0)).toBe(1);
  });

  it('counts repeated jump cycles independently', () => {
    const counter = new JumpRopeRepetitionCounter(1);

    const samples = [
      [0.50, 0],
      [0.56, 60],
      [0.58, 100],
      [0.51, 160],
      [0.50, 260],
      [0.57, 320],
      [0.59, 360],
      [0.51, 430],
    ] as const;

    for (const [height, timestamp] of samples) {
      counter.processFrame(0, height, timestamp);
    }

    expect(counter.getCount(0)).toBe(2);
  });

  it('ignores small camera jitter below the minimum amplitude', () => {
    const counter = new JumpRopeRepetitionCounter(1);

    counter.processFrame(0, 0.50, 0);
    counter.processFrame(0, 0.515, 50);
    counter.processFrame(0, 0.49, 100);
    counter.processFrame(0, 0.518, 150);
    counter.processFrame(0, 0.50, 200);

    expect(counter.getCount(0)).toBe(0);
  });

  it('does not double count implausibly fast oscillation', () => {
    const counter = new JumpRopeRepetitionCounter(1);

    counter.processFrame(0, 0.50, 0);
    counter.processFrame(0, 0.58, 40);
    counter.processFrame(0, 0.50, 80);
    counter.processFrame(0, 0.58, 100);
    counter.processFrame(0, 0.50, JUMP_ROPE_MIN_INTERVAL_MS - 1);

    expect(counter.getCount(0)).toBe(1);
  });

  it('expires a rise that never returns within the maximum cycle time', () => {
    const counter = new JumpRopeRepetitionCounter(1);

    counter.processFrame(0, 0.50, 0);
    counter.processFrame(0, 0.58, 100);
    counter.processFrame(0, 0.60, JUMP_ROPE_MAX_CYCLE_MS + 101);
    counter.processFrame(0, 0.50, JUMP_ROPE_MAX_CYCLE_MS + 150);

    expect(counter.getCount(0)).toBe(0);
  });

  it('tracks several people independently', () => {
    const counter = new JumpRopeRepetitionCounter(2);

    counter.processFrame(0, 0.50, 0);
    counter.processFrame(1, 0.50, 0);
    counter.processFrame(0, 0.58, 80);
    counter.processFrame(0, 0.50, 160);

    expect(counter.getCount(0)).toBe(1);
    expect(counter.getCount(1)).toBe(0);
  });

  it('reset clears counts and in-flight cycles', () => {
    const counter = new JumpRopeRepetitionCounter(1);

    counter.processFrame(0, 0.50, 0);
    counter.processFrame(0, 0.58, 80);
    counter.reset();
    counter.processFrame(0, 0.50, 160);

    expect(counter.getCount(0)).toBe(0);
  });
});
