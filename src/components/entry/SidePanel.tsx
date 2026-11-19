import { useState } from "react";
import {
  ChevronDown,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { COMPANY, ROOMS, STATUS_CHIPS, TEAM } from "@/config/enuma";
import { formatDateTimeWib, isWorkingHours, useNow } from "@/hooks/useNow";
import { useWeather, type WeatherKind } from "@/hooks/useWeather";

const WEATHER_ICON: Record<WeatherKind, LucideIcon> = {
  sun: Sun,
  cloud: Cloud,
  fog: CloudFog,
  rain: CloudRain,
  storm: CloudLightning,
};

const cardClass = "rounded-3xl bg-white/95 shadow-xl backdrop-blur";

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

/** Kartu 1: jam kerja, cuaca, jumlah orang, dan tombol status */
function InfoCard({ onlineCount }: { onlineCount?: number }) {
  const now = useNow();
  const weather = useWeather();
  const [status, setStatus] = useState<string>("Live");
  const working = isWorkingHours(now);
  const WeatherIcon = weather ? WEATHER_ICON[weather.kind] : Cloud;

  return (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-extrabold tracking-wide ${
            working
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {working ? "JAM KERJA" : "DI LUAR JAM KERJA"}
        </span>
        <span className="text-[11px] text-slate-500">
          {formatDateTimeWib(now)}
        </span>
      </div>

      {weather && (
        <div className="mt-4 flex items-center gap-3">
          <WeatherIcon className="h-8 w-8 text-blue-600" strokeWidth={1.75} />
          <div className="leading-tight">
            <p className="text-sm text-slate-900">
              <span className="font-semibold">{weather.label}</span> ·{" "}
              {weather.temp}°C
            </p>
            <p className="text-sm text-slate-500">{COMPANY.city}</p>
          </div>
        </div>
      )}

      {typeof onlineCount === "number" && (
        <p className="mt-4 text-xs text-slate-700">
          <span className="font-bold">{onlineCount} Orang</span> di kantor
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {STATUS_CHIPS.map((chip) => {
          const active = chip === status;
          return (
            <button
              key={chip}
              onClick={() => setStatus(chip)}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition cursor-pointer ${
                active
                  ? "bg-black text-white"
                  : "bg-slate-100 text-slate-800 hover:bg-slate-200"
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

/** Kartu lipat dengan judul dan panah */
function CollapsibleCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string | number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${cardClass} overflow-hidden`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left cursor-pointer"
      >
        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-800">
          {title}
          {badge !== undefined && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
              {badge}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

interface SidePanelProps {
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
}: SidePanelProps) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);

  return (
    <div className="pointer-events-auto absolute left-3 top-[116px] hidden max-h-[calc(100vh-148px)] w-[384px] flex-col gap-3 overflow-y-auto p-1 sm:left-7 sm:flex">
      <InfoCard onlineCount={onlineCount} />

      <CollapsibleCard title="Ruangan">
        <ul className="space-y-1">
          {ROOMS.map((room) => (
            <li key={room.id}>
              <button
                onClick={() => {
                  setRoomId(room.id);
                  onRoomSelect?.(room.id);
                }}
                className={`w-full rounded-xl px-4 py-3 text-left text-base font-medium transition cursor-pointer ${
                  roomId === room.id
                    ? "bg-slate-200 text-slate-900"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {room.label}
              </button>
            </li>
          ))}
        </ul>
      </CollapsibleCard>

      <CollapsibleCard title="Tim Kami" badge={TEAM.length}>
        <ul className="space-y-1">
          {TEAM.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => {
                  setMemberId(m.id);
                  onMemberSelect?.(m.id);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition cursor-pointer ${
                  memberId === m.id ? "bg-slate-200" : "hover:bg-slate-100"
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-extrabold text-blue-700">
                  {initials(m.name)}
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-sm font-bold text-slate-900">
                    {m.name}{" "}
                    <span className="text-xs font-medium text-slate-500">
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