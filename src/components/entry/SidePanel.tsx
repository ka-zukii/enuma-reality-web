import type { TimeMode } from "@/components/WorldLighting";
import type { WeatherOverride } from "@/components/RainEffect";
import { useState, type ReactNode } from "react";
import {
  ChevronRight,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { COMPANY, ROOMS, STATUS_CHIPS, TEAM } from "@/config/enuma";
import {
  formatDateTimeWib,
  formatWibAt,
  isBreakAt,
  isBreakTime,
  isWorkingAt,
  isWorkingHours,
  useNow,
} from "@/hooks/useNow";
import { useWeather, type Weather, type WeatherKind } from "@/hooks/useWeather";

const WEATHER_ICON: Record<WeatherKind, LucideIcon> = {
  sun: Sun,
  cloud: Cloud,
  fog: CloudFog,
  rain: CloudRain,
  storm: CloudLightning,
};

const card =
  "rounded-2xl bg-white/90 shadow-[0_6px_24px_rgba(15,23,42,0.10)] backdrop-blur-md";

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

/** Kartu utama: jam kerja, cuaca, jumlah orang, dan status */
function InfoCard({
  now,
  weather,
  onlineCount,
  timeMode,
  onTimeModeChange,
  weatherOverride,
  onWeatherOverrideChange,
}: {
  now: Date;
  weather: Weather | null;
  onlineCount?: number;
  timeMode: TimeMode;
  onTimeModeChange: (mode: TimeMode) => void;
  weatherOverride: WeatherOverride;
  onWeatherOverrideChange: (o: WeatherOverride) => void;
}) {
  const CHIP_TO_MODE: Record<string, TimeMode> = {
    Live: "live",
    Istirahat: "istirahat",
    Pagi: "pagi",
    Sore: "sore",
    Malam: "malam",
  };
  const MODE_TO_CHIP: Record<TimeMode, string> = {
    live: "Live",
    istirahat: "Istirahat",
    pagi: "Pagi",
    sore: "Sore",
    malam: "Malam",
  };
  const status = MODE_TO_CHIP[timeMode];
  // Mode Pagi/Sore/Malam memakai jam tetap; Live memakai jam WIB asli
  const fixedHour =
    timeMode === "istirahat"
      ? 12
      : timeMode === "pagi"
        ? 8
        : timeMode === "sore"
          ? 17
          : timeMode === "malam"
            ? 21
            : null;
  const working = fixedHour === null ? isWorkingHours(now) : isWorkingAt(now, fixedHour);
  const onBreak = fixedHour === null ? isBreakTime(now) : isBreakAt(fixedHour);
  const shownTime = fixedHour === null ? formatDateTimeWib(now) : formatWibAt(now, fixedHour);
  const WeatherIcon = weather ? WEATHER_ICON[weather.kind] : Cloud;

  return (
    <div className={`${card} p-4`}>
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-bold tracking-wide ${
            working
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {onBreak ? "ISTIRAHAT" : working ? "JAM KERJA" : "DI LUAR JAM"}
        </span>
        <span className="text-xs tabular-nums text-slate-500">
          {shownTime}
        </span>
      </div>

      {weather && (
        <div className="mt-3 flex items-center gap-3">
          <WeatherIcon className="h-6 w-6 text-blue-600" strokeWidth={1.75} />
          <div className="leading-tight">
            <p className="text-[15px] text-slate-900">
              <span className="font-semibold">{weather.label}</span> ·{" "}
              {weather.temp}°C
            </p>
            <p className="text-xs text-slate-500">
              {weather.place ?? COMPANY.city}
            </p>
          </div>
        </div>
      )}

      {typeof onlineCount === "number" && (
        <p className="mt-3 text-[15px] text-slate-500">
          <span className="font-bold text-slate-900">{onlineCount} orang</span>{" "}
          di kantor
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {STATUS_CHIPS.map((chip) => {
          const active =
            chip === "Hujan"
              ? weatherOverride === "hujan"
              : chip === "Badai"
                ? weatherOverride === "badai"
                : chip === status;
          return (
            <button
              key={chip}
              onClick={() => {
                if (chip === "Hujan") {
                  onWeatherOverrideChange(weatherOverride === "hujan" ? null : "hujan");
                } else if (chip === "Badai") {
                  onWeatherOverrideChange(weatherOverride === "badai" ? null : "badai");
                } else {
                  onTimeModeChange(CHIP_TO_MODE[chip] ?? "live");
                }
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition cursor-pointer ${
                active
                  ? "bg-black text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {active && chip === "Live" && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
              {chip}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Kartu lipat dengan judul dan panah kecil */
function CollapsibleCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${card} overflow-hidden`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left cursor-pointer"
      >
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-800">
          {title}
          {badge !== undefined && (
            <span className="rounded-full bg-slate-100 px-2 py-px text-xs font-semibold text-slate-500">
              {badge}
            </span>
          )}
        </span>
        <ChevronRight
          className={`h-4 w-4 text-slate-500 transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      {open && <div className="px-2 pb-2">{children}</div>}
    </div>
  );
}

interface SidePanelProps {
  timeMode?: TimeMode;
  weatherOverride?: WeatherOverride;
  onWeatherOverrideChange?: (o: WeatherOverride) => void;
  onTimeModeChange?: (mode: TimeMode) => void;
  /** Hanya tampil bila diisi (butuh koneksi server) */
  onlineCount?: number;
  /** Dipakai nanti untuk menggerakkan kamera */
  onRoomSelect?: (roomId: string) => void;
  onMemberSelect?: (memberId: string) => void;
}

export function SidePanel({
  onlineCount,
  onRoomSelect,
  onMemberSelect,
  timeMode = "live",
  onTimeModeChange = () => {},
  weatherOverride = null,
  onWeatherOverrideChange = () => {},
}: SidePanelProps) {
  const now = useNow();
  const weather = useWeather();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);

  return (
    <div className="pointer-events-auto absolute left-3 top-28 hidden max-h-[calc(100dvh-132px)] w-[min(336px,calc(100vw-1.5rem))] flex-col gap-3 overflow-y-auto p-1 sm:left-6 sm:flex">
      <InfoCard
        now={now}
        weather={weather}
        onlineCount={onlineCount}
        timeMode={timeMode}
        onTimeModeChange={onTimeModeChange}
        weatherOverride={weatherOverride}
        onWeatherOverrideChange={onWeatherOverrideChange}
      />

      <CollapsibleCard title="Ruangan">
        <ul className="space-y-0.5">
          {ROOMS.map((room) => (
            <li key={room.id}>
              <button
                onClick={() => {
                  setRoomId(room.id);
                  onRoomSelect?.(room.id);
                }}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition cursor-pointer ${
                  roomId === room.id
                    ? "bg-slate-200/80 text-slate-900"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {room.label}
              </button>
            </li>
          ))}
        </ul>
      </CollapsibleCard>

      <CollapsibleCard title="Tim" badge={TEAM.length}>
        <ul className="space-y-0.5">
          {TEAM.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => {
                  setMemberId(m.id);
                  onMemberSelect?.(m.id);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition cursor-pointer ${
                  memberId === m.id ? "bg-slate-200/80" : "hover:bg-slate-100"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                  {initials(m.name)}
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-sm font-semibold text-slate-900">
                    {m.name}
                    <span className="ml-1 font-normal text-slate-500">
                      {m.role}
                    </span>
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {m.desc}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </CollapsibleCard>
    </div>
  );
}