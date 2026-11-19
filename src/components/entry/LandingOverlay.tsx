import { useState } from "react";
import { Check, ChevronDown, Compass, Eye } from "lucide-react";
import { VIEW_PRESETS } from "@/config/enuma";
import { SidePanel } from "@/components/entry/SidePanel";

export type LandingMenuKey = "tentang" | "layanan" | "portofolio";

/** Preset sudut pandang kamera. Posisi kamera akan dihubungkan di tahap berikutnya. */
const MENU_ITEMS: { key: LandingMenuKey; label: string }[] = [
  { key: "tentang", label: "Tentang Kami" },
  { key: "layanan", label: "Layanan / Jasa" },
  { key: "portofolio", label: "Portofolio" },
];


interface LandingOverlayProps {
  activeMenu: LandingMenuKey | null;
  onMenuSelect: (key: LandingMenuKey) => void;
  activeView: string;
  onViewSelect: (view: string) => void;
  onExplore: () => void;
}

export function LandingOverlay({
  activeMenu,
  onMenuSelect,
  activeView,
  onViewSelect,
  onExplore,
}: LandingOverlayProps) {
  const [viewOpen, setViewOpen] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 p-3 sm:p-8 select-none">
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
            <nav className="pointer-events-auto relative xl:absolute xl:left-1/2 xl:top-0 xl:-translate-x-1/2 flex items-center gap-1 rounded-[28px] bg-white/95 p-2 shadow-xl backdrop-blur">
            <button
                onClick={() => setViewOpen((v) => !v)}
                aria-expanded={viewOpen}
                className={`hidden sm:flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition cursor-pointer ${
                viewOpen ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
                }`}
            >
                <Eye className="h-4 w-4" />
                {activeView}
                <ChevronDown
                className={`h-4 w-4 transition ${viewOpen ? "rotate-180" : ""}`}
                />
            </button>

            {MENU_ITEMS.map((item) => (
                <button
                key={item.key}
                onClick={() => onMenuSelect(item.key)}
                className={`hidden md:block rounded-full px-4 py-2.5 text-sm font-bold transition cursor-pointer ${
                    activeMenu === item.key
                    ? "bg-blue-600 text-white"
                    : "text-slate-800 hover:bg-slate-100"
                }`}
                >
                {item.label}
                </button>
            ))}

            <button
                onClick={onExplore}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-900 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:brightness-110 transition cursor-pointer"
            >
                <Compass className="h-4 w-4" />
                Jelajahi Sekarang
            </button>

            {viewOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-white p-3 shadow-2xl">
                <p className="px-2 pb-2 text-sm text-slate-500">Sudut Pandang</p>
                <ul className="space-y-1">
                    {VIEW_PRESETS.map((view) => {
                    const active = view === activeView;
                    return (
                        <li key={view}>
                        <button
                            onClick={() => {
                            onViewSelect(view);
                            setViewOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-base font-bold transition cursor-pointer ${
                            active
                                ? "bg-slate-900 text-white"
                                : "text-slate-800 hover:bg-slate-100"
                            }`}
                        >
                            {view}
                            {active && <Check className="h-4 w-4" />}
                        </button>
                        </li>
                    );
                    })}
                </ul>
                </div>
            )}
            </nav>
        </div>
    </div>
  );
}