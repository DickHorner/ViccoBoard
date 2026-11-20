import { describe, expect, it } from '@jest/globals';
import { BasketballFoulService, type BasketballFoulEvent } from '../src/services/basketball-foul.service';

const service = new BasketballFoulService();
const personal: BasketballFoulEvent = {
  teamId: 'a', quarter: 1, kind: 'defense', playerNumber: 7, shot: 'none'
};

describe('BasketballFoulService (simplified school rules)', () => {
  it('applies two free throws starting with the fifth team foul of a quarter', () => {
    let events: BasketballFoulEvent[] = [];
    for (let i = 0; i < 4; i++) {
      events = service.add(events, { ...personal, playerNumber: i + 1 });
      expect(service.freeThrowsForFoul(events, events[events.length - 1])).toBe(0);
    }
    events = service.add(events, personal);
    expect(service.teamQuarterTotal(events, 'a', 1)).toBe(5);
    expect(service.freeThrowsForFoul(events, events[4])).toBe(2);
    expect(service.teamQuarterTotal(events, 'a', 2)).toBe(0);
    expect(service.teamQuarterTotal(events, 'b', 1)).toBe(0);
  });

  it('tracks personal totals across quarters and indicates exclusion at five', () => {
    let events: BasketballFoulEvent[] = [];
    for (let i = 0; i < 5; i++) {
      events = service.add(events, { ...personal, quarter: i < 3 ? 1 : 2 });
    }
    expect(service.playerTotal(events, 'a', 7)).toBe(5);
    expect(service.excludedPlayers(events, 'a')).toEqual([7]);
    expect(service.excludedPlayers(events, 'b')).toEqual([]);
  });

  it('keeps technical fouls distinct without inventing a free-throw penalty', () => {
    const technical = { ...personal, kind: 'technical' as const, shot: 'none' as const };
    const events = service.add([], technical);
    expect(service.technicalTotal(events, 'a')).toBe(1);
    expect(service.teamQuarterTotal(events, 'a', 1)).toBe(0);
    expect(service.playerTotal(events, 'a', 7)).toBe(1);
    expect(service.freeThrowsForFoul(events, technical)).toBeNull();
  });

  it('uses the sheet\'s special penalties for fouls on shots', () => {
    for (const [shot, expected] of [
      ['missed-two', 2], ['missed-three', 3], ['made', 1]
    ] as const) {
      const event = { ...personal, shot };
      expect(service.freeThrowsForFoul(service.add([], event), event)).toBe(expected);
    }
  });

  it('allows an unassigned team foul but rejects invalid identity and quarter', () => {
    const { playerNumber: _ignored, ...unassigned } = personal;
    expect(service.add([], unassigned)).toHaveLength(1);
    expect(() => service.add([], { ...personal, playerNumber: 100 })).toThrow('playerNumber');
    expect(() => service.add([], { ...personal, quarter: 5 as 1 })).toThrow('quarter');
    expect(() => service.add([], { ...personal, teamId: ' ' })).toThrow('teamId');
    expect(() => service.add([], { ...personal, kind: 'technical', shot: 'made' })).toThrow('technical');
  });
});
