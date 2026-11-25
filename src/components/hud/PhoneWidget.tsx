import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Smartphone, Wifi, X } from "lucide-react";
import {
  AvatarApp,
  PHONE_APPS,
  SettingsApp,
  SpotifyApp,
  WhatsAppApp,
  type PhoneAppId,
  type PhoneChatContext,
} from "@/components/hud/PhoneApps";

interface PhoneButtonProps {
  open: boolean;
  onToggle: () => void;
}

export function PhoneButton({ open, onToggle }: PhoneButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      aria-pressed={open}
      title="Ponsel"
      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg backdrop-blur transition-colors cursor-pointer ${
        open
          ? "bg-blue-600 text-white"
          : "bg-white/95 text-slate-700 hover:bg-white"
      }`}
    >
      <Smartphone className="h-4 w-4" />
    </motion.button>
  );
}

interface PhonePopupProps {
  open: boolean;
  onClose: () => void;
  /** Posisi tambahan (default: bottom-4 right-16 sm:bottom-6 sm:right-20) */
  positionClassName?: string;
  chat?: PhoneChatContext;
}

export function PhonePopup({
  open,
  onClose,
  positionClassName = "bottom-4 right-16 sm:bottom-6 sm:right-20",
  chat,
}: PhonePopupProps) {
  const [activeApp, setActiveApp] = useState<PhoneAppId | null>(null);

  const timeLabel = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.72, y: 28 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.72, y: 24 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 28,
            mass: 0.85,
          }}
          className={`pointer-events-auto absolute z-40 h-[min(480px,74vh)] w-[min(244px,72vw)] origin-bottom-right ${positionClassName}`}
        >
          {/* Tombol fisik sisi kiri (Action & Volume) */}
          <span className="absolute -left-[2.5px] top-20 h-5 w-[3px] rounded-l-sm bg-zinc-600" />
          <span className="absolute -left-[2.5px] top-28 h-9 w-[3px] rounded-l-sm bg-zinc-600" />
          <span className="absolute -left-[2.5px] top-39 h-9 w-[3px] rounded-l-sm bg-zinc-600" />
          {/* Tombol fisik sisi kanan (Power) */}
          <span className="absolute -right-[2.5px] top-32 h-12 w-[3px] rounded-r-sm bg-zinc-600" />

          {/* Rangka titanium luar */}
          <div className="h-full w-full rounded-[40px] bg-linear-to-b from-zinc-600 via-zinc-800 to-zinc-700 p-[2.5px] shadow-[0_24px_60px_rgba(15,23,42,0.45)]">
            {/* Bezel hitam tipis */}
            <div className="h-full w-full rounded-[37.5px] bg-black p-[5px]">
              {/* Layar */}
              <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32.5px] bg-linear-to-b from-slate-900 via-slate-950 to-indigo-950 text-white">
                {/* Status bar & Dynamic Island */}
                <div className="relative z-10 flex items-center justify-between px-4 pt-2.5 text-[10px] font-semibold tracking-tight text-white/95">
                  <span className="w-10">{timeLabel}</span>

                  {/* Dynamic Island */}
                  <div className="flex h-[18px] w-[72px] items-center justify-end rounded-full bg-black px-2 shadow-inner ring-1 ring-white/10">
                    <span className="h-2 w-2 rounded-full bg-slate-900 ring-1 ring-indigo-900/70" />
                  </div>

                  {/* Sinyal, Wi-Fi, Baterai */}
                  <div className="flex w-10 items-center justify-end gap-1">
                    <span className="flex items-end gap-[1.5px]">
                      <span className="h-1 w-[2px] rounded-full bg-white" />
                      <span className="h-1.5 w-[2px] rounded-full bg-white" />
                      <span className="h-2 w-[2px] rounded-full bg-white" />
                      <span className="h-2.5 w-[2px] rounded-full bg-white/40" />
                    </span>
                    <Wifi className="h-2.5 w-2.5" />
                    <span className="flex items-center">
                      <span className="flex h-2.5 w-4 items-center rounded-[3px] border border-white/70 p-[1px]">
                        <span className="h-full w-full rounded-[1px] bg-emerald-400" />
                      </span>
                      <span className="h-1 w-[1.5px] rounded-r-full bg-white/70" />
                    </span>
                  </div>
                </div>

                {/* Header aplikasi / tombol tutup */}
                {!activeApp && (
                  <div className="flex items-center justify-between px-4 pt-3">
                    <span className="text-[11px] font-bold tracking-wide text-white/80">
                      Enuma Phone
                    </span>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Tutup ponsel"
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Konten layar: Beranda atau Aplikasi aktif */}
                <div className="flex flex-1 flex-col overflow-hidden">
                  {activeApp === null && (
                    <div className="flex flex-1 flex-col justify-between px-4 py-4">
                      <div className="grid grid-cols-3 gap-x-2 gap-y-4">
                        {PHONE_APPS.map((app) => {
                          const Icon = app.icon;
                          return (
                            <button
                              key={app.id}
                              type="button"
                              onClick={() => setActiveApp(app.id)}
                              className="group flex flex-col items-center gap-1.5 cursor-pointer"
                            >
                              <span
                                className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${app.bgClass} text-white shadow-md transition-transform group-hover:scale-105 group-active:scale-95`}
                              >
                                <Icon className="h-6 w-6" />
                              </span>
                              <span className="w-full truncate text-center text-[10px] font-medium text-white/90">
                                {app.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Dock bawah */}
                      <div className="flex items-center justify-around rounded-2xl border border-white/10 bg-white/10 px-2 py-2 backdrop-blur-md">
                        {PHONE_APPS.map((app) => {
                          const Icon = app.icon;
                          return (
                            <button
                              key={`dock-${app.id}`}
                              type="button"
                              onClick={() => setActiveApp(app.id)}
                              title={app.name}
                              aria-label={app.name}
                              className={`flex h-9 w-9 items-center justify-center rounded-xl ${app.bgClass} text-white shadow transition-transform hover:scale-105 active:scale-95 cursor-pointer`}
                            >
                              <Icon className="h-4.5 w-4.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeApp === "settings" && (
                    <SettingsApp onBack={() => setActiveApp(null)} />
                  )}
                  {activeApp === "spotify" && (
                    <SpotifyApp onBack={() => setActiveApp(null)} />
                  )}
                  {activeApp === "avatar" && (
                    <AvatarApp onBack={() => setActiveApp(null)} />
                  )}
                  {activeApp === "whatsapp" && (
                    <WhatsAppApp onBack={() => setActiveApp(null)} chat={chat} />
                  )}
                </div>

                {/* Home Indicator (ketuk untuk kembali ke beranda) */}
                <div className="flex justify-center pb-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveApp(null)}
                    aria-label="Kembali ke beranda ponsel"
                    className="h-1 w-24 rounded-full bg-white/75 transition hover:bg-white cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
