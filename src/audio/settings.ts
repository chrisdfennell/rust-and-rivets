// Persisted audio prefs (music + SFX mute). Lives in its own localStorage key
// so it survives across runs and isn't tied to the save bundle.

const KEY = 'rust-and-rivets/audio/v1';

interface AudioSettings {
  musicMuted: boolean;
  sfxMuted: boolean;
}

const DEFAULTS: AudioSettings = { musicMuted: false, sfxMuted: false };

let cache: AudioSettings | null = null;

function read(): AudioSettings {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<AudioSettings>;
      cache = { ...DEFAULTS, ...data };
      return cache;
    }
  } catch {
    // ignore
  }
  cache = { ...DEFAULTS };
  return cache;
}

function write(s: AudioSettings): void {
  cache = s;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function getAudioSettings(): AudioSettings {
  return { ...read() };
}

export function setMusicMutedPref(muted: boolean): void {
  const cur = read();
  write({ ...cur, musicMuted: muted });
}

export function setSfxMutedPref(muted: boolean): void {
  const cur = read();
  write({ ...cur, sfxMuted: muted });
}
