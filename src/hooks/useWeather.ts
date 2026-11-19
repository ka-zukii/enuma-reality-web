import { useEffect, useState } from "react";
import { COMPANY } from "@/config/enuma";

export type WeatherKind = "sun" | "cloud" | "fog" | "rain" | "storm";

export interface Weather {
  temp: number;
  label: string;
  kind: WeatherKind;
}

function describe(code: number): { label: string; kind: WeatherKind } {
  if (code === 0) return { label: "Cerah", kind: "sun" };
  if (code <= 2) return { label: "Cerah berawan", kind: "sun" };
  if (code === 3) return { label: "Berawan", kind: "cloud" };
  if (code === 45 || code === 48) return { label: "Berkabut", kind: "fog" };
  if (code >= 51 && code <= 57) return { label: "Gerimis", kind: "rain" };
  if (code >= 61 && code <= 67) return { label: "Hujan", kind: "rain" };
  if (code >= 80 && code <= 82) return { label: "Hujan deras", kind: "rain" };
  if (code >= 95) return { label: "Badai petir", kind: "storm" };
  return { label: "Berawan", kind: "cloud" };
}

/** Cuaca saat ini dari Open-Meteo (gratis, tanpa kunci API). Null bila gagal dimuat. */
export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${COMPANY.lat}&longitude=${COMPANY.lon}` +
      "&current=temperature_2m,weather_code&timezone=Asia%2FJakarta";

    fetch(url, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("gagal"))))
      .then((data) => {
        const cur = data?.current;
        if (typeof cur?.temperature_2m === "number") {
          setWeather({
            temp: Math.round(cur.temperature_2m),
            ...describe(Number(cur.weather_code)),
          });
        }
      })
      .catch(() => {
        /* cuaca hanya pelengkap: bila gagal, baris cuaca tidak ditampilkan */
      });

    return () => controller.abort();
  }, []);

  return weather;
}