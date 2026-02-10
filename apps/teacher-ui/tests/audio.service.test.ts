import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioService, getAudioService, resetAudioService } from '../services/audio.service';

// Mock AudioContext
class MockAudioContext {
  state = 'suspended';
  currentTime = 0;
  destination = {};

  async resume() {
    this.state = 'running';
  }

  async close() {
    this.state = 'closed';
  }

  createOscillator() {
    return {
      frequency: { value: 0 },
      type: 'sine',
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };
  }

  createGain() {
    return {
      gain: { value: 0 },
      connect: vi.fn()
    };
  }
}

describe('AudioService', () => {
  beforeEach(() => {
    // Mock window.AudioContext
    global.AudioContext = MockAudioContext as any;
    (global as any).webkitAudioContext = MockAudioContext;
    resetAudioService();
  });

  afterEach(() => {
    resetAudioService();
  });

  it('should initialize with default options', () => {
    const service = new AudioService();
    expect(service.isReady()).toBe(false);
  });

  it('should unlock audio context on user gesture', async () => {
    const service = new AudioService();
    const unlocked = await service.unlock();
    
    expect(unlocked).toBe(true);
    expect(service.isReady()).toBe(true);
  });

  it('should not play signal before unlock', async () => {
    const service = new AudioService();
    
    // Should not throw, just silently skip
    await expect(service.playSignal('beep-short')).resolves.toBeUndefined();
    expect(service.isReady()).toBe(false);
  });

  it('should play signal after unlock', async () => {
    const service = new AudioService();
    await service.unlock();
    
    await expect(service.playSignal('beep-short')).resolves.toBeUndefined();
  });

  it('should respect enabled setting', async () => {
    const service = new AudioService({ enabled: false });
    await service.unlock();
    
    expect(service.isReady()).toBe(false);
    
    service.setEnabled(true);
    expect(service.isReady()).toBe(true);
  });

  it('should handle different signal types', async () => {
    const service = new AudioService();
    await service.unlock();
    
    await expect(service.playSignal('beep-short')).resolves.toBeUndefined();
    await expect(service.playSignal('beep-long')).resolves.toBeUndefined();
    await expect(service.playSignal('beep-final')).resolves.toBeUndefined();
  });

  it('should play countdown beeps', async () => {
    const service = new AudioService();
    await service.unlock();
    
    await expect(service.playCountdownBeep(3)).resolves.toBeUndefined();
    await expect(service.playCountdownBeep(0)).resolves.toBeUndefined();
  });

  it('should dispose properly', async () => {
    const service = new AudioService();
    await service.unlock();
    
    expect(service.isReady()).toBe(true);
    
    await service.dispose();
    expect(service.isReady()).toBe(false);
  });

  it('should return singleton instance', () => {
    const service1 = getAudioService();
    const service2 = getAudioService();
    
    expect(service1).toBe(service2);
  });

  it('should handle unlock errors gracefully', async () => {
    // Mock AudioContext to throw
    global.AudioContext = class {
      constructor() {
        throw new Error('AudioContext not supported');
      }
    } as any;

    const service = new AudioService();
    const unlocked = await service.unlock();
    
    expect(unlocked).toBe(false);
    expect(service.isReady()).toBe(false);
  });
});
