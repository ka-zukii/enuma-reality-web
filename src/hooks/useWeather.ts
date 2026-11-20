import { useEffect, useState } from "react";

export type WeatherKind = "sun" | "cloud" | "fog" | "rain" | "storm";

export interface Weather {
  temp: number;
  label: string;
  kind: WeatherKind;
  /** Nama kecamatan dari BMKG (mis. "Kartasura") */
  place?: string;
}

/** Alamat backend. Samakan nama variabelnya dengan yang sudah dipakai di proyek. */
const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:4000";

const REFRESH_MS = 15 * 60 * 1000;

interface BmkgEntry {
  datetime: string; // UTC, mis. "2026-11-20T08:00:00Z"
  t: number;
  weather: number;
  weather_desc?: string;
}

/** Kode cuaca BMKG -> jenis ikon */
function kindFromCode(code: number): WeatherKind {
  if (code >= 95) return "storm";
  if (code >= 60 && code <= 82) return "rain";
  if (code === 5 || code === 10 || code === 45) return "fog";
  if (code === 3 || code === 4) return "cloud";
  if (code === 0 || code === 1 || code === 2) return "sun";
  return "cloud";
}

/** Ambil prakiraan dengan waktu terdekat dari sekarang */
function pickNearest(entries: BmkgEntry[]): BmkgEntry | null {
  const now = Date.now();
  let best: BmkgEntry | null = null;
  let bestDiff = Infinity;
  for (const e of entries) {
    const diff = Math.abs(new Date(e.datetime).getTime() - now);
    if (diff < bestDiff) {
      best = e;
      bestDiff = diff;
    }
  }
  return best;
}

/** Cuaca dari backend (BMKG). Null bila gagal dimuat. */
export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    let controller = new AbortController();

    const load = () => {
      controller.abort();
      controller = new AbortController();

      fetch(`${API_URL}/api/weather`, { signal: controller.signal })
        .then((res) =>
          res.ok ? res.json() : Promise.reject(new Error("gagal")),
        )
        .then((json) => {
          const item = json?.data?.data?.[0];
          const entries: BmkgEntry[] = (item?.cuaca ?? []).flat();
          const nearest = pickNearest(entries);
          if (!nearest || typeof nearest.t !== "number") return;

          setWeather({
            temp: Math.round(nearest.t),
            label: nearest.weather_desc ?? "Berawan",
            kind: kindFromCode(Number(nearest.weather)),
            place: item?.lokasi?.kecamatan,
          });
        })
        .catch(() => {
          /* cuaca hanya pelengkap: bila gagal, baris cuaca tidak ditampilkan */
        });
    };

    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      window.clearInterval(timer);
      controller.abort();
    };
  }, []);

  return weather;
}