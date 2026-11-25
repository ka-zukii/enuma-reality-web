import { ArrowLeft, type LucideIcon } from "lucide-react";

export function AppHeader({
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

export function ToggleRow({
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
