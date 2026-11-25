import {
  Briefcase,
  Crown,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { MemberRole } from "@/types";

export interface RoleMeta {
  label: string;
  icon: LucideIcon;
  /** Kelas gradient Tailwind, ditulis lengkap agar terbaca oleh scanner Tailwind */
  gradient: string;
}

export const ROLE_META: Record<MemberRole, RoleMeta> = {
  OWNER: {
    label: "Founder",
    icon: Crown,
    gradient: "from-amber-400 to-orange-500",
  },
  ADMIN: {
    label: "Admin",
    icon: ShieldCheck,
    gradient: "from-violet-500 to-fuchsia-500",
  },
  MEMBER: {
    label: "Warga",
    icon: Briefcase,
    gradient: "from-cyan-400 to-blue-500",
  },
  GUEST: {
    label: "Tamu",
    icon: UserRound,
    gradient: "from-slate-400 to-slate-500",
  },
};

export function getRoleMeta(role?: string | null): RoleMeta {
  return ROLE_META[(role as MemberRole) ?? "MEMBER"] ?? ROLE_META.MEMBER;
}
