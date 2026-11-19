import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  ArrowRight,
  Plus,
  Copy,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import type { WorkspaceData } from "@/types";

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkspaceId?: string;
  onJoinByCode: (code: string) => Promise<{ ok: boolean; error?: string }>;
  onSwitchWorkspace: (ws: WorkspaceData) => Promise<void>;
}

export function JoinWorkspaceModal({
  isOpen,
  onClose,
  currentWorkspaceId,
  onJoinByCode,
  onSwitchWorkspace,
}: WorkspaceModalProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/workspaces");
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
      }
    } catch (e) {
      console.error("Gagal memuat workspaces:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchWorkspaces();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setJoiningCode(true);
    const res = await onJoinByCode(code.trim());
    setJoiningCode(false);

    if (res.ok) {
      setCode("");
      await fetchWorkspaces();
      onClose();
    } else {
      alert(res.error || "Gagal bergabung dengan kode tersebut");
    }
  };

  const handleCopyCode = (invCode: string) => {
    navigator.clipboard.writeText(invCode);
    setCopiedCode(invCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl p-5 sm:p-6 flex flex-col gap-4 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                Daftar Kantor / Workspace
              </h3>
              <p className="text-[10px] text-slate-400">
                Pilih kantor untuk bergabung atau gunakan kode server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input gabung via kode */}
        <form onSubmit={handleJoinByCode} className="flex gap-2">
          <input
            type="text"
            placeholder="Masukkan kode server..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={joiningCode || !code.trim()}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold text-xs shadow-md transition flex items-center gap-1 shrink-0"
          >
            {joiningCode ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Join</span>
              </>
            )}
          </button>
        </form>

        {/* Daftar server */}
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            Server Kamu ({workspaces.length})
          </span>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Memuat daftar server...</span>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Belum ada server lain.
            </div>
          ) : (
            workspaces.map((ws) => {
              const isCurrent = ws.id === currentWorkspaceId;
              const online = ws.onlineCount ?? 0;
              const capacity = ws.maxCapacity ?? 15;
              const isFull = online >= capacity;

              return (
                <div
                  key={ws.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20"
                      : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {ws.name}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[8px] font-black uppercase">
                          Sedang Aktif
                        </span>
                      )}
                      {ws.isAuto && (
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[8px] font-black uppercase">
                          Otomatis
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span
                        className={`flex items-center gap-1 font-semibold ${
                          isFull ? "text-rose-500" : "text-emerald-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                            isFull ? "bg-rose-500" : "bg-emerald-500"
                          }`}
                        />
                        {online}/{capacity} online
                      </span>

                      <span className="flex items-center gap-1 text-slate-400">
                        <Users className="w-3 h-3" />
                        {ws._count?.members ?? 1} anggota
                      </span>

                      {ws.inviteCode && (
                        <button
                          type="button"
                          onClick={() => handleCopyCode(ws.inviteCode!)}
                          className="flex items-center gap-0.5 text-slate-400 hover:text-slate-700"
                          title="Salin kode server"
                        >
                          {copiedCode === ws.inviteCode ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span className="font-mono text-[9px]">
                            {ws.inviteCode}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {!isCurrent ? (
                    <button
                      type="button"
                      disabled={isFull}
                      onClick={async () => {
                        await onSwitchWorkspace(ws);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow transition flex items-center gap-1 shrink-0"
                    >
                      <span>{isFull ? "Penuh" : "Masuk"}</span>
                      {!isFull && <ArrowRight className="w-3 h-3" />}
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-blue-600 px-2 py-1">
                      Di Sini
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-100">
          Server otomatis diisi maks 10 pemain. Slot 11 sampai 15 hanya bisa
          diakses lewat kode server.
        </div>
      </div>
    </div>
  );
}
