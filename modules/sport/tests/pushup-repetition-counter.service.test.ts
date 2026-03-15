/**
 * PushupRepetitionCounter Service Tests
 *
 * All tests use reproducible input sequences (no randomness, no camera).
 * A "rep" is counted when the normalised height goes from UP (≥ UP_THRESHOLD)
 * through DOWN (≤ DOWN_THRESHOLD) and back UP again (≥ UP_THRESHOLD).
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  PushupRepetitionCounter,
  PUSHUP_DOWN_THRESHOLD,
  PUSHUP_UP_THRESHOLD,
  PUSHUP_GOOD_QUALITY_MAX,
  PUSHUP_PARTIAL_QUALITY_MAX,
  PUSHUP_MAX_PERSONS,
} from '../src/services/pushup-repetition-counter.service';

// Helper: feed a complete push-up cycle (up → down → up) for person 0.
function feedRep(counter: PushupRepetitionCounter, minHeight: number): void {
  counter.processFrame(0, PUSHUP_UP_THRESHOLD);      // up position
  counter.processFrame(0, minHeight);                // down position
  counter.processFrame(0, PUSHUP_UP_THRESHOLD);      // back up
}

describe('PushupRepetitionCounter', () => {
  let counter: PushupRepetitionCounter;

  beforeEach(() => {
    counter = new PushupRepetitionCounter(4);
  });

  // ── Construction ────────────────────────────────────────────────────────
  describe('construction', () => {
    it('defaults to maxPersons=4', () => {
      const c = new PushupRepetitionCounter();
      expect(c.getResults()).toHaveLength(4);
    });

    it('accepts valid maxPersons 1–4', () => {
      for (let n = 1; n <= PUSHUP_MAX_PERSONS; n++) {
        expect(() => new PushupRepetitionCounter(n)).not.toThrow();
      }
    });

    it('throws for maxPersons=0', () => {
      expect(() => new PushupRepetitionCounter(0)).toThrow();
    });

    it('throws for maxPersons=5', () => {
      expect(() => new PushupRepetitionCounter(5)).toThrow();
    });

    it('throws for non-integer maxPersons', () => {
      expect(() => new PushupRepetitionCounter(2.5)).toThrow();
    });

    it('starts with count=0 for all persons', () => {
      const results = counter.getResults();
      results.forEach(r => expect(r.count).toBe(0));
    });
  });

  // ── processFrame validation ─────────────────────────────────────────────
  describe('processFrame – input validation', () => {
    it('throws for negative personIndex', () => {
      expect(() => counter.processFrame(-1, 0.8)).toThrow();
    });

    it('throws for personIndex >= maxPersons', () => {
      expect(() => counter.processFrame(4, 0.8)).toThrow();
    });

    it('throws for non-integer personIndex', () => {
      expect(() => counter.processFrame(0.5, 0.8)).toThrow();
    });

    it('throws for normalizedHeight < 0', () => {
      expect(() => counter.processFrame(0, -0.1)).toThrow();
    });

    it('throws for normalizedHeight > 1', () => {
      expect(() => counter.processFrame(0, 1.1)).toThrow();
    });

    it('throws for NaN normalizedHeight', () => {
      expect(() => counter.processFrame(0, NaN)).toThrow();
    });

    it('accepts boundary values 0 and 1', () => {
      expect(() => counter.processFrame(0, 0)).not.toThrow();
      expect(() => counter.processFrame(0, 1)).not.toThrow();
    });
  });

  // ── Counting logic ──────────────────────────────────────────────────────
  describe('rep counting', () => {
    it('counts zero reps when only up frames are fed', () => {
      counter.processFrame(0, 0.9);
      counter.processFrame(0, 0.8);
      counter.processFrame(0, 0.9);
      expect(counter.getCount(0)).toBe(0);
    });

    it('counts zero reps when only down frames are fed', () => {
      counter.processFrame(0, 0.2);
      counter.processFrame(0, 0.1);
      expect(counter.getCount(0)).toBe(0);
    });

    it('counts one rep for a single up→down→up cycle', () => {
      feedRep(counter, PUSHUP_DOWN_THRESHOLD);
      expect(counter.getCount(0)).toBe(1);
    });

    it('counts zero reps if height never reaches DOWN threshold', () => {
      counter.processFrame(0, PUSHUP_UP_THRESHOLD);   // up
      counter.processFrame(0, 0.5);                   // mid — not deep enough
      counter.processFrame(0, PUSHUP_UP_THRESHOLD);   // up
      expect(counter.getCount(0)).toBe(0);
    });

    it('counts zero reps if height never returns to UP threshold', () => {
      counter.processFrame(0, PUSHUP_UP_THRESHOLD);       // up
      counter.processFrame(0, PUSHUP_DOWN_THRESHOLD);     // down
      counter.processFrame(0, 0.6);                       // partial return — not enough
      expect(counter.getCount(0)).toBe(0);
    });

    it('counts a rep when starting from the down position mid-exercise', () => {
      // Feed only down → up without an initial up phase.
      // The state machine transitions idle→down on the first below-threshold frame,
      // then down→up counts a rep on the return.  This is acceptable behaviour:
      // when tracking starts mid-exercise we count the upward motion.
      counter.processFrame(0, PUSHUP_DOWN_THRESHOLD);    // idle→down
      counter.processFrame(0, PUSHUP_UP_THRESHOLD);      // down→up, rep counted
      expect(counter.getCount(0)).toBe(1);
    });

    it('counts 3 reps for 3 complete cycles', () => {
      feedRep(counter, 0.2);
      feedRep(counter, 0.2);
      feedRep(counter, 0.2);
      expect(counter.getCount(0)).toBe(3);
    });

    it('counts reps independently for different persons', () => {
      // Person 0: 2 reps
      feedRep(counter, 0.2);
      feedRep(counter, 0.2);
      // Person 1: 1 rep
      counter.processFrame(1, PUSHUP_UP_THRESHOLD);
      counter.processFrame(1, 0.2);
      counter.processFrame(1, PUSHUP_UP_THRESHOLD);

      expect(counter.getCount(0)).toBe(2);
      expect(counter.getCount(1)).toBe(1);
      expect(counter.getCount(2)).toBe(0);
      expect(counter.getCount(3)).toBe(0);
    });

    it('uses exact DOWN_THRESHOLD boundary', () => {
      counter.processFrame(0, PUSHUP_UP_THRESHOLD);
      counter.processFrame(0, PUSHUP_DOWN_THRESHOLD);      // exactly at threshold → counts as down
      counter.processFrame(0, PUSHUP_UP_THRESHOLD);
      expect(counter.getCount(0)).toBe(1);
    });

    it('uses exact UP_THRESHOLD boundary', () => {
      counter.processFrame(0, PUSHUP_UP_THRESHOLD);
      counter.processFrame(0, PUSHUP_DOWN_THRESHOLD);
      counter.processFrame(0, PUSHUP_UP_THRESHOLD);        // exactly at threshold → counts as up
      expect(counter.getCount(0)).toBe(1);
    });
  });

  // ── Quality ratings ─────────────────────────────────────────────────────
  describe('quality assessment', () => {
    it('rates quality "good" when min height ≤ GOOD_QUALITY_MAX', () => {
      feedRep(counter, PUSHUP_GOOD_QUALITY_MAX);
      expect(counter.getQuality(0)).toBe('good');
    });

    it('rates quality "good" for very low min height (e.g. 0.05)', () => {
      feedRep(counter, 0.05);
      expect(counter.getQuality(0)).toBe('good');
    });

    it('rates quality "partial" for mid-range min height', () => {
      // Above GOOD but at or below PARTIAL
      const midHeight = (PUSHUP_GOOD_QUALITY_MAX + PUSHUP_PARTIAL_QUALITY_MAX) / 2;
      feedRep(counter, midHeight);
      expect(counter.getQuality(0)).toBe('partial');
    });

    it('rates quality "bad" when min height exceeds PARTIAL_QUALITY_MAX', () => {
      // PARTIAL_QUALITY_MAX (0.30) < DOWN_THRESHOLD (0.35), so 0.31 is a valid "bad" rep.
      feedRep(counter, PUSHUP_PARTIAL_QUALITY_MAX + 0.01);
      expect(counter.getQuality(0)).toBe('bad');
    });

    it('rates quality "bad" for a shallow push-up that barely enters the down phase', () => {
      // PUSHUP_DOWN_THRESHOLD (0.35) > PARTIAL_QUALITY_MAX (0.30) → quality is "bad".
      feedRep(counter, PUSHUP_DOWN_THRESHOLD);
      expect(counter.getQuality(0)).toBe('bad');
    });

    it('defaults to "good" quality before any rep is completed', () => {
      expect(counter.getQuality(0)).toBe('good');
    });

    it('updates quality on each subsequent rep', () => {
      feedRep(counter, 0.1);                 // 0.10 ≤ GOOD_MAX → good
      expect(counter.getQuality(0)).toBe('good');
      feedRep(counter, 0.25);               // GOOD_MAX < 0.25 ≤ PARTIAL_MAX → partial
      expect(counter.getQuality(0)).toBe('partial');
    });

    it('tracks the minimum height within a down phase for quality', () => {
      counter.processFrame(0, PUSHUP_UP_THRESHOLD);       // up
      counter.processFrame(0, PUSHUP_DOWN_THRESHOLD);     // enters down, min=0.35
      counter.processFrame(0, 0.05);                      // lower — min=0.05
      counter.processFrame(0, 0.2);                       // still down
      counter.processFrame(0, PUSHUP_UP_THRESHOLD);       // up → rep counted with min=0.05
      expect(counter.getQuality(0)).toBe('good');         // 0.05 ≤ GOOD_MAX
    });
  });

  // ── Aggregate stats ─────────────────────────────────────────────────────
  describe('aggregate statistics', () => {
    it('getTotalReps() sums counts across all persons', () => {
      feedRep(counter, 0.2);                               // person 0: 1
      counter.processFrame(1, 0.8);
      counter.processFrame(1, 0.2);
      counter.processFrame(1, 0.8);                       // person 1: 1
      counter.processFrame(1, 0.2);
      counter.processFrame(1, 0.8);                       // person 1: 2
      expect(counter.getTotalReps()).toBe(3);
    });

    it('getAverage() divides total reps by maxPersons', () => {
      const c = new PushupRepetitionCounter(2);
      c.processFrame(0, PUSHUP_UP_THRESHOLD);
      c.processFrame(0, PUSHUP_DOWN_THRESHOLD);
      c.processFrame(0, PUSHUP_UP_THRESHOLD);              // person 0: 1 rep
      // person 1: 0 reps
      expect(c.getAverage()).toBe(0.5);
    });

    it('getResults() returns one entry per person', () => {
      const results = counter.getResults();
      expect(results).toHaveLength(4);
      results.forEach((r, i) => expect(r.personId).toBe(i));
    });
  });

  // ── Reset ────────────────────────────────────────────────────────────────
  describe('reset', () => {
    it('reset() clears all counts', () => {
      feedRep(counter, 0.2);
      feedRep(counter, 0.2);
      counter.reset();
      expect(counter.getTotalReps()).toBe(0);
    });

    it('reset() resets quality to "good"', () => {
      feedRep(counter, PUSHUP_DOWN_THRESHOLD);   // partial quality
      counter.reset();
      expect(counter.getQuality(0)).toBe('good');
    });

    it('reset(personIndex) clears only the specified person', () => {
      feedRep(counter, 0.2);                               // person 0: 1
      counter.processFrame(1, 0.8);
      counter.processFrame(1, 0.2);
      counter.processFrame(1, 0.8);                       // person 1: 1

      counter.reset(0);

      expect(counter.getCount(0)).toBe(0);
      expect(counter.getCount(1)).toBe(1);
    });

    it('reset(personIndex) throws for invalid index', () => {
      expect(() => counter.reset(-1)).toThrow();
      expect(() => counter.reset(4)).toThrow();
    });

    it('allows counting again after full reset', () => {
      feedRep(counter, 0.2);
      counter.reset();
      feedRep(counter, 0.2);
      expect(counter.getCount(0)).toBe(1);
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('handles a long sequence of identical frames without counting', () => {
      for (let i = 0; i < 100; i++) counter.processFrame(0, 0.9);
      expect(counter.getCount(0)).toBe(0);
    });

    it('handles rapid oscillation between thresholds correctly', () => {
      // 10 complete up/down/up cycles
      for (let i = 0; i < 10; i++) {
        counter.processFrame(0, PUSHUP_UP_THRESHOLD);
        counter.processFrame(0, PUSHUP_DOWN_THRESHOLD);
        counter.processFrame(0, PUSHUP_UP_THRESHOLD);
      }
      expect(counter.getCount(0)).toBe(10);
    });

    it('single-person counter (maxPersons=1) tracks correctly', () => {
      const c = new PushupRepetitionCounter(1);
      c.processFrame(0, PUSHUP_UP_THRESHOLD);
      c.processFrame(0, PUSHUP_DOWN_THRESHOLD);
      c.processFrame(0, PUSHUP_UP_THRESHOLD);
      expect(c.getCount(0)).toBe(1);
    });
  });
});
