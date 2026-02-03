import { TimerToolPlugin } from '../src/plugins/timer.plugin';

describe('TimerToolPlugin', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('tracks elapsed time for stopwatch mode', () => {
    const plugin = new TimerToolPlugin(() => Date.now());

    plugin.handleAction({ type: 'start', payload: {} });
    jest.advanceTimersByTime(5000);
    plugin.handleAction({ type: 'tick', payload: {} });
    plugin.handleAction({ type: 'stop', payload: {} });

    const state = plugin.getState();
    expect(state.data.elapsedMs).toBe(5000);
    expect(state.data.running).toBe(false);
  });

  test('resets elapsed time', () => {
    const plugin = new TimerToolPlugin(() => Date.now());

    plugin.handleAction({ type: 'start', payload: {} });
    jest.advanceTimersByTime(2000);
    plugin.handleAction({ type: 'tick', payload: {} });
    plugin.handleAction({ type: 'reset', payload: {} });

    const state = plugin.getState();
    expect(state.data.elapsedMs).toBe(0);
    expect(state.data.running).toBe(false);
  });

  test('counts down to zero with duration', () => {
    const plugin = new TimerToolPlugin(() => Date.now());

    plugin.handleAction({ type: 'setMode', payload: { mode: 'countdown' } });
    plugin.handleAction({ type: 'setDuration', payload: { durationMs: 10000 } });
    plugin.handleAction({ type: 'start', payload: {} });

    jest.advanceTimersByTime(6000);
    plugin.handleAction({ type: 'tick', payload: {} });
    expect(plugin.getState().data.remainingMs).toBe(4000);

    jest.advanceTimersByTime(5000);
    plugin.handleAction({ type: 'tick', payload: {} });

    const state = plugin.getState();
    expect(state.data.remainingMs).toBe(0);
    expect(state.data.completed).toBe(true);
    expect(state.data.running).toBe(false);
  });

  test('tracks interval counts', () => {
    const plugin = new TimerToolPlugin(() => Date.now());

    plugin.handleAction({ type: 'setMode', payload: { mode: 'interval' } });
    plugin.handleAction({ type: 'setInterval', payload: { intervalMs: 2000 } });
    plugin.handleAction({ type: 'start', payload: {} });

    jest.advanceTimersByTime(4500);
    plugin.handleAction({ type: 'tick', payload: {} });

    const state = plugin.getState();
    expect(state.data.intervalCount).toBe(2);
  });
});
