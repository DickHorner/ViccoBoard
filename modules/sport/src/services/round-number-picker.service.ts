export type RoundExclusionMode = 'unused' | 'previous' | 'any';

export interface RoundNumberPickerInput {
  teamSize: number;
  playersPerRound: number;
  exclusionMode: RoundExclusionMode;
  usedNumbers: readonly number[];
  previousNumbers: readonly number[];
}

/**
 * Draws shared shirt numbers for both teams, without replacement within a round.
 * The caller owns the round history and decides when to begin a new cycle.
 */
export class RoundNumberPickerService {
  eligibleNumbers(input: RoundNumberPickerInput): number[] {
    if (!Number.isInteger(input.teamSize) || input.teamSize < 1 || input.teamSize > 99) {
      throw new Error('teamSize must be an integer between 1 and 99');
    }
    if (!Number.isInteger(input.playersPerRound) ||
        input.playersPerRound < 1 || input.playersPerRound > input.teamSize) {
      throw new Error('playersPerRound must be between 1 and teamSize');
    }
    if (!['unused', 'previous', 'any'].includes(input.exclusionMode)) {
      throw new Error('invalid exclusionMode');
    }

    const excluded = new Set(
      input.exclusionMode === 'unused' ? input.usedNumbers :
      input.exclusionMode === 'previous' ? input.previousNumbers : []
    );
    return Array.from({ length: input.teamSize }, (_, index) => index + 1)
      .filter(number => !excluded.has(number));
  }

  draw(input: RoundNumberPickerInput, random: () => number = Math.random): number[] | null {
    const available = this.eligibleNumbers(input);
    if (available.length < input.playersPerRound) return null;

    for (let i = available.length - 1; i > 0; i--) {
      const value = random();
      const j = Math.floor(Math.min(Math.max(value, 0), 0.999999999) * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }
    return available.slice(0, input.playersPerRound).sort((a, b) => a - b);
  }
}
