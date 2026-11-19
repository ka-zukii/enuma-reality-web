import { useEffect, useRef, useState } from "react";
import { Send, Radio, Globe, Lock } from "lucide-react";
import type { ChatMessage, RemotePlayer } from "../../types";

interface ChatBoxProps {
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

export function ChatBox({
  currentUserId,
  messages,
  remotePlayers,
  isFocused,
  disabledShortcuts = false,
  onFocusChange,
  onSendMessage,
}: ChatBoxProps) {
  const [channel, setChannel] = useState<"PROXIMITY" | "GLOBAL" | "PRIVATE">(
    "PROXIMITY",
  );
  const [privateTargetId, setPrivateTargetId] = useState("");
  const [input, setInput] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Shortcut "/" untuk fokus chat & "Escape" untuk keluar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !isFocused && !disabledShortcuts) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape" && isFocused) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused, disabledShortcuts]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (channel === "PRIVATE" && !privateTargetId) {
      alert("Pilih rekan kerja tujuan untuk Private Chat!");
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
    <div className="absolute bottom-4 left-4 w-80 sm:w-96 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md flex flex-col overflow-hidden shadow-2xl">
      <div className="flex border-b border-slate-800 text-[11px] font-medium">
        <button
          onClick={() => setChannel("PROXIMITY")}
          className={`flex-1 py-2 flex items-center justify-center gap-1 cursor-pointer transition ${
            channel === "PROXIMITY"
              ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Radio className="w-3 h-3" /> Disekitar
        </button>
        <button
          onClick={() => setChannel("GLOBAL")}
          className={`flex-1 py-2 flex items-center justify-center gap-1 cursor-pointer transition ${
            channel === "GLOBAL"
              ? "bg-purple-500/20 text-purple-400 border-b-2 border-purple-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Globe className="w-3 h-3" /> Global
        </button>
        <button
          onClick={() => setChannel("PRIVATE")}
          className={`flex-1 py-2 flex items-center justify-center gap-1 cursor-pointer transition ${
            channel === "PRIVATE"
              ? "bg-amber-500/20 text-amber-400 border-b-2 border-amber-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Lock className="w-3 h-3" /> Private
        </button>
      </div>

      {channel === "PRIVATE" && (
        <div className="px-3 py-1.5 bg-slate-950/60 border-b border-slate-800">
          <select
            value={privateTargetId}
            onChange={(e) => setPrivateTargetId(e.target.value)}
            className="w-full bg-transparent text-xs text-amber-300 outline-none"
          >
            <option value="" className="bg-slate-900">
              -- Pilih Rekan Kerja Online --
            </option>
            {remotePlayers.map((p) => (
              <option key={p.userId} value={p.userId} className="bg-slate-900">
                {p.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="h-44 overflow-y-auto p-3 space-y-1.5 text-xs">
        {messages.length === 0 && (
          <div className="text-slate-500 text-center mt-14">
            Tekan{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">
              /
            </kbd>{" "}
            untuk chat atau{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">
              WASD
            </kbd>{" "}
            untuk jalan
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className="leading-relaxed">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded mr-1.5 font-semibold ${
                m.channel === "PROXIMITY"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : m.channel === "GLOBAL"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-amber-500/20 text-amber-400"
              }`}
            >
              {m.channel === "PROXIMITY"
                ? "Sekitar"
                : m.channel === "GLOBAL"
                  ? "Global"
                  : "Whisper"}
            </span>
            <span className="font-semibold text-slate-200">
              {m.senderId === currentUserId ? "Kamu" : m.senderName}
              {m.channel === "PRIVATE" && m.receiverName
                ? ` → ${m.receiverName}`
                : ""}
              :{" "}
            </span>
            <span className="text-slate-300">{m.content}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex border-t border-slate-800 bg-slate-950/50"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Kirim pesan ${channel.toLowerCase()} (tekan /)...`}
          className="flex-1 px-3 py-2 bg-transparent text-xs text-white outline-none"
        />
        <button
          type="submit"
          className="px-3 text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
