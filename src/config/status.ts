import type { PlayerStatus } from "@/types";

export interface StatusOption {
  value: PlayerStatus;
  label: string;
  /** Warna hex: dipakai untuk titik di HUD dan teks 3D di atas kepala */
  color: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: "LIVE", label: "Live", color: "#10b981" },
  { value: "PAGI", label: "Pagi", color: "#f59e0b" },
  { value: "SORE", label: "Sore", color: "#ec4899" },
  { value: "MALAM", label: "Malam", color: "#6366f1" },
  { value: "ISTIRAHAT", label: "Istirahat", color: "#f97316" },
];

export function getStatusMeta(status?: string | null): StatusOption {
  return STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
}