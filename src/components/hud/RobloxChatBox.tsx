import { useEffect, useRef, useState } from "react";
import { Send, Radio, Globe, Lock, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import type { ChatMessage, RemotePlayer } from "@/types";

interface RobloxChatBoxProps {
  currentUserId: string;
  messages: ChatMessage[];
  remotePlayers: RemotePlayer[];
  isFocused: boolean;
  disabledShortcuts?: boolean;
  onFocusChange: (focused: boolean) => void;
  onSendMessage: (
    channel: "PROXIMITY" | "GLOBAL" | "PRIVATE",
    content: string,
    receiverId?: string,
  ) => void;
}

export function RobloxChatBox({
  currentUserId,
  messages,
  remotePlayers,
  isFocused,
  disabledShortcuts = false,
  onFocusChange,
  onSendMessage,
}: RobloxChatBoxProps) {
  const [channel, setChannel] = useState<"PROXIMITY" | "GLOBAL" | "PRIVATE">(
    "PROXIMITY",
  );
  const [privateTargetId, setPrivateTargetId] = useState("");
  const [input, setInput] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Otomatis minimize saat layar ponsel kecil
  useEffect(() => {
    if (window.innerWidth < 640) {
      setIsCollapsed(true);
    }
  }, []);

  // Shortcut "/" untuk fokus chat & "Escape" untuk keluar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !isFocused && !disabledShortcuts) {
        e.preventDefault();
        setIsCollapsed(false);
        inputRef.current?.focus();
      } else if (e.key === "Escape" && isFocused) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused, disabledShortcuts]);

  // Pisahkan pesan per tab (tidak bercampur/numpuk)
  const filteredMessages = messages.filter((m) => {
    if (channel === "PROXIMITY") return m.channel === "PROXIMITY";
    if (channel === "GLOBAL") return m.channel === "GLOBAL";
    if (channel === "PRIVATE") return m.channel === "PRIVATE";
    return true;
  });

  useEffect(() => {
    if (!isCollapsed) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredMessages.length, isCollapsed, channel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (channel === "PRIVATE" && !privateTargetId) {
      alert("Pilih pemain tujuan untuk Private Chat!");
      return;
    }

    onSendMessage(
      channel,
      input,
      channel === "PRIVATE" ? privateTargetId : undefined,
    );
    setInput("");
  };

  return (
    <div className="pointer-events-auto flex flex-col w-[calc(100vw-2rem)] max-w-[320px] sm:max-w-[360px] md:max-w-[380px] rounded-2xl bg-white/95 backdrop-blur-md border border-white/70 text-slate-800 shadow-xl shadow-black/5 transition-all duration-200 select-none font-sans overflow-hidden">
      {/* Top Header / Channel Tabs */}
      <div className="flex items-center justify-between px-2 sm:px-2.5 py-1.5 bg-slate-50/80 border-b border-slate-100 text-xs">
        {/* Channel Selector Tabs Terpisah */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setChannel("PROXIMITY");
              setIsCollapsed(false);
            }}
            className={`px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition ${
              channel === "PROXIMITY"
                ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Sekitar</span>
          </button>

          <button
            onClick={() => {
              setChannel("GLOBAL");
              setIsCollapsed(false);
            }}
            className={`px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition ${
              channel === "GLOBAL"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Global</span>
          </button>

          <button
            onClick={() => {
              setChannel("PRIVATE");
              setIsCollapsed(false);
            }}
            className={`px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition ${
              channel === "PRIVATE"
                ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Private</span>
          </button>
        </div>

        {/* Toggle Collapse Box */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition"
          title={isCollapsed ? "Buka Chat" : "Kecilkan Chat"}
        >
          {isCollapsed ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Target selector bila tab PRIVATE */}
      {!isCollapsed && channel === "PRIVATE" && (
        <div className="px-3 py-1.5 bg-amber-50/70 border-b border-amber-100 flex items-center gap-1.5 text-xs">
          <span className="text-[10px] font-extrabold text-amber-700 uppercase shrink-0">
            Kirim ke:
          </span>
          <select
            value={privateTargetId}
            onChange={(e) => setPrivateTargetId(e.target.value)}
            className="flex-1 bg-white border border-amber-300 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-amber-400"
          >
            <option value="" className="text-slate-400">
              -- Pilih Pemain Online ({remotePlayers.length}) --
            </option>
            {remotePlayers.map((p) => (
              <option key={p.userId} value={p.userId} className="text-slate-800">
                {p.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Chat Messages Log Khusus Tab yang Aktif */}
      {!isCollapsed && (
        <div className="h-32 sm:h-44 md:h-52 overflow-y-auto p-2.5 space-y-1.5 text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-200">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center gap-1">
              <MessageSquare className="w-4 h-4 text-slate-300" />
              <span className="text-[11px] font-medium text-slate-500">
                Belum ada pesan di tab {channel === "PROXIMITY" ? "Sekitar" : channel === "GLOBAL" ? "Global" : "Private"}.
              </span>
              <span className="text-[10px] text-slate-400">
                Tekan <kbd className="px-1 py-px rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono">/</kbd> untuk chat
              </span>
            </div>
          ) : (
            filteredMessages.map((m) => {
              const isMe = m.senderId === currentUserId;
              return (
                <div key={m.id} className="break-words">
                  <span
                    className={`inline-block px-1.5 py-px mr-1 rounded text-[8px] sm:text-[9px] font-extrabold uppercase ${
                      m.channel === "PROXIMITY"
                        ? "bg-cyan-100 text-cyan-800"
                        : m.channel === "GLOBAL"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {m.channel === "PROXIMITY"
                      ? "Sekitar"
                      : m.channel === "GLOBAL"
                        ? "Global"
                        : "Private"}
                  </span>

                  <span
                    className={`font-bold mr-1 ${
                      isMe ? "text-blue-600" : "text-slate-900"
                    }`}
                  >
                    [{isMe ? "Kamu" : m.senderName}
                    {m.channel === "PRIVATE" && m.receiverName
                      ? ` → ${m.receiverName}`
                      : ""}
                    ]:
                  </span>

                  <span className="text-slate-700">{m.content}</span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Form Input Chat */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1.5 p-1.5 bg-slate-50/90 border-t border-slate-100"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onFocus={() => {
            setIsCollapsed(false);
            onFocusChange(true);
          }}
          onBlur={() => onFocusChange(false)}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`[${channel}] Tulis pesan (tekan /)...`}
          className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 focus:border-blue-500 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition shadow-inner"
        />
        <button
          type="submit"
          className="p-1.5 sm:p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition active:scale-95 shrink-0"
        >
          <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </form>
    </div>
  );
}
