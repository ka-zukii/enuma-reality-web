export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  src: string;
  /** Gradien sampul lagu (kelas Tailwind) */
  coverClass: string;
  /** Gradien latar belakang aplikasi saat lagu diputar (kelas Tailwind) */
  bgClass: string;
}

/**
 * Daftar lagu Spotify di ponsel.
 * Tambahkan minimal 10 lagu di sini dengan file audio di `public/audio/bgm/`.
 */
export const SPOTIFY_TRACKS: SpotifyTrack[] = [
  {
    id: "ten-am-commute",
    title: "Ten AM Commute",
    artist: "Enuma BGM",
    src: "/audio/bgm/Ten_AM_Commute.mp3",
    coverClass: "from-emerald-400 via-teal-500 to-cyan-600",
    bgClass: "from-emerald-950 via-zinc-950 to-black",
  },
  {
    id: "sunlight-on-the-concrete",
    title: "Sunlight on the Concrete",
    artist: "Enuma BGM",
    src: "/audio/bgm/Sunlight_on_the_Concrete.mp3",
    coverClass: "from-amber-400 via-orange-500 to-rose-500",
    bgClass: "from-amber-950 via-zinc-950 to-black",
  },
  {
    id: "amber-light-on-glass",
    title: "Amber Light On Glass",
    artist: "Enuma BGM",
    src: "/audio/bgm/Amber_Light_On_Glass.mp3",
    coverClass: "from-indigo-400 via-purple-500 to-pink-500",
    bgClass: "from-indigo-950 via-zinc-950 to-black",
  },
];
