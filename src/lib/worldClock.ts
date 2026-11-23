// src/lib/worldClock.ts
// Jam dunia yang sama untuk semua pemain. Server mengirim waktunya (serverTime)
// di setiap room:world; client menyimpan selisihnya terhadap jam lokal.
//
// Setiap sampel = offset - latensi, jadi latensi selalu membuat sampel lebih kecil.
// Sampel terbesar dalam jendela = latensi paling kecil, dan itu estimasi terbaik.
// Offset digeser perlahan ke estimasi itu, sehingga jitter jaringan tidak terlihat
// sebagai lompatan waktu (dan lompatan posisi trem).

const WINDOW = 40;
/** Batas geseran per sampel (ms) */
const SLEW_MS = 2;

const samples: number[] = [];
let offsetMs = 0;

export function syncWorldClock(serverTimeMs: number): void {
  samples.push(serverTimeMs - Date.now());
  if (samples.length > WINDOW) samples.shift();

  const target = Math.max(...samples);
  if (samples.length === 1) {
    offsetMs = target;
    return;
  }
  const delta = Math.max(-SLEW_MS, Math.min(SLEW_MS, target - offsetMs));
  offsetMs += delta;
}

/** Waktu dunia (ms, epoch) yang sudah dikoreksi ke jam server. */
export function worldNowMs(): number {
  return Date.now() + offsetMs;
}
