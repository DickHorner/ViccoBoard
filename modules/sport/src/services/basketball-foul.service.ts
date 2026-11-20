/**
 * School basketball foul rules from the user-provided simplified rules sheet.
 * Keeps event history so quarter totals and player totals cannot drift apart.
 */
export type BasketballFoulKind = 'defense' | 'offense' | 'technical';
export type BasketballShotSituation = 'none' | 'missed-two' | 'missed-three' | 'made';

export interface BasketballFoulEvent {
  teamId: string;
  quarter: 1 | 2 | 3 | 4;
  kind: BasketballFoulKind;
  playerNumber?: number;
  shot: BasketballShotSituation;
}

export class BasketballFoulService {
  add(events: readonly BasketballFoulEvent[], event: BasketballFoulEvent): BasketballFoulEvent[] {
    if (!event.teamId.trim()) throw new Error('teamId is required');
    if (![1, 2, 3, 4].includes(event.quarter)) throw new Error('quarter must be 1-4');
    if (!['defense', 'offense', 'technical'].includes(event.kind)) throw new Error('invalid foul kind');
    if (!['none', 'missed-two', 'missed-three', 'made'].includes(event.shot)) {
      throw new Error('invalid shot situation');
    }
    if (event.playerNumber !== undefined &&
      (!Number.isInteger(event.playerNumber) || event.playerNumber < 0 || event.playerNumber > 99)) {
      throw new Error('playerNumber must be 0-99');
    }
    if (event.kind === 'technical' && event.shot !== 'none') {
      throw new Error('technical fouls cannot have a shot situation');
    }
    return [...events, { ...event }];
  }

  teamQuarterTotal(events: readonly BasketballFoulEvent[], teamId: string, quarter: number): number {
    return events.filter(event =>
      event.teamId === teamId && event.quarter === quarter && event.kind !== 'technical'
    ).length;
  }

  technicalTotal(events: readonly BasketballFoulEvent[], teamId: string): number {
    return events.filter(event => event.teamId === teamId && event.kind === 'technical').length;
  }

  playerTotal(events: readonly BasketballFoulEvent[], teamId: string, playerNumber: number): number {
    return events.filter(event =>
      event.teamId === teamId && event.playerNumber === playerNumber
    ).length;
  }

  excludedPlayers(events: readonly BasketballFoulEvent[], teamId: string): number[] {
    const numbers = new Set(events.filter(event =>
      event.teamId === teamId && event.playerNumber !== undefined
    ).map(event => event.playerNumber as number));

    return [...numbers].filter(number => this.playerTotal(events, teamId, number) >= 5)
      .sort((a, b) => a - b);
  }

  freeThrowsForFoul(events: readonly BasketballFoulEvent[], event: BasketballFoulEvent): number | null {
    if (event.kind === 'technical') return null;
    if (event.shot === 'made') return 1;
    if (event.shot === 'missed-two') return 2;
    if (event.shot === 'missed-three') return 3;
    return this.teamQuarterTotal(events, event.teamId, event.quarter) >= 5 ? 2 : 0;
  }
}
