import { useEffect, useState } from "react";
import { API_URL } from "@/lib/config";

export type WeatherKind = "sun" | "cloud" | "fog" | "rain" | "storm";

/** Intensitas hujan dari label BMKG */
export type RainIntensity = "light" | "moderate" | "heavy";

export interface Weather {
  temp: number;
  label: string;
  kind: WeatherKind;
  /** Hanya bermakna saat kind = rain atau storm */
  intensity: RainIntensity;
  /** Ada petir (badai atau label "Petir") */
  thunder: boolean;
  /** Nama kecamatan dari BMKG (mis. "Kartasura") */
  place?: string;
}

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

/** Intensitas hujan dari label dan kode BMKG */
function rainIntensity(code: number, desc: string): RainIntensity {
  const d = desc.toLowerCase();
  if (/lebat|deras|ekstrem/.test(d) || [65, 67, 82].includes(code)) return "heavy";
  if (/sedang/.test(d) || [53, 62, 63, 81].includes(code)) return "moderate";
  return "light";
}

/** Petir: kode badai atau label yang menyebut petir */
function hasThunder(code: number, desc: string): boolean {
  return code >= 95 || /petir/.test(desc.toLowerCase());
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

      fetch(`${API_URL}/weather`, { signal: controller.signal })
        .then((res) =>
          res.ok ? res.json() : Promise.reject(new Error("gagal")),
        )
        .then((json) => {
          const item = json?.data?.data?.[0];
          const entries: BmkgEntry[] = (item?.cuaca ?? []).flat();
          const nearest = pickNearest(entries);
          if (!nearest || typeof nearest.t !== "number") return;

          const code = Number(nearest.weather);
          const desc = nearest.weather_desc ?? "";
          setWeather({
            temp: Math.round(nearest.t),
            label: desc || "Berawan",
            kind: kindFromCode(code),
            intensity: rainIntensity(code, desc),
            thunder: hasThunder(code, desc),
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