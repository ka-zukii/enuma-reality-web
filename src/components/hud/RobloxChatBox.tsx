import { useEffect, useRef, useState } from "react";
import {
  Globe,
  Lock,
  MessageSquare,
  Radio,
  Send,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ChatMessage, RemotePlayer } from "@/types";

type Channel = "PROXIMITY" | "GLOBAL" | "PRIVATE";

const CHANNELS: { value: Channel; label: string; Icon: LucideIcon }[] = [
  { value: "PROXIMITY", label: "Sekitar", Icon: Radio },
  { value: "GLOBAL", label: "Global", Icon: Globe },
  { value: "PRIVATE", label: "Private", Icon: Lock },
];

interface RobloxChatBoxProps {
  currentUserId: string;
  messages: ChatMessage[];
  remotePlayers: RemotePlayer[];
  isFocused: boolean;
  disabledShortcuts?: boolean;
  onFocusChange: (focused: boolean) => void;
  onSendMessage: (
    channel: Channel,
    content: string,
    receiverId?: string,
  ) => void;
  /** Panel terbuka atau hanya pratinjau pesan terakhir */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RobloxChatBox({
  currentUserId,
  messages,
  remotePlayers,
  isFocused,
  disabledShortcuts = false,
  onFocusChange,
  onSendMessage,
  open,
  onOpenChange,
}: RobloxChatBoxProps) {
  const [channel, setChannel] = useState<Channel>("PROXIMITY");
  const [privateTargetId, setPrivateTargetId] = useState("");
  const [input, setInput] = useState("");
  const [warn, setWarn] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Tekan "/" untuk membuka dan fokus chat, "Esc" untuk berhenti mengetik
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !isFocused && !disabledShortcuts) {
        e.preventDefault();
        onOpenChange(true);
        window.setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === "Escape" && isFocused) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFocused, disabledShortcuts, onOpenChange]);

  const filtered = messages.filter((m) => m.channel === channel);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filtered.length, open, channel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (channel === "PRIVATE" && !privateTargetId) {
      setWarn(true);
      return;
    }
    setWarn(false);
    onSendMessage(
      channel,
      input,
      channel === "PRIVATE" ? privateTargetId : undefined,
    );
    setInput("");
  };

  // Panel tertutup: tampilkan 3 pesan terakhir sebagai pratinjau
  if (!open) {
    const recent = messages.slice(-3);
    if (recent.length === 0) return null;
    return (
      <div className="pointer-events-auto w-full rounded-xl bg-slate-900/45 px-3 py-2 text-xs leading-relaxed text-white backdrop-blur-sm">
        {recent.map((m) => (
          <p key={m.id} className="truncate">
            <span className="font-bold text-sky-300">
              {m.senderId === currentUserId ? "Kamu" : m.senderName}:
            </span>{" "}
            {m.content}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="pointer-events-auto flex min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-white/95 text-slate-800 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between px-3 pt-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <MessageSquare className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-bold">Obrolan</h3>
        </div>
        <button
          onClick={() => {
            inputRef.current?.blur();
            onOpenChange(false);
          }}
          aria-label="Tutup obrolan"
          className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tab: Sekitar / Global / Private */}
      <div className="mt-2 flex gap-1 px-3">
        {CHANNELS.map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => setChannel(value)}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
              channel === value
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {channel === "PRIVATE" && (
        <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
          <span className="shrink-0 text-[11px] font-bold text-slate-500">
            Kirim ke
          </span>
          <select
            value={privateTargetId}
            onChange={(e) => {
              setPrivateTargetId(e.target.value);
              setWarn(false);
            }}
            className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-blue-500"
          >
            <option value="">Pilih pemain ({remotePlayers.length})</option>
            {remotePlayers.map((p) => (
              <option key={p.userId} value={p.userId}>
                {p.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tinggi pesan mengikuti layar, sehingga tidak menutupi terlalu banyak tampilan di HP */}
      <div className="mt-2 h-[min(10rem,28dvh)] space-y-1 overflow-y-auto px-3 text-xs leading-relaxed">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-slate-400">
            <span>Belum ada pesan.</span>
            <span className="text-[11px]">
              Tekan{" "}
              <kbd className="rounded border border-slate-200 bg-slate-100 px-1 font-mono text-slate-600">
                /
              </kbd>{" "}
              untuk chat
            </span>
          </div>
        ) : (
          filtered.map((m) => {
            const isMe = m.senderId === currentUserId;
            return (
              <p key={m.id} className="wrap-break-word">
                <span
                  className={`font-bold ${
                    isMe ? "text-emerald-600" : "text-blue-600"
                  }`}
                >
                  {isMe ? "Kamu" : m.senderName}
                  {m.channel === "PRIVATE" && m.receiverName
                    ? ` → ${m.receiverName}`
                    : ""}
                  :
                </span>{" "}
                <span className="text-slate-700">{m.content}</span>
              </p>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {warn && (
        <p className="px-3 pt-1 text-[11px] text-rose-500">
          Pilih pemain tujuan dulu untuk chat private.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
        <input
          ref={inputRef}
          value={input}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Klik di sini atau tekan / untuk chat"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none placeholder:text-slate-400 focus:border-blue-500"
        />
        <button
          type="submit"
          aria-label="Kirim"
          className="shrink-0 rounded-xl bg-blue-600 p-2 text-white transition hover:bg-blue-700 active:scale-95 cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
