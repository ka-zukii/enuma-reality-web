import { Compass } from "lucide-react";
import { SidePanel } from "@/components/entry/SidePanel";
import { InfoModal } from "@/components/entry/InfoModal";

export type LandingMenuKey = "tentang" | "layanan" | "portofolio";

const MENU_ITEMS: { key: LandingMenuKey; label: string }[] = [
  { key: "tentang", label: "Tentang Kami" },
  { key: "layanan", label: "Layanan / Jasa" },
  { key: "portofolio", label: "Portofolio" },
];

interface LandingOverlayProps {
  activeMenu: LandingMenuKey | null;
  onMenuSelect: (key: LandingMenuKey) => void;
  /** Dipanggil saat modal ditutup atau menu aktif diklik lagi */
  onMenuClose?: () => void;
  /** Tidak dipakai lagi di navbar; dibiarkan agar pemanggil tidak error. */
  activeView?: string;
  /** Tidak dipakai lagi di navbar; dibiarkan agar pemanggil tidak error. */
  onViewSelect?: (view: string) => void;
  onExplore: () => void;
}

export function LandingOverlay({
  activeMenu,
  onMenuSelect,
  onMenuClose,
  onExplore,
}: LandingOverlayProps) {
  const handleMenu = (key: LandingMenuKey) => {
    if (activeMenu === key) onMenuClose?.();
    else onMenuSelect(key);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 select-none p-3 sm:p-8">
      <SidePanel />

      <div className="relative flex items-start justify-between gap-3">
        {/* Logo & tagline */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-[28px] bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur">
          <img src="/logo-enuma.png" alt="Enuma" className="h-11 w-11" />
          <div className="leading-tight">
            <p className="text-lg font-extrabold text-slate-900">
              Enuma <span className="text-blue-600">Technology</span>
            </p>
            <p className="text-xs text-slate-500">Software · IoT · Robotics</p>
          </div>
        </div>

        {/* Navbar */}
        <nav className="pointer-events-auto relative flex items-center gap-1 rounded-[28px] bg-white/95 p-2 shadow-xl backdrop-blur xl:absolute xl:left-1/2 xl:top-0 xl:-translate-x-1/2">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => handleMenu(item.key)}
              aria-pressed={activeMenu === item.key}
              className={`hidden rounded-full px-4 py-2.5 text-sm font-bold transition cursor-pointer md:block ${
                activeMenu === item.key
                  ? "bg-blue-600 text-white"
                  : "text-slate-800 hover:bg-blue-600 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={onExplore}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition cursor-pointer hover:brightness-110"
          >
            <Compass className="h-4 w-4" />
            Jelajahi Sekarang
          </button>
        </nav>
      </div>

      {activeMenu && (
        <InfoModal kind={activeMenu} onClose={() => onMenuClose?.()} />
      )}
    </div>
  );
}