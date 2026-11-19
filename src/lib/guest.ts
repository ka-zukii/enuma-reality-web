import { supabase } from "@/lib/supabase";

export const CHARACTERS = ["karakter_1", "karakter_2"] as const;
export type Character = (typeof CHARACTERS)[number];

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
