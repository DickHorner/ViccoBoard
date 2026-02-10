/**
 * Audio Service for ViccoBoard
 * Handles audio playback with Safari/WebKit compatibility
 * 
 * Safari Constraints:
 * - AudioContext must be unlocked via user gesture
 * - No audio plays until user interaction
 * - Respects mute setting
 */

export type AudioSignalType = 'beep-short' | 'beep-long' | 'beep-final';

export interface AudioServiceOptions {
  enabled?: boolean;
}

export class AudioService {
  private audioContext: AudioContext | null = null;
  private unlocked = false;
  private enabled = true;

  constructor(options: AudioServiceOptions = {}) {
    this.enabled = options.enabled !== false;
  }

  /**
   * Unlock audio context on user gesture (Safari requirement)
   * Must be called from a user event handler (click, touch, etc.)
   */
  async unlock(): Promise<boolean> {
    if (this.unlocked) {
      return true;
    }

    try {
      // Create AudioContext on first user interaction
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume if suspended (Safari requirement)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.unlocked = true;
      return true;
    } catch (error) {
      console.warn('Failed to unlock audio context:', error);
      return false;
    }
  }

  /**
   * Play an audio signal using Web Audio API
   * @param type Signal type (short/long/final)
   * @param frequency Optional frequency in Hz (default: 800)
   */
  async playSignal(type: AudioSignalType, frequency = 800): Promise<void> {
    if (!this.enabled || !this.unlocked || !this.audioContext) {
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      // Different durations for different signals
      let duration = 0.1; // Short beep
      let volume = 0.3;

      if (type === 'beep-long') {
        duration = 0.3;
        volume = 0.4;
      } else if (type === 'beep-final') {
        duration = 0.5;
        volume = 0.5;
        frequency = 1000; // Higher pitch for final
      }

      gainNode.gain.value = volume;

      const now = this.audioContext.currentTime;
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (error) {
      console.warn('Failed to play audio signal:', error);
    }
  }

  /**
   * Play a countdown beep (3, 2, 1, GO!)
   */
  async playCountdownBeep(count: number): Promise<void> {
    if (count > 0) {
      await this.playSignal('beep-short', 600);
    } else {
      await this.playSignal('beep-final', 1000);
    }
  }

  /**
   * Set enabled state (respects mute setting)
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if audio is ready to play
   */
  isReady(): boolean {
    return this.unlocked && this.enabled && this.audioContext !== null;
  }

  /**
   * Clean up audio context
   */
  async dispose(): Promise<void> {
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
      this.unlocked = false;
    }
  }
}

// Singleton instance for app-wide use
let audioServiceInstance: AudioService | null = null;

export function getAudioService(): AudioService {
  if (!audioServiceInstance) {
    audioServiceInstance = new AudioService();
  }
  return audioServiceInstance;
}

export function resetAudioService(): void {
  if (audioServiceInstance) {
    audioServiceInstance.dispose();
    audioServiceInstance = null;
  }
}
