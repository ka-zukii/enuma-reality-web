import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Disc3,
  ListMusic,
  ListPlus,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { SPOTIFY_TRACKS } from "@/config/spotify";
import {
  store,
  listeners,
  notify,
  findTrack,
  playTrackById,
  playNext,
  playPrev,
  ensureAudio,
  formatSec,
  togglePlay,
  cycleLoop,
  toggleShuffle,
  setVolume,
  toggleMute,
  enqueue,
  removeQueueAt,
} from "@/components/hud/spotify/player";
import { useAudioVisualizer } from "@/components/hud/spotify/useAudioVisualizer";

type SpotifyTab = "player" | "search" | "queue";

export function SpotifyApp({ onBack }: { onBack: () => void }) {
  const [, setTick] = useState(0);
  const [tab, setTab] = useState<SpotifyTab>("player");
  const [query, setQuery] = useState("");

  useEffect(() => {
    ensureAudio();
    const bump = () => setTick((t) => t + 1);
    listeners.add(bump);
    return () => {
      listeners.delete(bump);
    };
  }, []);

  const { bass, bars } = useAudioVisualizer(tab === "player");

  const track = findTrack(store.trackId);
  const progress =
    store.duration > 0 ? (store.currentTime / store.duration) * 100 : 0;

  const filteredTracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SPOTIFY_TRACKS;
    return SPOTIFY_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div
      className={`flex flex-1 flex-col overflow-hidden bg-linear-to-b ${
        track?.bgClass ?? "from-emerald-950 via-zinc-950 to-black"
      } text-white transition-colors duration-500`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali ke beranda ponsel"
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs font-bold tracking-tight">Spotify</span>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">
          {SPOTIFY_TRACKS.length} lagu
        </span>
      </div>

      {/* Konten Tab */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {tab === "player" && track && (
          <div className="flex flex-1 flex-col justify-between p-3">
            {/* Album Art dengan cahaya & denyut beat */}
            <div className="relative mx-auto mt-1 flex h-24 w-24 items-center justify-center">
              <div
                className={`pointer-events-none absolute -inset-2 rounded-3xl bg-linear-to-br ${track.coverClass} blur-lg transition-transform duration-75`}
                style={{
                  opacity: store.playing ? 0.28 + bass * 0.55 : 0.15,
                  transform: `scale(${1 + bass * 0.26})`,
                }}
              />
              <div
                className={`relative flex h-24 w-24 items-center justify-center rounded-2xl bg-linear-to-br ${track.coverClass} shadow-lg transition-transform duration-75`}
                style={{ transform: `scale(${1 + bass * 0.08})` }}
              >
                <Disc3
                  className={`h-12 w-12 text-white/90 ${
                    store.playing ? "animate-spin" : ""
                  }`}
                  style={{ animationDuration: "5s" }}
                />
              </div>
            </div>

            {/* Info Lagu & Equalizer Beat */}
            <div className="space-y-1.5 text-center">
              <div>
                <p className="truncate text-xs font-bold text-white">
                  {track.title}
                </p>
                <p className="truncate text-[10px] text-white/60">
                  {track.artist}
                </p>
              </div>
              <div
                aria-hidden="true"
                className="flex h-5 items-end justify-center gap-1"
              >
                {bars.map((v, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full bg-linear-to-t ${track.coverClass} transition-[height,opacity] duration-75`}
                    style={{
                      height: `${Math.round(v * 100)}%`,
                      opacity: store.playing ? 0.55 + v * 0.45 : 0.25,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div
                onClick={(e) => {
                  const audio = ensureAudio();
                  if (!audio.duration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(
                    0,
                    Math.min(1, (e.clientX - rect.left) / rect.width),
                  );
                  audio.currentTime = ratio * audio.duration;
                  store.currentTime = audio.currentTime;
                  notify();
                }}
                className="h-1.5 w-full overflow-hidden rounded-full bg-white/15 cursor-pointer"
              >
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-white/50">
                <span>{formatSec(store.currentTime)}</span>
                <span>{formatSec(store.duration)}</span>
              </div>
            </div>

            {/* Kontrol Utama: Shuffle, Prev, Play, Next, Loop */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={toggleShuffle}
                aria-label="Acak"
                aria-pressed={store.shuffle}
                className={`relative p-1 transition cursor-pointer ${
                  store.shuffle
                    ? "text-emerald-400"
                    : "text-white/55 hover:text-white"
                }`}
              >
                <Shuffle className="h-3.5 w-3.5" />
                {store.shuffle && (
                  <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-400" />
                )}
              </button>

              <button
                type="button"
                onClick={playPrev}
                aria-label="Lagu sebelumnya"
                className="p-1 text-white/80 transition hover:text-white cursor-pointer"
              >
                <SkipBack className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={store.playing ? "Jeda" : "Putar"}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-black shadow-md transition hover:bg-emerald-400 active:scale-95 cursor-pointer"
              >
                {store.playing ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="h-4 w-4 translate-x-0.5 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={() => playNext(false)}
                aria-label="Lagu berikutnya"
                className="p-1 text-white/80 transition hover:text-white cursor-pointer"
              >
                <SkipForward className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={cycleLoop}
                aria-label={`Ulangi: ${store.loopMode}`}
                className={`relative p-1 transition cursor-pointer ${
                  store.loopMode !== "off"
                    ? "text-emerald-400"
                    : "text-white/55 hover:text-white"
                }`}
              >
                {store.loopMode === "one" ? (
                  <Repeat1 className="h-3.5 w-3.5" />
                ) : (
                  <Repeat className="h-3.5 w-3.5" />
                )}
                {store.loopMode !== "off" && (
                  <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-400" />
                )}
              </button>
            </div>

            {/* Pengaturan Volume */}
            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-1.5">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={store.muted ? "Bunyikan" : "Bisukan"}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                {store.muted || store.volume === 0 ? (
                  <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={store.muted ? 0 : Math.round(store.volume * 100)}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                aria-label="Volume Spotify"
                className="h-1 flex-1 accent-emerald-400 cursor-pointer"
              />
              <span className="w-7 text-right text-[9px] text-white/60">
                {store.muted ? 0 : Math.round(store.volume * 100)}%
              </span>
            </div>
          </div>
        )}

        {tab === "search" && (
          <div className="flex flex-1 flex-col overflow-hidden p-2.5 gap-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-white/50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Cari lagu atau artis..."
                className="min-w-0 flex-1 bg-transparent text-[11px] text-white placeholder:text-white/40 focus:outline-none"
              />
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden pr-0.5">
              {filteredTracks.length === 0 ? (
                <p className="py-6 text-center text-[11px] text-white/45">
                  Lagu tidak ditemukan
                </p>
              ) : (
                filteredTracks.map((item) => {
                  const isCurrent = item.id === store.trackId;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition ${
                        isCurrent ? "bg-emerald-500/15" : "hover:bg-white/5"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          playTrackById(item.id);
                          setTab("player");
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${item.coverClass}`}
                        >
                          <Disc3 className="h-4 w-4 text-white" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-[11px] font-bold ${
                              isCurrent ? "text-emerald-400" : "text-white"
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="truncate text-[9px] text-white/55">
                            {item.artist}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => enqueue(item.id)}
                        title="Tambah ke antrian"
                        aria-label={`Tambah ${item.title} ke antrian`}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-emerald-400 cursor-pointer"
                      >
                        <ListPlus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {tab === "queue" && (
          <div className="flex flex-1 flex-col overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden p-2.5 space-y-3">
            {track && (
              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-white/45">
                  Sedang Diputar
                </p>
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-2.5 py-2">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${track.coverClass}`}
                  >
                    <Disc3 className="h-3.5 w-3.5 text-white" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-emerald-300">
                      {track.title}
                    </p>
                    <p className="truncate text-[9px] text-white/60">
                      {track.artist}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/45">
                  Berikutnya di Antrian ({store.queue.length})
                </p>
                {store.queue.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      store.queue = [];
                      notify();
                    }}
                    className="text-[9px] font-semibold text-rose-400 hover:underline cursor-pointer"
                  >
                    Hapus semua
                  </button>
                )}
              </div>

              {store.queue.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-center text-[10px] text-white/50">
                  Antrian kosong. Tambahkan lagu dari tab Cari.
                </p>
              ) : (
                <div className="space-y-1">
                  {store.queue.map((id, i) => {
                    const qTrack = findTrack(id);
                    if (!qTrack) return null;
                    return (
                      <div
                        key={`${id}-${i}`}
                        className="flex items-center gap-2 rounded-xl bg-white/5 px-2 py-1.5"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            store.queue = store.queue.slice(i + 1);
                            playTrackById(qTrack.id);
                          }}
                          className="min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <p className="truncate text-[11px] font-semibold text-white">
                            {qTrack.title}
                          </p>
                          <p className="truncate text-[9px] text-white/50">
                            {qTrack.artist}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQueueAt(i)}
                          aria-label="Hapus dari antrian"
                          className="p-1 text-white/45 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar Spotify */}
      <div className="grid grid-cols-3 border-t border-white/10 bg-black/70 py-1 text-[9px] font-semibold">
        <button
          type="button"
          onClick={() => setTab("player")}
          className={`flex flex-col items-center gap-0.5 py-1 cursor-pointer ${
            tab === "player"
              ? "text-emerald-400"
              : "text-white/55 hover:text-white"
          }`}
        >
          <Disc3 className="h-3.5 w-3.5" />
          Putar
        </button>
        <button
          type="button"
          onClick={() => setTab("search")}
          className={`flex flex-col items-center gap-0.5 py-1 cursor-pointer ${
            tab === "search"
              ? "text-emerald-400"
              : "text-white/55 hover:text-white"
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          Cari
        </button>
        <button
          type="button"
          onClick={() => setTab("queue")}
          className={`relative flex flex-col items-center gap-0.5 py-1 cursor-pointer ${
            tab === "queue"
              ? "text-emerald-400"
              : "text-white/55 hover:text-white"
          }`}
        >
          <ListMusic className="h-3.5 w-3.5" />
          Antrian
          {store.queue.length > 0 && (
            <span className="absolute right-4 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[8px] font-bold text-black">
              {store.queue.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
