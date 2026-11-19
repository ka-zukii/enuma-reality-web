import { API_URL } from "@/lib/config";
import { supabase } from "@/lib/supabase";

/**
 * Token akses terbaru. getSession() otomatis me-refresh token bila hampir kedaluwarsa,
 * jadi pemanggil tidak perlu menyimpan token sendiri.
 */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** fetch ke backend dengan Bearer token terbaru. Lempar error bila belum login. */
export async function authFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getAccessToken();
  if (!token) throw new Error("Belum login");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${API_URL}${path}`, { ...init, headers });
}
