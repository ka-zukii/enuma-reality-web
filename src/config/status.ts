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
  { value: "STANDUP", label: "Stand-up", color: "#8b5cf6" },
  { value: "ISTIRAHAT", label: "Istirahat", color: "#f97316" },
  { value: "TAMU", label: "Tamu", color: "#64748b" },
];

export function getStatusMeta(status?: string | null): StatusOption {
  return STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
}
