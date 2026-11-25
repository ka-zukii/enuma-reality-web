import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Disc3,
  MessageCircle,
  MessageSquarePlus,
  Search,
  Send,
  Settings,
  Sparkles,
  UserRound,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ChatMessage, RemotePlayer } from "@/types";
import {
  AVATAR_PRESETS,
  normalizeAvatarId,
  setLocalAvatarId,
  useLocalAvatarId,
  type AvatarGender,
  type AvatarId,
} from "@/config/avatars";
export { SpotifyApp } from "@/components/hud/SpotifyApp";

export type PhoneAppId = "settings" | "spotify" | "avatar" | "whatsapp";

export interface PhoneAppMeta {
  id: PhoneAppId;
  name: string;
  icon: LucideIcon;
  bgClass: string;
}

export const PHONE_APPS: PhoneAppMeta[] = [
  {
    id: "settings",
    name: "Pengaturan",
    icon: Settings,
    bgClass: "bg-linear-to-br from-zinc-500 to-zinc-700",
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: Disc3,
    bgClass: "bg-linear-to-br from-emerald-400 to-green-600",
  },
  {
    id: "avatar",
    name: "Ganti Avatar",
    icon: UserRound,
    bgClass: "bg-linear-to-br from-sky-400 to-blue-600",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: MessageCircle,
    bgClass: "bg-linear-to-br from-green-400 to-emerald-600",
  },
];

function AppHeader({
  title,
  onBack,
  dark = true,
}: {
  title: string;
  onBack: () => void;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-2 border-b ${
        dark
          ? "border-white/10 text-white"
          : "border-slate-200 text-slate-900 bg-white/95"
      }`}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Kembali ke beranda ponsel"
        className={`flex h-6 w-6 items-center justify-center rounded-full transition cursor-pointer ${
          dark ? "hover:bg-white/10" : "hover:bg-slate-100"
        }`}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
      </button>
      <span className="text-xs font-bold tracking-tight">{title}</span>
    </div>
  );
}

/* ==================== 1. PENGATURAN ==================== */

function ToggleRow({
  icon: Icon,
  label,
  checked,
  onToggle,
}: {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="flex items-center gap-2 text-[11px] font-medium text-white/90">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`relative h-4.5 w-8 rounded-full transition-colors cursor-pointer ${
          checked ? "bg-emerald-500" : "bg-white/20"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-3.5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsApp({ onBack }: { onBack: () => void }) {
  const [sound, setSound] = useState(true);
  const [notif, setNotif] = useState(true);
  const [ecoMode, setEcoMode] = useState(false);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-950/90">
      <AppHeader title="Pengaturan" onBack={onBack} />
      <div className="flex-1 space-y-3 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden p-3">
        <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
          <ToggleRow
            icon={Volume2}
            label="Efek Suara"
            checked={sound}
            onToggle={() => setSound((v) => !v)}
          />
          <ToggleRow
            icon={Bell}
            label="Notifikasi"
            checked={notif}
            onToggle={() => setNotif((v) => !v)}
          />
          <ToggleRow
            icon={Sparkles}
            label="Mode Hemat Daya"
            checked={ecoMode}
            onToggle={() => setEcoMode((v) => !v)}
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-[10px] text-white/60 space-y-1">
          <div className="flex justify-between">
            <span>Perangkat</span>
            <span className="font-semibold text-white/85">
              iPhone 17 Pro Max
            </span>
          </div>
          <div className="flex justify-between">
            <span>Sistem</span>
            <span className="font-semibold text-white/85">EnumaOS 19</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== 3. GANTI AVATAR (6 PRESET: 3 COWOK, 3 CEWEK) ==================== */

export function AvatarApp({ onBack }: { onBack: () => void }) {
  const localId = useLocalAvatarId();
  const [selected, setSelected] = useState<AvatarId>(localId ?? "male_1");
  const [genderTab, setGenderTab] = useState<AvatarGender>("male");
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Muat avatar yang tersimpan (untuk akun login maupun tamu)
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) return;
      const char = normalizeAvatarId(
        session.user.user_metadata?.character as string | undefined,
      );
      if (char) {
        setSelected(char);
        setGenderTab(char.startsWith("female") ? "female" : "male");
      }
    });
  }, []);

  const list = AVATAR_PRESETS.filter((p) => p.gender === genderTab);

  const handleSave = async () => {
    setStatusMsg(null);
    // Tampilan lokal langsung berubah
    setLocalAvatarId(selected);

    // Tamu (anonim) juga punya session, jadi tetap disimpan ke metadata
    // supaya pemain lain melihat avatar yang sama.
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setStatusMsg("Avatar diterapkan!");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { character: selected },
    });
    if (error) {
      setSaving(false);
      setStatusMsg(error.message);
      return;
    }
    await supabase.auth.refreshSession();
    setSaving(false);
    setStatusMsg("Avatar berhasil disimpan!");
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-950/90">
      <AppHeader title="Ganti Avatar" onBack={onBack} />
      <div className="flex flex-1 flex-col justify-between overflow-hidden p-3 gap-2">
        {/* Tab Cowok / Cewek */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/10 p-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setGenderTab("male")}
            className={`rounded-lg py-1 transition cursor-pointer ${
              genderTab === "male"
                ? "bg-blue-600 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Cowok (3)
          </button>
          <button
            type="button"
            onClick={() => setGenderTab("female")}
            className={`rounded-lg py-1 transition cursor-pointer ${
              genderTab === "female"
                ? "bg-pink-600 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Cewek (3)
          </button>
        </div>

        {/* Daftar 3 preset per kategori */}
        <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden pr-0.5">
          {list.map((opt) => {
            const active = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSelected(opt.id);
                  setLocalAvatarId(opt.id);
                  setStatusMsg(null);
                }}
                className={`flex w-full items-center gap-2.5 rounded-2xl border p-2 text-left transition cursor-pointer ${
                  active
                    ? "border-sky-400 bg-sky-500/15"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${opt.swatchClass} text-white`}
                >
                  <UserRound className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white">{opt.name}</p>
                  <p className="text-[10px] text-white/55">{opt.styleLabel}</p>
                </div>
                {active && <Check className="h-4 w-4 shrink-0 text-sky-400" />}
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          {statusMsg && (
            <p className="text-center text-[10px] text-emerald-300">
              {statusMsg}
            </p>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="w-full rounded-xl bg-blue-600 py-2 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Menyimpan..." : "Simpan Avatar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== 4. WHATSAPP ==================== */

interface WaMessage {
  fromMe: boolean;
  text: string;
  time: string;
}

interface WaContact {
  id: string;
  name: string;
  role: string;
  color: string;
  messages: WaMessage[];
}

const INITIAL_CONTACTS: WaContact[] = [
  {
    id: "tim-enuma",
    name: "Tim Enuma HQ",
    role: "Grup Kantor",
    color: "bg-blue-600",
    messages: [
      {
        fromMe: false,
        text: "Halo! Selamat datang di Enuma City.",
        time: "09:15",
      },
      {
        fromMe: false,
        text: "Standup jam 10.30 di gedung HQ ya.",
        time: "09:16",
      },
    ],
  },
  {
    id: "lunara",
    name: "Barista Lunara",
    role: "Lunara Cafe",
    color: "bg-amber-600",
    messages: [
      {
        fromMe: false,
        text: "Kopi susu gula aren baru ready nih!",
        time: "10:02",
      },
    ],
  },
  {
    id: "warung",
    name: "Warung Madura",
    role: "Buka 24 Jam",
    color: "bg-emerald-600",
    messages: [
      {
        fromMe: false,
        text: "Jajanan & minuman dingin lengkap kak.",
        time: "08:40",
      },
    ],
  },
];

export interface PhoneChatContext {
  currentUserId: string;
  messages: ChatMessage[];
  remotePlayers: RemotePlayer[];
  onSendMessage: (
    channel: "PROXIMITY" | "GLOBAL" | "PRIVATE",
    content: string,
    receiverId?: string,
  ) => void;
  onFocusInputChange?: (focused: boolean) => void;
}

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
