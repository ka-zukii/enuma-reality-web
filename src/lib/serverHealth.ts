// src/lib/serverHealth.ts
// Cek kesiapan server sebelum pemain masuk kota. Server bisa lambat bangun
// (cold start), jadi pengecekan diulang sampai /health menjawab "ok".
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/config";

const RETRY_MS = 1500;
const TRY_TIMEOUT_MS = 4000;
/** Setelah waktu ini, UI menampilkan pesan bahwa server sedang dinyalakan */
const SLOW_AFTER_MS = 12000;

async function pingOnce(signal: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store", signal });
    if (!res.ok) return false;
    const body = (await res.json()) as { status?: string };
    return body?.status === "ok";
  } catch {
    return false;
  }
}

export function useServerReady(): { ready: boolean; slow: boolean } {
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;
    const started = Date.now();

    const check = async () => {
      const ctrl = new AbortController();
      const abortTimer = window.setTimeout(() => ctrl.abort(), TRY_TIMEOUT_MS);
      const ok = await pingOnce(ctrl.signal);
      window.clearTimeout(abortTimer);
      if (cancelled) return;
      if (ok) {
        setReady(true);
        return;
      }
      if (Date.now() - started >= SLOW_AFTER_MS) setSlow(true);
      retryTimer = window.setTimeout(check, RETRY_MS);
    };

    void check();
    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
    };
  }, []);

  return { ready, slow };
}
