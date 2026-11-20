import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  Camera,
  MessageSquare,
  Server,
  Sun,
  X,
  type LucideIcon,
} from "lucide-react";
import { RobloxChatBox } from "@/components/hud/RobloxChatBox";
import { ExitModal } from "@/components/hud/ExitModal";
import {
  type ChatMessage,
  type PlayerStatus,
  type RemotePlayer,
} from "@/types";
import { STATUS_OPTIONS, getStatusMeta } from "@/config/status";
import { zoneLabel } from "@/config/zones";
import { useWeather, type WeatherKind } from "@/hooks/useWeather";
import type { BuildingInfo } from "@/config/buildings";
import { CAMERA_OPTIONS, type CameraMode } from "@/config/camera";

interface VOfficeOverlayProps {
  currentUserId: string;
  onlineCount: number;
  currentZone?: string;
  messages: ChatMessage[];
  remotePlayers: RemotePlayer[];
  onSendMessage: (
    channel: "PROXIMITY" | "GLOBAL" | "PRIVATE",
    content: string,
    receiverId?: string,
  ) => void;
  onZoneSelect?: (zone: string) => void;
  selectedBuilding?: BuildingInfo | null;
  onCloseBuildingDetail?: () => void;
  onEnterBuilding?: () => void;
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
  isChatFocused: boolean;
  onFocusChatChange: (focused: boolean) => void;
  onOpenWorkspaceModal: () => void;
  workspaceName?: string;
  userStatus: PlayerStatus;
  onStatusChange: (status: PlayerStatus) => void;
  /** Dipanggil saat pengunjung mengonfirmasi keluar */
  onExit?: () => void;
}

const WEATHER_ICON: Record<WeatherKind, LucideIcon> = {
  sun: Sun,
  cloud: Cloud,
  fog: CloudFog,
  rain: CloudRain,
  storm: CloudLightning,
};



const pillClass =
  "flex h-9 items-center rounded-full bg-white/95 shadow-lg backdrop-blur";

function Key({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-blue-600 px-1.5 text-xs font-bold text-white">
      {children}
    </span>
  );
}

export function VOfficeOverlay({
  currentUserId,
  onlineCount,
  currentZone,
  messages,
  remotePlayers,
  onSendMessage,
  selectedBuilding,
  onCloseBuildingDetail,
  onEnterBuilding,
  cameraMode,
  onCameraModeChange,
  isChatFocused,
  onFocusChatChange,
  onOpenWorkspaceModal,
  workspaceName,
  userStatus,
  onStatusChange,
  onExit,
}: VOfficeOverlayProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [menu, setMenu] = useState<"view" | "status" | null>(null);
  const [showExit, setShowExit] = useState(false);

  const weather = useWeather();
  const WeatherIcon = weather ? WEATHER_ICON[weather.kind] : Cloud;
  const statusMeta = getStatusMeta(userStatus);

  // Petunjuk kontrol tampil sebentar saat pertama masuk
  useEffect(() => {
    if (!showHelp) return;
    const t = window.setTimeout(() => setShowHelp(false), 6000);
    return () => window.clearTimeout(t);
  }, [showHelp]);

  // Esc: tutup obrolan dan lepas fokus ketikan
  useEffect(() => {
    if (!chatOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      (document.activeElement as HTMLElement | null)?.blur?.();
      onFocusChatChange(false);
      setChatOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [chatOpen, onFocusChatChange]);

  const menuBox =
    "absolute right-0 top-full z-10 mt-2 w-52 rounded-2xl bg-white p-2 shadow-2xl";

  return (
    <div className="pointer-events-none absolute inset-0 z-30 select-none overflow-hidden font-sans">
      {/* Penutup menu saat klik di luar */}
      {menu && (
        <div
          className="pointer-events-auto absolute inset-0"
          onClick={() => setMenu(null)}
        />
      )}

      {/* ============ KIRI ATAS: tombol chat, server, cuaca, panel chat ============ */}
      <div className="pointer-events-auto absolute left-3 top-3 flex w-[min(340px,calc(100vw-1.5rem))] flex-col gap-2 sm:left-4 sm:top-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen((v) => !v)}
            aria-label="Buka obrolan"
            aria-pressed={chatOpen}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-lg backdrop-blur transition cursor-pointer ${
              chatOpen
                ? "bg-blue-600 text-white"
                : "bg-white/95 text-slate-700 hover:bg-white"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
          </button>

          <div className={`${pillClass} gap-1 p-1`}>
            <button
              onClick={onOpenWorkspaceModal}
              title={workspaceName ? `Server: ${workspaceName}` : "Server"}
              className="group flex h-full items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 pl-2.5 pr-3.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 ring-1 ring-white/20 transition hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <Server className="h-3.5 w-3.5 transition group-hover:scale-110" />
              Server
            </button>
            <span className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {onlineCount} Orang Online
            </span>
          </div>

          {weather && (
            <div className={`${pillClass} gap-1.5 px-3 text-xs font-semibold text-slate-700`}>
              <WeatherIcon className="h-4 w-4 text-blue-600" />
              {weather.temp}°C
            </div>
          )}
        </div>

        <RobloxChatBox
          currentUserId={currentUserId}
          messages={messages}
          remotePlayers={remotePlayers}
          isFocused={isChatFocused}
          onFocusChange={onFocusChatChange}
          onSendMessage={onSendMessage}
          open={chatOpen}
          onOpenChange={setChatOpen}
        />
      </div>

      {/* ============ TENGAH ATAS: lencana lokasi ============ */}
      <div className="pointer-events-none absolute left-1/2 top-3 hidden -translate-x-1/2 md:block sm:top-4">
        <div className="flex items-center gap-2.5 rounded-full bg-white/95 py-1.5 pl-2 pr-5 shadow-lg backdrop-blur">
          <img src="/logo-enuma.png" alt="" className="h-8 w-8" />
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-slate-900">
              <span className="text-blue-600">Jelajahi</span> Enuma
            </p>
            <p className="text-[11px] text-slate-500">
              {zoneLabel(currentZone)}
            </p>
          </div>
        </div>
      </div>

      {/* ============ KANAN ATAS: status, sudut pandang, bantuan, keluar ============ */}
      <div className="pointer-events-auto absolute right-3 top-3 flex items-start gap-2 sm:right-4 sm:top-4">
        {/* Status */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setMenu(menu === "status" ? null : "status")}
            aria-expanded={menu === "status"}
            className={`${pillClass} gap-1.5 px-3 text-xs font-bold text-slate-800 cursor-pointer`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: statusMeta.color }}
            />
            {statusMeta.label}
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>
          {menu === "status" && (
            <div className={menuBox}>
              <p className="px-2 pb-1.5 pt-1 text-xs text-slate-500">Status</p>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onStatusChange(opt.value);
                    setMenu(null);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
                    {opt.label}
                  </span>
                  {opt.value === userStatus && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sudut pandang (mode kamera) */}
        <div className="relative">
          <button
            onClick={() => setMenu(menu === "view" ? null : "view")}
            aria-label="Sudut pandang"
            aria-expanded={menu === "view"}
            className={`flex h-9 w-9 items-center justify-center rounded-full shadow-lg backdrop-blur transition cursor-pointer ${
              menu === "view"
                ? "bg-slate-900 text-white"
                : "bg-white/95 text-slate-700 hover:bg-white"
            }`}
          >
            <Camera className="h-4 w-4" />
          </button>
          {menu === "view" && (
            <div className={menuBox}>
              <p className="px-2 pb-1.5 pt-1 text-xs text-slate-500">
                Sudut Pandang
              </p>
              {CAMERA_OPTIONS.map((opt) => {
                const active = opt.value === cameraMode;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onCameraModeChange(opt.value);
                      setMenu(null);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-bold transition cursor-pointer ${
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                    {active && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bantuan kontrol */}
        <button
          onClick={() => setShowHelp((v) => !v)}
          aria-label="Bantuan kontrol"
          aria-pressed={showHelp}
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-base font-bold shadow-lg backdrop-blur transition cursor-pointer ${
            showHelp
              ? "border-blue-600 bg-white text-blue-600"
              : "border-transparent bg-white/95 text-slate-700 hover:border-blue-600 hover:text-blue-600"
          }`}
        >
          ?
        </button>

        {/* Keluar */}
        <button
          onClick={() => setShowExit(true)}
          className={`${pillClass} gap-1.5 border-2 border-transparent px-4 text-sm font-bold text-slate-800 transition hover:border-blue-600 hover:text-blue-700 cursor-pointer`}
        >
          Keluar
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ============ DETAIL GEDUNG (dari repo, tidak diubah fungsinya) ============ */}
      {selectedBuilding && (
        <div className="pointer-events-auto absolute left-1/2 top-1/2 z-40 flex w-[90vw] max-w-[340px] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-3xl border border-white bg-white/95 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
                {selectedBuilding.category}
              </span>
              <h3 className="mt-1 text-base font-extrabold text-slate-800">
                {selectedBuilding.name}
              </h3>
            </div>
            <button
              onClick={onCloseBuildingDetail}
              aria-label="Tutup"
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs leading-relaxed text-slate-600">
            {selectedBuilding.desc}
          </p>

          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span className="font-medium text-slate-600">
              {selectedBuilding.status}
            </span>
          </div>

          <div className="mt-1 flex gap-2">
            <button
              onClick={() => onEnterBuilding?.()}
              className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 cursor-pointer"
            >
              Masuk Sekarang
            </button>
            <button
              onClick={onCloseBuildingDetail}
              className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ============ BAWAH TENGAH: bantuan kontrol ============ */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 hidden justify-center sm:flex">
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto rounded-2xl bg-white/95 px-5 py-3.5 text-center shadow-xl backdrop-blur"
            >
              <div className="flex items-center justify-center gap-1.5">
                <Key>W</Key>
                <Key>A</Key>
                <Key>S</Key>
                <Key>D</Key>
                <span className="px-1 text-xs text-slate-500">atau</span>
                <Key>↑</Key>
                <Key>←</Key>
                <Key>↓</Key>
                <Key>→</Key>
              </div>
              <p className="mt-2 text-xs text-slate-700">
                <span className="font-semibold text-blue-600">
                  Maju, mundur, dan berbelok.
                </span>{" "}
                Seret mouse untuk menoleh.
              </p>
              <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-slate-700">
                <Key>C</Key> ganti kamera
              </p>
              <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-slate-700">
                <Key>/</Key> buka chat
                <Key>Esc</Key> tutup chat
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showExit && (
        <ExitModal
          onClose={() => setShowExit(false)}
          onConfirm={() => {
            setShowExit(false);
            onExit?.();
          }}
        />
      )}
    </div>
  );
}