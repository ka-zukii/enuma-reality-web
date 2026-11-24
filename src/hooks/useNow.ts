import { useEffect, useState } from "react";
import { BREAK_HOURS, WORK_HOURS } from "@/config/enuma";

const TZ = "Asia/Jakarta";

/** Waktu sekarang, diperbarui berkala */
export function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Contoh hasil: "Kam, 19 Nov · 09:51 WIB" */
export function formatDateTimeWib(d: Date) {
  const date = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(d);
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TZ,
  })
    .format(d)
    .replace(".", ":");
  return `${date} · ${time} WIB`;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function wibParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
    timeZone: TZ,
  }).formatToParts(d);
  const weekday = WEEKDAY_INDEX[parts.find((p) => p.type === "weekday")?.value ?? ""];
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  return { weekday, hour };
}

/** Jam kerja pada jam WIB tertentu (hari diambil dari d) */
export function isWorkingAt(d: Date, hour: number) {
  const { weekday } = wibParts(d);
  return WORK_HOURS.days.includes(weekday) && hour >= WORK_HOURS.start && hour < WORK_HOURS.end;
}

export function isWorkingHours(d: Date) {
  return isWorkingAt(d, wibParts(d).hour);
}

/** Istirahat siang pada jam WIB tertentu */
export function isBreakAt(hour: number) {
  return hour >= BREAK_HOURS.start && hour < BREAK_HOURS.end;
}

export function isBreakTime(d: Date) {
  return isBreakAt(wibParts(d).hour);
}

/** Tanggal & waktu tampilan, tetapi jam diganti jam tetap (mis. 08:00) */
export function formatWibAt(d: Date, hour: number) {
  const hh = String(hour).padStart(2, "0");
  return formatDateTimeWib(d).replace(/\d{2}:\d{2}/, `${hh}:00`);
}