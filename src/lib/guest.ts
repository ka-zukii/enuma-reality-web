import { supabase } from "@/lib/supabase";

export type Character = "karakter_1" | "karakter_2";

const MAX_NAME_LENGTH = 20;

function randomGuestName() {
  return `Tamu-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Masuk sebagai tamu lewat login anonim Supabase.
 * Nama dan karakter disimpan di user_metadata, lalu dibaca backend.
 * Catatan: fitur "Anonymous sign-ins" harus diaktifkan di project Supabase.
 */
export async function startAsGuest(
  nickname = "",
  character: Character = "karakter_1",
) {
  const cleanName = nickname.trim().slice(0, MAX_NAME_LENGTH);
  const fullName = cleanName || randomGuestName();

  const { error } = await supabase.auth.signInAnonymously({
    options: {
      data: { full_name: fullName, character },
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