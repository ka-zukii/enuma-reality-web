import { Compass, Eye, EyeOff, Maximize, Tag } from "lucide-react";
import type { TimeMode } from "@/components/WorldLighting";
import type { WeatherOverride } from "@/components/RainEffect";
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
  timeMode?: TimeMode;
  onTimeModeChange?: (mode: TimeMode) => void;
  weatherOverride?: WeatherOverride;
  onWeatherOverrideChange?: (o: WeatherOverride) => void;
  labelsVisible?: boolean;
  onToggleLabels?: () => void;
  hudVisible?: boolean;
  onToggleHud?: () => void;
}

export function LandingOverlay({
  activeMenu,
  onMenuSelect,
  onMenuClose,
  onExplore,
  timeMode = "live",
  onTimeModeChange,
  weatherOverride = null,
  onWeatherOverrideChange,
  labelsVisible = true,
  onToggleLabels,
  hudVisible = true,
  onToggleHud,
}: LandingOverlayProps) {
  const handleMenu = (key: LandingMenuKey) => {
    if (activeMenu === key) onMenuClose?.();
    else onMenuSelect(key);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 select-none p-2.5 sm:p-6 lg:p-8">
      {hudVisible && (
        <SidePanel
          timeMode={timeMode}
          onTimeModeChange={onTimeModeChange}
          weatherOverride={weatherOverride}
          onWeatherOverrideChange={onWeatherOverrideChange}
        />
      )}

      {/* Di HP: logo di atas, navbar di bawahnya. Di layar lebar: sejajar. */}
      {hudVisible && (
      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        {/* Logo & tagline */}
        <div className="pointer-events-auto flex w-fit max-w-full items-center gap-2.5 rounded-[28px] bg-white/95 px-3 py-2 shadow-xl backdrop-blur sm:gap-3 sm:px-4 sm:py-2.5">
          <img
            src="/logo-enuma.png"
            alt="Enuma"
            className="h-9 w-9 sm:h-11 sm:w-11"
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-base font-extrabold text-slate-900 sm:text-lg">
              Enuma <span className="text-blue-600">Technology</span>
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">
              Software · IoT · Robotics
            </p>
          </div>
        </div>

        {/* Navbar: di HP bisa digeser ke samping jika tidak muat */}
        <nav className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-[28px] bg-white/95 p-1.5 shadow-xl backdrop-blur sm:p-2 xl:absolute xl:left-1/2 xl:top-0 xl:-translate-x-1/2 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => handleMenu(item.key)}
              aria-pressed={activeMenu === item.key}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition cursor-pointer sm:px-4 sm:py-2.5 sm:text-sm ${
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
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-linear-to-r from-blue-600 to-blue-900 px-3.5 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer hover:brightness-110 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <Compass className="h-4 w-4" />
            <span className="sm:hidden">Jelajahi</span>
            <span className="hidden sm:inline">Jelajahi Sekarang</span>
          </button>
        </nav>
      </div>
      )}

      <div className="pointer-events-auto absolute bottom-4 right-3 flex flex-col gap-2 sm:bottom-6 sm:right-6">
        <button
          onClick={onToggleLabels}
          aria-pressed={!labelsVisible}
          title={labelsVisible ? "Sembunyikan label" : "Tampilkan label"}
          className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg backdrop-blur transition cursor-pointer ${
            labelsVisible ? "bg-white/95 text-slate-700 hover:bg-white" : "bg-blue-600 text-white"
          }`}
        >
          <Tag className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleHud}
          aria-pressed={!hudVisible}
          title={hudVisible ? "Sembunyikan navigasi" : "Tampilkan navigasi"}
          className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg backdrop-blur transition cursor-pointer ${
            hudVisible ? "bg-white/95 text-slate-700 hover:bg-white" : "bg-blue-600 text-white"
          }`}
        >
          {hudVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void document.documentElement.requestFullscreen();
          }}
          title="Layar penuh"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white cursor-pointer"
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>

      {activeMenu && (
        <InfoModal kind={activeMenu} onClose={() => onMenuClose?.()} />
      )}
    </div>
  );
}