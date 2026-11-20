/** Local, offline-capable short audio clips for the scoreboard. */
export type ScoreboardSoundKind = 'start' | 'warning' | 'end';

export interface ScoreboardSoundClip {
  name: string;
  dataUrl: string;
}

export type ScoreboardSoundClips = Partial<Record<ScoreboardSoundKind, ScoreboardSoundClip>>;

const STORAGE_KEY = 'viccoboard-scoreboard-sounds-v1';
const MAX_SOUND_BYTES = 256 * 1024;
const SOUND_KINDS: ScoreboardSoundKind[] = ['start', 'warning', 'end'];

export class ScoreboardSoundLibrary {
  load(): ScoreboardSoundClips {
    let stored: unknown;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      stored = JSON.parse(raw);
    } catch {
      return {};
    }
    if (!stored || typeof stored !== 'object') return {};

    const clips: ScoreboardSoundClips = {};
    const values = stored as Record<string, unknown>;
    for (const kind of SOUND_KINDS) {
      const clip = values[kind];
      if (!clip || typeof clip !== 'object') continue;
      const item = clip as Record<string, unknown>;
      if (typeof item.name === 'string' && item.name.length <= 120 &&
        typeof item.dataUrl === 'string' &&
        /^data:audio\/[\w.+-]+;base64,[A-Za-z0-9+/=]+$/.test(item.dataUrl) &&
        item.dataUrl.length <= MAX_SOUND_BYTES * 2) {
        clips[kind] = { name: item.name, dataUrl: item.dataUrl };
      }
    }
    return clips;
  }

  async replace(kind: ScoreboardSoundKind, file: File): Promise<ScoreboardSoundClip> {
    if (!SOUND_KINDS.includes(kind)) throw new Error('Unknown sound');
    if (!file.type.startsWith('audio/')) throw new Error('Bitte eine Audiodatei auswählen.');
    if (file.size < 1 || file.size > MAX_SOUND_BYTES) {
      throw new Error('Audiodatei muss zwischen 1 Byte und 256 KiB groß sein.');
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Audiodatei konnte nicht gelesen werden.'));
      reader.readAsDataURL(file);
    });
    if (!/^data:audio\/[\w.+-]+;base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) {
      throw new Error('Audiodatei hat ein ungültiges Format.');
    }
    const clip = { name: file.name.slice(0, 120), dataUrl };
    const updated = { ...this.load(), [kind]: clip };
    this.persist(updated);
    return clip;
  }

  remove(kind: ScoreboardSoundKind): void {
    const updated = this.load();
    delete updated[kind];
    this.persist(updated);
  }

  private persist(clips: ScoreboardSoundClips): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clips));
    } catch {
      throw new Error('Audiodatei konnte nicht lokal gespeichert werden.');
    }
  }
}
