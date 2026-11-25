import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  Search,
  Send,
} from "lucide-react";
import { AppHeader } from "@/components/hud/phone/ui";
import { INITIAL_CONTACTS } from "@/components/hud/phone/whatsapp/data";
import type {
  PhoneChatContext,
  WaContact,
} from "@/components/hud/phone/whatsapp/data";

export function WhatsAppApp({
  onBack,
  chat,
}: {
  onBack: () => void;
  chat?: PhoneChatContext;
}) {
  const [npcContacts, setNpcContacts] = useState<WaContact[]>(INITIAL_CONTACTS);
  const [activeTarget, setActiveTarget] = useState<{
    kind: "player" | "npc";
    id: string;
  } | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [playerQuery, setPlayerQuery] = useState("");
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const privateMsgs = (chat?.messages ?? []).filter(
    (m) => m.channel === "PRIVATE",
  );

  const playerThread =
    activeTarget?.kind === "player" && chat
      ? privateMsgs.filter(
          (m) =>
            (m.senderId === chat.currentUserId &&
              m.receiverId === activeTarget.id) ||
            (m.senderId === activeTarget.id &&
              m.receiverId === chat.currentUserId),
        )
      : [];

  const activePlayer =
    activeTarget?.kind === "player"
      ? (chat?.remotePlayers.find((p) => p.userId === activeTarget.id) ?? null)
      : null;

  const activeNpc =
    activeTarget?.kind === "npc"
      ? (npcContacts.find((c) => c.id === activeTarget.id) ?? null)
      : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [playerThread.length, activeNpc?.messages.length, activeTarget?.id]);

  const sendReply = () => {
    const text = draft.trim();
    if (!text || !activeTarget) return;

    if (activeTarget.kind === "player" && chat) {
      chat.onSendMessage("PRIVATE", text, activeTarget.id);
      setDraft("");
      return;
    }

    if (activeTarget.kind === "npc" && activeNpc) {
      const now = new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date());

      setNpcContacts((prev) =>
        prev.map((c) =>
          c.id === activeNpc.id
            ? {
                ...c,
                messages: [...c.messages, { fromMe: true, text, time: now }],
              }
            : c,
        ),
      );
      setDraft("");
    }
  };

  if (!activeTarget && showNewChat) {
    const players = (chat?.remotePlayers ?? []).filter((p) =>
      p.fullName.toLowerCase().includes(playerQuery.trim().toLowerCase()),
    );
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-950/95">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2 text-white">
          <button
            type="button"
            onClick={() => {
              setShowNewChat(false);
              setPlayerQuery("");
            }}
            aria-label="Tutup daftar pemain"
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="leading-tight">
            <p className="text-xs font-bold">Percakapan Baru</p>
            <p className="text-[9px] text-emerald-400">
              {(chat?.remotePlayers ?? []).length} pemain online
            </p>
          </div>
        </div>

        <div className="p-2.5">
          <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-white/45" />
            <input
              value={playerQuery}
              onChange={(e) => setPlayerQuery(e.target.value)}
              onFocus={() => chat?.onFocusInputChange?.(true)}
              onBlur={() => chat?.onFocusInputChange?.(false)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Cari nama pemain..."
              className="min-w-0 flex-1 bg-transparent text-[11px] text-white placeholder:text-white/40 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 divide-y divide-white/10 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
          {players.length === 0 ? (
            <p className="px-4 py-8 text-center text-[10px] text-white/45">
              {(chat?.remotePlayers ?? []).length === 0
                ? "Belum ada pemain lain yang online."
                : "Pemain tidak ditemukan."}
            </p>
          ) : (
            players.map((p) => (
              <button
                key={p.userId}
                type="button"
                onClick={() => {
                  setShowNewChat(false);
                  setPlayerQuery("");
                  setActiveTarget({ kind: "player", id: p.userId });
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-white/5 cursor-pointer"
              >
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                  {p.fullName.slice(0, 2).toUpperCase()}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">
                    {p.fullName}
                  </p>
                  <p className="truncate text-[10px] text-emerald-300/75">
                    Online · Ketuk untuk chat
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  if (!activeTarget) {
    const playersWithHistory = (chat?.remotePlayers ?? []).filter((p) =>
      privateMsgs.some(
        (m) =>
          (m.senderId === chat?.currentUserId && m.receiverId === p.userId) ||
          (m.senderId === p.userId && m.receiverId === chat?.currentUserId),
      ),
    );
    return (
      <div className="relative flex flex-1 flex-col overflow-hidden bg-slate-950/95">
        <AppHeader title="WhatsApp" onBack={onBack} />
        <div className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden pb-14">
          {chat && playersWithHistory.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400/80">
                Obrolan Pribadi
              </p>
              <div className="divide-y divide-white/10">
                {playersWithHistory.map((p) => {
                  const thread = privateMsgs.filter(
                    (m) =>
                      (m.senderId === chat.currentUserId &&
                        m.receiverId === p.userId) ||
                      (m.senderId === p.userId &&
                        m.receiverId === chat.currentUserId),
                  );
                  const last = thread[thread.length - 1];
                  return (
                    <button
                      key={p.userId}
                      type="button"
                      onClick={() =>
                        setActiveTarget({ kind: "player", id: p.userId })
                      }
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-white/5 cursor-pointer"
                    >
                      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                        {p.fullName.slice(0, 2).toUpperCase()}
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-white">
                          {p.fullName}
                        </span>
                        <p className="truncate text-[10px] text-white/55">
                          {last?.content}
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/30" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="px-3 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-wider text-white/45">
            Kontak Kota
          </p>
          <div className="divide-y divide-white/10">
            {npcContacts.map((c) => {
              const last = c.messages[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveTarget({ kind: "npc", id: c.id })}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-white/5 cursor-pointer"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${c.color} text-[11px] font-bold text-white`}
                  >
                    {c.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs font-bold text-white">
                        {c.name}
                      </span>
                      <span className="shrink-0 text-[9px] text-white/45">
                        {last?.time}
                      </span>
                    </div>
                    <p className="truncate text-[10px] text-white/60">
                      {last?.text}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/30" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Tombol mengambang percakapan baru ala WhatsApp */}
        <button
          type="button"
          onClick={() => setShowNewChat(true)}
          title="Percakapan baru"
          aria-label="Buat percakapan baru"
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 transition hover:bg-emerald-400 active:scale-95 cursor-pointer"
        >
          <MessageSquarePlus className="h-4.5 w-4.5" />
        </button>
      </div>
    );
  }

  const headerName =
    activePlayer?.fullName ?? activeNpc?.name ?? "Private Chat";
  const headerSub = activePlayer
    ? "Online · Private Chat"
    : (activeNpc?.role ?? "");
  const headerColor = activePlayer
    ? "bg-emerald-600"
    : (activeNpc?.color ?? "bg-slate-600");

  const bubbles: { fromMe: boolean; text: string; time?: string }[] =
    activeTarget.kind === "player" && chat
      ? playerThread.map((m) => ({
          fromMe: m.senderId === chat.currentUserId,
          text: m.content,
          time: m.createdAt
            ? new Intl.DateTimeFormat("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }).format(new Date(m.createdAt))
            : undefined,
        }))
      : (activeNpc?.messages ?? []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-950">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-emerald-950/60 px-2.5 py-2">
        <button
          type="button"
          onClick={() => setActiveTarget(null)}
          aria-label="Kembali ke daftar chat"
          className="flex h-6 w-6 items-center justify-center rounded-full text-white/80 hover:bg-white/10 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${headerColor} text-[9px] font-bold text-white`}
        >
          {headerName.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[11px] font-bold text-white">
            {headerName}
          </p>
          <p className="truncate text-[9px] text-emerald-300/80">{headerSub}</p>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden p-2.5">
        {bubbles.length === 0 ? (
          <p className="py-8 text-center text-[10px] text-white/45">
            Belum ada pesan pribadi. Sapa sekarang!
          </p>
        ) : (
          bubbles.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-2.5 py-1.5 text-[11px] leading-snug ${
                  m.fromMe
                    ? "rounded-br-sm bg-emerald-600 text-white"
                    : "rounded-bl-sm bg-white/10 text-white/90"
                }`}
              >
                <p>{m.text}</p>
                {m.time && (
                  <p className="mt-0.5 text-right text-[8px] opacity-60">
                    {m.time}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendReply();
        }}
        className="flex items-center gap-1.5 border-t border-white/10 bg-slate-900/80 p-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => chat?.onFocusInputChange?.(true)}
          onBlur={() => chat?.onFocusInputChange?.(false)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Ketik pesan..."
          className="min-w-0 flex-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          aria-label="Kirim pesan"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-400 cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
