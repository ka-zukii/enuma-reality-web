import { supabase } from "@/lib/supabase";

export type Gender = "male" | "female";

export interface GuestProfile {
  /** Nama panggilan. Kosong = anonim */
  name?: string;
  gender?: Gender | null;
}

const MAX_NAME_LENGTH = 20;

function randomGuestName() {
  return `Tamu-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Masuk sebagai tamu lewat login anonim Supabase.
 * Catatan: fitur "Anonymous sign-ins" harus diaktifkan di project Supabase.
 */
export async function signInAsGuest(profile: GuestProfile = {}) {
  const cleanName = (profile.name ?? "").trim().slice(0, MAX_NAME_LENGTH);
  const fullName = cleanName || randomGuestName();

  const { error } = await supabase.auth.signInAnonymously({
    options: {
      data: { full_name: fullName, gender: profile.gender ?? null },
    },
  });

  if (error) {
    if (/anonymous/i.test(error.message)) {
      throw new Error(
        "Mode tamu belum diaktifkan di server. Hubungi tim backend.",
      );
    }
    throw new Error(error.message);
  }
}