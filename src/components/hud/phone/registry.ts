import {
  Disc3,
  MessageCircle,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type PhoneAppId = "settings" | "spotify" | "avatar" | "whatsapp";

export interface PhoneAppMeta {
  id: PhoneAppId;
  name: string;
  icon: LucideIcon;
  bgClass: string;
}

export const PHONE_APPS: PhoneAppMeta[] = [
  {
    id: "settings",
    name: "Pengaturan",
    icon: Settings,
    bgClass: "bg-linear-to-br from-zinc-500 to-zinc-700",
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: Disc3,
    bgClass: "bg-linear-to-br from-emerald-400 to-green-600",
  },
  {
    id: "avatar",
    name: "Ganti Avatar",
    icon: UserRound,
    bgClass: "bg-linear-to-br from-sky-400 to-blue-600",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: MessageCircle,
    bgClass: "bg-linear-to-br from-green-400 to-emerald-600",
  },
];
