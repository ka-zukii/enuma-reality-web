import { useState } from "react";
import {
  Sun,
  SlidersHorizontal,
  Eye,
  Maximize2,
  Minimize2,
  Gamepad2,
  Compass,
  Video,
  Sparkles,
  Layers,
  X,
  CheckCircle2,
  Building,
} from "lucide-react";
import { RobloxChatBox } from "@/components/hud/RobloxChatBox";
import {
  type ChatMessage,
  type PlayerStatus,
  type RemotePlayer,
} from "@/types";
import { STATUS_OPTIONS } from "@/config/status";
import type { BuildingInfo } from "@/config/buildings";

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
  cameraMode: "iso" | "follow";
  onToggleCameraMode: () => void;
  isChatFocused: boolean;
  onFocusChatChange: (focused: boolean) => void;
  onOpenWorkspaceModal: () => void;
  workspaceName?: string;
  userStatus: PlayerStatus;
  onStatusChange: (status: PlayerStatus) => void;
}

export function VOfficeOverlay({
  currentUserId,
  onlineCount,
  messages,
  remotePlayers,
  onSendMessage,
  selectedBuilding,
  onCloseBuildingDetail,
  onEnterBuilding,
  cameraMode,
  onToggleCameraMode,
  isChatFocused,
  onFocusChatChange,
  onOpenWorkspaceModal,
  workspaceName,
  userStatus,
  onStatusChange,
}: VOfficeOverlayProps) {
  const [activeTab, setActiveTab] = useState("jelajahi");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-2 sm:p-4 overflow-hidden select-none font-sans">
      {/* ========================================================
          BAGIAN ATAS (KIRI: ROBLOX CHAT SAJA | KANAN: ENUMA REALITY, SERVER, STATUS & RUANGAN)
          ======================================================== */}
      <div className="flex justify-between items-start w-full gap-2 sm:gap-4">
        {/* TOP LEFT: Roblox Chat Saja */}
        <div className="pointer-events-auto flex flex-col gap-2 max-w-[380px]">
          <RobloxChatBox
            currentUserId={currentUserId}
            messages={messages}
            remotePlayers={remotePlayers}
            isFocused={isChatFocused}
            onFocusChange={onFocusChatChange}
            onSendMessage={onSendMessage}
          />
        </div>

        {/* TOP RIGHT: Enuma Reality, Server, Status Player & Ruangan dikelompokkan di sisi kanan */}
        <div className="pointer-events-auto flex flex-col items-end gap-2 max-w-sm">
          {/* Action Toolbar & Tombol Server */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg shadow-black/5 border border-white/60">
            {/* Tombol Server / Ganti Kantor */}
            <button
              onClick={onOpenWorkspaceModal}
              title="Daftar Server & Join Workspace"
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] sm:text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Building className="w-3.5 h-3.5" />
              <span>Server {workspaceName ? `(${workspaceName})` : ""}</span>
            </button>

            <button className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] sm:text-xs shadow-md shadow-amber-500/20 flex items-center gap-1 transition">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Layanan</span>
            </button>
            <button
              title="Kategori"
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition hidden sm:inline-block"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              title="Visibility Objek"
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition hidden sm:inline-block"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleFullscreen}
              title="Fullscreen"
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Baris Brand Enuma Reality & Jumlah Player di Kantor */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Brand Logo & Name Box */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-2xl bg-white/95 backdrop-blur-md shadow-md shadow-black/5 border border-white/60">
              <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow font-black text-xs">
                E
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-[11px] tracking-tight text-slate-800 leading-none">
                  Enuma Reality
                </span>
                <span className="text-[8px] text-slate-400 font-medium hidden sm:inline">
                  Virtual Office
                </span>
              </div>
            </div>

            {/* Jumlah Orang Online di Kantor */}
            <div className="px-2.5 py-1 rounded-2xl bg-white/95 backdrop-blur-md shadow-sm border border-white/60 flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-blue-600 font-extrabold">
                {onlineCount}
              </span>
              <span className="text-slate-600 font-semibold">di kantor</span>
            </div>

            {/* Cuaca Mini Card */}
            <div className="px-2.5 py-1 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-sm hidden sm:flex items-center gap-1 text-xs">
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-bold text-slate-800 text-[10px]">32°C</span>
            </div>
          </div>

          {/* Status presence: dibagikan ke semua pemain */}
          <div className="hidden sm:flex flex-wrap gap-1 p-1 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-sm justify-end max-w-xs">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = userStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onStatusChange(opt.value)}
                  title={`Status: ${opt.label}`}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================
          BAGIAN DETAIL BANGUNAN (MODAL POPUP)
          ======================================================== */}
      {selectedBuilding && (
        <div className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[340px] rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white p-4 sm:p-5 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150 z-50">
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                {selectedBuilding.category}
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800 mt-1">
                {selectedBuilding.name}
              </h3>
            </div>
            <button
              onClick={onCloseBuildingDetail}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            {selectedBuilding.desc}
          </p>

          <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-slate-600 font-medium">
              {selectedBuilding.status}
            </span>
          </div>

          <div className="flex gap-2 mt-1">
            <button
              onClick={() => onEnterBuilding?.()}
              className="flex-1 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:from-blue-500 hover:to-indigo-500 transition"
            >
              Masuk Sekarang
            </button>
            <button
              onClick={onCloseBuildingDetail}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          BAGIAN BAWAH (MAIN NAVIGATION SAJA)
          ======================================================== */}
      <div className="flex justify-center items-center w-full relative pb-1">
        {/* BOTTOM CENTER: Main Navigation Bar */}
        <div className="pointer-events-auto max-w-[calc(100vw-1rem)] overflow-x-auto flex items-center gap-1 p-1 sm:p-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-2xl shadow-black/10 border border-white/70 scrollbar-none">
          <button
            onClick={() => setActiveTab("jelajahi")}
            className={`flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "jelajahi"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Jelajahi</span>
          </button>

          <button
            onClick={() => setActiveTab("meetup")}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "meetup"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Meetup</span>
            <span className="px-1 py-px rounded-full bg-blue-500 text-white text-[8px] font-black uppercase hidden sm:inline">
              Beta
            </span>
          </button>

          <button
            onClick={() => setActiveTab("games")}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "games"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Games</span>
          </button>

          <button
            onClick={() => setActiveTab("promosi")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "promosi"
                ? "bg-slate-900 text-white shadow"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            Promosi
          </button>

          <button
            onClick={onToggleCameraMode}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition whitespace-nowrap"
            title="Ganti Sudut Pandang"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{cameraMode === "iso" ? "Isometrik" : "Ikuti"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
