import { describe, expect, it } from '@jest/globals';
import { RoundNumberPickerService } from '../src/services/round-number-picker.service';

const picker = new RoundNumberPickerService();
const base = {
  teamSize: 12,
  playersPerRound: 5,
  exclusionMode: 'unused' as const,
  usedNumbers: [] as number[],
  previousNumbers: [] as number[]
};

describe('RoundNumberPickerService', () => {
  it('draws distinct numbers in the configured range', () => {
    expect(picker.draw(base, () => 0.99999)).toEqual([1, 2, 3, 4, 5]);
  });

  it('excludes everyone previously selected in unused mode', () => {
    const numbers = picker.draw({
      ...base,
      usedNumbers: [1, 2, 3, 4, 5],
      previousNumbers: [1, 2, 3, 4, 5]
    }, () => 0.99999);
    expect(numbers).toEqual([6, 7, 8, 9, 10]);
  });

  it('does not silently restart an exhausted cycle', () => {
    expect(picker.draw({
      ...base,
      usedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    })).toBeNull();
  });

  it('excludes only the previous round when configured', () => {
    const numbers = picker.draw({
      ...base,
      exclusionMode: 'previous',
      usedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      previousNumbers: [6, 7, 8, 9, 10]
    }, () => 0.99999);
    expect(numbers).toEqual([1, 2, 3, 4, 5]);
  });

  it('allows prior numbers in unrestricted mode', () => {
    expect(picker.draw({
      ...base,
      exclusionMode: 'any',
      usedNumbers: [1, 2, 3, 4, 5],
      previousNumbers: [1, 2, 3, 4, 5]
    }, () => 0)).toEqual([1, 2, 3, 4, 5]);
  });

  it('never draws the same number twice in a round', () => {
    const numbers = picker.draw({ ...base, exclusionMode: 'any' }, () => 0.99999);
    expect(numbers).toHaveLength(5);
    expect(new Set(numbers).size).toBe(5);
  });

  it('rejects invalid configuration', () => {
    expect(() => picker.draw({ ...base, teamSize: 0 })).toThrow('teamSize');
    expect(() => picker.draw({ ...base, playersPerRound: 13 })).toThrow('playersPerRound');
    expect(() => picker.draw({ ...base, playersPerRound: 1.5 })).toThrow('playersPerRound');
  });
});
