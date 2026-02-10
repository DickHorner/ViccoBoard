import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrecisionTimer, formatTime, formatTimeSimple, secondsToMs, msToSeconds } from '../utils/precision-timer';

describe('PrecisionTimer', () => {
  let timer: PrecisionTimer;

  beforeEach(() => {
    timer = new PrecisionTimer();
    vi.useFakeTimers();
  });

  afterEach(() => {
    timer.dispose();
    vi.restoreAllMocks();
  });

  it('should initialize with zero elapsed time', () => {
    expect(timer.getElapsed()).toBe(0);
    expect(timer.isRunning()).toBe(false);
  });

  it('should start timer', () => {
    timer.start();
    expect(timer.isRunning()).toBe(true);
  });

  it('should pause timer', () => {
    timer.start();
    timer.pause();
    
    expect(timer.isRunning()).toBe(false);
    const elapsed = timer.getElapsed();
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  it('should resume from paused state', () => {
    timer.start();
    vi.advanceTimersByTime(1000);
    
    timer.pause();
    const pausedTime = timer.getElapsed();
    
    timer.start();
    expect(timer.isRunning()).toBe(true);
    expect(timer.getElapsed()).toBeGreaterThanOrEqual(pausedTime);
  });

  it('should stop and reset timer', () => {
    timer.start();
    vi.advanceTimersByTime(1000);
    
    timer.stop();
    
    expect(timer.isRunning()).toBe(false);
    expect(timer.getElapsed()).toBe(0);
  });

  it('should call callback with elapsed time', () => {
    const callback = vi.fn();
    
    timer.start(callback);
    vi.advanceTimersByTime(100);
    
    // Callback should be called with elapsed time
    expect(callback).toHaveBeenCalled();
    expect(callback.mock.calls[0][0]).toBeGreaterThanOrEqual(0);
  });

  it('should return current state', () => {
    const state = timer.getState();
    
    expect(state).toHaveProperty('running');
    expect(state).toHaveProperty('startTime');
    expect(state).toHaveProperty('pausedTime');
    expect(state).toHaveProperty('elapsed');
  });

  it('should not start if already running', () => {
    timer.start();
    const firstStartTime = timer.getState().startTime;
    
    timer.start();
    const secondStartTime = timer.getState().startTime;
    
    expect(firstStartTime).toBe(secondStartTime);
  });

  it('should not pause if not running', () => {
    timer.pause();
    expect(timer.isRunning()).toBe(false);
    expect(timer.getElapsed()).toBe(0);
  });
});

describe('Time formatting utilities', () => {
  it('should format milliseconds to MM:SS.mmm', () => {
    expect(formatTime(0)).toBe('00:00.000');
    expect(formatTime(1000)).toBe('00:01.000');
    expect(formatTime(1234)).toBe('00:01.234');
    expect(formatTime(61234)).toBe('01:01.234');
    expect(formatTime(3661234)).toBe('61:01.234');
  });

  it('should format milliseconds to MM:SS', () => {
    expect(formatTimeSimple(0)).toBe('00:00');
    expect(formatTimeSimple(1000)).toBe('00:01');
    expect(formatTimeSimple(1999)).toBe('00:01');
    expect(formatTimeSimple(61000)).toBe('01:01');
    expect(formatTimeSimple(3661000)).toBe('61:01');
  });

  it('should convert seconds to milliseconds', () => {
    expect(secondsToMs(0)).toBe(0);
    expect(secondsToMs(1)).toBe(1000);
    expect(secondsToMs(1.5)).toBe(1500);
    expect(secondsToMs(60)).toBe(60000);
  });

  it('should convert milliseconds to seconds', () => {
    expect(msToSeconds(0)).toBe(0);
    expect(msToSeconds(1000)).toBe(1);
    expect(msToSeconds(1500)).toBe(1.5);
    expect(msToSeconds(60000)).toBe(60);
  });
});
