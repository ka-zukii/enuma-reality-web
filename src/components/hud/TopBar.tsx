import { Users, LogOut, Wifi, WifiOff, UserPlus } from "lucide-react";

interface TopBarProps {
  isConnected: boolean;
  workspaceName: string;
  inviteCode?: string;
  currentZone: string;
  onlineCount: number;
  onOpenJoinModal: () => void;
  onSignOut: () => void;
}

export function TopBar({
  isConnected,
  workspaceName,
  inviteCode,
  currentZone,
  onlineCount,
  onOpenJoinModal,
  onSignOut,
}: TopBarProps) {
  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md pointer-events-auto">
        {isConnected ? (
          <Wifi className="w-4 h-4 text-emerald-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-rose-500 animate-pulse" />
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {workspaceName || "Menghubungkan..."}
            </span>
            {inviteCode && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteCode);
                  alert(`Invite code disalin: ${inviteCode}`);
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 cursor-pointer"
                title="Klik untuk menyalin kode undangan"
              >
                Code: {inviteCode}
              </button>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            Zona:{" "}
            <span className="text-cyan-400 font-medium">
              {currentZone === "meeting-room-1"
                ? "Meeting Room A (Privat)"
                : "Open Space"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onOpenJoinModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-xs text-cyan-300 transition cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Gabung Kantor</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>{onlineCount} Online</span>
        </div>

        <button
          onClick={onSignOut}
          className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition cursor-pointer"
          title="Keluar"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
