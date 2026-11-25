import { SPOTIFY_TRACKS, type SpotifyTrack } from "@/config/spotify";

export type LoopMode = "off" | "all" | "one";

export interface PlayerState {
  trackId: string;
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  loopMode: LoopMode;
  queue: string[];
}

export const DEFAULT_TRACK = SPOTIFY_TRACKS[0];

// State & audio tunggal agar musik terus berjalan saat keluar dari aplikasi/ponsel
export const store: PlayerState = {
  trackId: DEFAULT_TRACK?.id ?? "",
  playing: false,
  currentTime: 0,
  duration: 0,
  volume: 0.5,
  muted: false,
  shuffle: false,
  loopMode: "all",
  queue: [],
};

let audioEl: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;
export let analyserNode: AnalyserNode | null = null;
export const listeners = new Set<() => void>();

export function resumeAudioContext() {
  if (audioCtx && audioCtx.state === "suspended") {
    void audioCtx.resume().catch(() => {});
  }
}

export function notify() {
  for (const fn of listeners) fn();
}

export function findTrack(id: string): SpotifyTrack | undefined {
  return SPOTIFY_TRACKS.find((t) => t.id === id) ?? SPOTIFY_TRACKS[0];
}

export function pickRandomTrackId(excludeId: string): string {
  const pool = SPOTIFY_TRACKS.filter((t) => t.id !== excludeId);
  if (pool.length === 0) return excludeId;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

export function playTrackById(id: string) {
  const track = findTrack(id);
  if (!track) return;
  const audio = ensureAudio();
  if (store.trackId !== track.id) {
    store.trackId = track.id;
    audio.src = track.src;
    store.currentTime = 0;
  }
  resumeAudioContext();
  void audio.play().catch(() => {
    store.playing = false;
    notify();
  });
  notify();
}

export function playNext(fromEnded = false) {
  const audio = ensureAudio();

  if (fromEnded && store.loopMode === "one") {
    audio.currentTime = 0;
    void audio.play().catch(() => {});
    return;
  }

  // Prioritaskan antrian berikutnya jika ada
  if (store.queue.length > 0) {
    const [nextId, ...rest] = store.queue;
    store.queue = rest;
    playTrackById(nextId);
    return;
  }

  if (SPOTIFY_TRACKS.length <= 1) {
    audio.currentTime = 0;
    if (!fromEnded || store.loopMode === "all") {
      void audio.play().catch(() => {});
    } else {
      store.playing = false;
    }
    notify();
    return;
  }

  if (store.shuffle) {
    playTrackById(pickRandomTrackId(store.trackId));
    return;
  }

  const idx = SPOTIFY_TRACKS.findIndex((t) => t.id === store.trackId);
  const nextIdx = idx + 1;
  if (nextIdx < SPOTIFY_TRACKS.length) {
    playTrackById(SPOTIFY_TRACKS[nextIdx].id);
  } else if (store.loopMode === "all" || !fromEnded) {
    playTrackById(SPOTIFY_TRACKS[0].id);
  } else {
    store.playing = false;
    notify();
  }
}

export function playPrev() {
  const audio = ensureAudio();
  if (audio.currentTime > 3 || SPOTIFY_TRACKS.length <= 1) {
    audio.currentTime = 0;
    store.currentTime = 0;
    notify();
    return;
  }
  if (store.shuffle) {
    playTrackById(pickRandomTrackId(store.trackId));
    return;
  }
  const idx = SPOTIFY_TRACKS.findIndex((t) => t.id === store.trackId);
  const prevIdx = (idx - 1 + SPOTIFY_TRACKS.length) % SPOTIFY_TRACKS.length;
  playTrackById(SPOTIFY_TRACKS[prevIdx].id);
}

export function ensureAudio(): HTMLAudioElement {
  if (audioEl) return audioEl;
  const track = findTrack(store.trackId);
  const audio = new Audio(track?.src ?? "");
  audio.volume = store.volume;
  audio.muted = store.muted;

  audio.addEventListener("timeupdate", () => {
    store.currentTime = audio.currentTime;
    store.duration = audio.duration || 0;
    notify();
  });
  audio.addEventListener("loadedmetadata", () => {
    store.duration = audio.duration || 0;
    notify();
  });
  audio.addEventListener("play", () => {
    store.playing = true;
    notify();
  });
  audio.addEventListener("pause", () => {
    store.playing = false;
    notify();
  });
  audio.addEventListener("ended", () => {
    playNext(true);
  });

  // Hubungkan AnalyserNode untuk animasi beat & visualizer real-time
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
      const source = audioCtx.createMediaElementSource(audio);
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 64;
      analyserNode.smoothingTimeConstant = 0.78;
      source.connect(analyserNode);
      analyserNode.connect(audioCtx.destination);
    }
  } catch {
    analyserNode = null;
  }

  audioEl = audio;
  return audio;
}

export function formatSec(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const togglePlay = () => {
  const audio = ensureAudio();
  resumeAudioContext();
  if (audio.paused) {
    void audio.play().catch(() => {
      store.playing = false;
      notify();
    });
  } else {
    audio.pause();
  }
};

export const cycleLoop = () => {
  const order: LoopMode[] = ["off", "all", "one"];
  const next = order[(order.indexOf(store.loopMode) + 1) % order.length];
  store.loopMode = next;
  notify();
};

export const toggleShuffle = () => {
  store.shuffle = !store.shuffle;
  notify();
};

export const setVolume = (v: number) => {
  const clamped = Math.max(0, Math.min(1, v));
  const audio = ensureAudio();
  store.volume = clamped;
  store.muted = clamped === 0;
  audio.volume = clamped;
  audio.muted = store.muted;
  notify();
};

export const toggleMute = () => {
  const audio = ensureAudio();
  store.muted = !store.muted;
  audio.muted = store.muted;
  notify();
};

export const enqueue = (id: string) => {
  store.queue = [...store.queue, id];
  notify();
};

export const removeQueueAt = (idx: number) => {
  store.queue = store.queue.filter((_, i) => i !== idx);
  notify();
};
