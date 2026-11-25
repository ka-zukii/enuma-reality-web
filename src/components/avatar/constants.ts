import { type MemberRole } from "@/types";

export const ROLE_ACCENT: Record<MemberRole, string> = {
  OWNER: "#f59e0b",
  ADMIN: "#a855f7",
  MEMBER: "#0ea5e9",
  GUEST: "#94a3b8",
};

export function lerpAngle(a: number, b: number, t: number): number {
  const diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  const shortest = diff < -Math.PI ? diff + Math.PI * 2 : diff;
  return a + shortest * t;
}

// Semua komponen kepala memakai koordinat lokal terhadap pusat kepala (0, 0.145, 0)
// di dalam headGroupRef yang berporos di leher (0, 1.44, 0).
export const HEAD_R = 0.13;

export const HEAD_SCALE: [number, number, number] = [0.92, 1.06, 0.94];

// ---------------------------------------------------------------
// Komponen utama Avatar3D
// ---------------------------------------------------------------
export const AVATAR_SCALE = 0.84;
