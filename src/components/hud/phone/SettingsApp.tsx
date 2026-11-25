import { useState } from "react";
import { Bell, Sparkles, Volume2 } from "lucide-react";
import { AppHeader, ToggleRow } from "@/components/hud/phone/ui";

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
