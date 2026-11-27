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

async function doFetch(
  path: string,
  init: RequestInit,
  token: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_URL}/api${path}`, { ...init, headers });
}

/**
 * fetch ke backend dengan Bearer token terbaru.
 * Jika backend menjawab 401, sesi di-refresh sekali lalu request diulang.
 * Bila refresh gagal, sesi lama dihapus dan error khusus dilempar agar UI
 * bisa kembali ke formulir masuk.
 */
export async function authFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getAccessToken();
  if (!token) throw new SessionExpiredError();

  const res = await doFetch(path, init, token);
  if (res.status !== 401) return res;

  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session?.access_token) {
    await supabase.auth.signOut();
    throw new SessionExpiredError();
  }

  return doFetch(path, init, data.session.access_token);
}

export class SessionExpiredError extends Error {
  constructor() {
    super("Sesi berakhir, silakan mulai ulang");
    this.name = "SessionExpiredError";
  }
}
