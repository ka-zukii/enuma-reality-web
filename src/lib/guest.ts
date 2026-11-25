import { supabase } from "@/lib/supabase";
import type { AvatarId } from "@/config/avatars";

export const CHARACTERS = [
  "karakter_1",
  "karakter_2",
  "male_1",
  "male_2",
  "male_3",
  "female_1",
  "female_2",
  "female_3",
] as const;
export type Character = "karakter_1" | "karakter_2" | AvatarId;

export function validateNickname(raw: string): string | null {
  const name = raw.trim();
  if (name.length < 3) return "Nama panggilan minimal 3 karakter";
  if (name.length > 16) return "Nama panggilan maksimal 16 karakter";
  return null;
}

/**
 * Dipanggil saat tombol "Mulai" ditekan.
 * Tamu baru: sign-in anonim dengan metadata nama dan karakter.
 * Sesi yang sudah ada: perbarui metadata saja.
 */
export async function startAsGuest(nickname: string, character: Character) {
  const error = validateNickname(nickname);
  if (error) throw new Error(error);

  const name = nickname.trim();
  const { data: current } = await supabase.auth.getSession();

  if (!current.session) {
    const { data, error: signInError } = await supabase.auth.signInAnonymously({
      options: { data: { full_name: name, character } },
    });
    if (signInError) throw signInError;
    return data.session;
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: { full_name: name, character },
  });
  if (updateError) throw updateError;

  const { data: refreshed } = await supabase.auth.getSession();
  return refreshed.session;
}
