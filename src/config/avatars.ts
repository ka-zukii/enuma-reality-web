import { useEffect, useState } from "react";

export type AvatarGender = "male" | "female";
export type AvatarHairStyle =
  | "short"
  | "fade"
  | "parted"
  | "long"
  | "hijab"
  | "ponytail";

export const AVATAR_IDS = [
  "male_1",
  "male_2",
  "male_3",
  "female_1",
  "female_2",
  "female_3",
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export type OutfitType =
  | "sweater"
  | "hoodie"
  | "blazer"
  | "cardigan_skirt"
  | "hijab_blazer"
  | "jacket_skirt";

export interface AvatarPreset {
  id: AvatarId;
  name: string;
  gender: AvatarGender;
  styleLabel: string;
  outfit: OutfitType;
  skin: string;
  hair: string;
  iris: string;
  shirt: string;
  inner: string;
  collar: string;
  pants: string;
  shoe: string;
  shoeSole: string;
  hairStyle: AvatarHairStyle;
  beard?: boolean;
  glasses?: boolean;
  swatchClass: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  // 3 Cowok
  {
    id: "male_1",
    name: "Raka",
    gender: "male",
    styleLabel: "Smart Casual",
    outfit: "sweater",
    skin: "#f5cba7",
    hair: "#1c1917",
    iris: "#3b2f2f",
    shirt: "#1e3a5f",
    inner: "#f8fafc",
    collar: "#f8fafc",
    pants: "#1f2937",
    shoe: "#334155",
    shoeSole: "#f8fafc",
    hairStyle: "short",
    beard: true,
    glasses: true,
    swatchClass: "from-blue-600 to-slate-800",
  },
  {
    id: "male_2",
    name: "Bima",
    gender: "male",
    styleLabel: "Tech Hoodie",
    outfit: "hoodie",
    skin: "#e2ab82",
    hair: "#0f172a",
    iris: "#1e293b",
    shirt: "#0f766e",
    inner: "#e2e8f0",
    collar: "#115e59",
    pants: "#1e293b",
    shoe: "#0f172a",
    shoeSole: "#ffffff",
    hairStyle: "fade",
    beard: false,
    glasses: false,
    swatchClass: "from-teal-500 to-emerald-700",
  },
  {
    id: "male_3",
    name: "Dimas",
    gender: "male",
    styleLabel: "Blazer Rapi",
    outfit: "blazer",
    skin: "#f6d2b1",
    hair: "#452719",
    iris: "#451a03",
    shirt: "#3f4f3c",
    inner: "#ffffff",
    collar: "#ffffff",
    pants: "#292524",
    shoe: "#451a03",
    shoeSole: "#e7e5e4",
    hairStyle: "parted",
    beard: false,
    glasses: true,
    swatchClass: "from-emerald-700 to-stone-800",
  },

  // 3 Cewek
  {
    id: "female_1",
    name: "Sora",
    gender: "female",
    styleLabel: "Office Chic",
    outfit: "cardigan_skirt",
    skin: "#fce0c8",
    hair: "#2b1d19",
    iris: "#2563eb",
    shirt: "#2563eb",
    inner: "#ffffff",
    collar: "#ffffff",
    pants: "#1e293b",
    shoe: "#1f2937",
    shoeSole: "#f8fafc",
    hairStyle: "long",
    beard: false,
    glasses: false,
    swatchClass: "from-sky-500 to-indigo-600",
  },
  {
    id: "female_2",
    name: "Nadia",
    gender: "female",
    styleLabel: "Modern Hijab",
    outfit: "hijab_blazer",
    skin: "#ecc09d",
    hair: "#9f1239",
    iris: "#3f2a1e",
    shirt: "#be185d",
    inner: "#fdf2f8",
    collar: "#fce7f3",
    pants: "#334155",
    shoe: "#4c0519",
    shoeSole: "#f8fafc",
    hairStyle: "hijab",
    beard: false,
    glasses: false,
    swatchClass: "from-rose-500 to-pink-700",
  },
  {
    id: "female_3",
    name: "Kira",
    gender: "female",
    styleLabel: "Creative Casual",
    outfit: "jacket_skirt",
    skin: "#f9d5b7",
    hair: "#4c1d95",
    iris: "#6d28d9",
    shirt: "#7c3aed",
    inner: "#f5f3ff",
    collar: "#ede9fe",
    pants: "#1f2937",
    shoe: "#312e81",
    shoeSole: "#ffffff",
    hairStyle: "ponytail",
    beard: false,
    glasses: true,
    swatchClass: "from-violet-500 to-purple-700",
  },
];

const LEGACY_MAP: Record<string, AvatarId> = {
  karakter_1: "male_1",
  karakter_2: "female_1",
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function normalizeAvatarId(raw?: string | null): AvatarId | null {
  if (!raw) return null;
  if (raw in LEGACY_MAP) return LEGACY_MAP[raw];
  if ((AVATAR_IDS as readonly string[]).includes(raw)) return raw as AvatarId;
  return null;
}

export function resolveAvatarPreset(
  raw?: string | null,
  fallbackSeed = "default",
): AvatarPreset {
  const normalized = normalizeAvatarId(raw);
  if (normalized) {
    return AVATAR_PRESETS.find((p) => p.id === normalized) ?? AVATAR_PRESETS[0];
  }
  const idx = hashString(fallbackSeed) % AVATAR_PRESETS.length;
  return AVATAR_PRESETS[idx];
}

// Store ringan agar ganti avatar di ponsel langsung mengubah karakter 3D secara real-time
const STORAGE_KEY = "enuma_avatar_id";
let currentAvatarId: AvatarId | null = (() => {
  try {
    return normalizeAvatarId(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
})();
const avatarListeners = new Set<() => void>();

export function setLocalAvatarId(id: AvatarId) {
  currentAvatarId = id;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Abaikan jika storage tidak tersedia
  }
  for (const fn of avatarListeners) fn();
}

export function useLocalAvatarId(): AvatarId | null {
  const [val, setVal] = useState<AvatarId | null>(currentAvatarId);

  useEffect(() => {
    const sync = () => setVal(currentAvatarId);
    avatarListeners.add(sync);
    return () => {
      avatarListeners.delete(sync);
    };
  }, []);

  return val;
}
