// src/lib/tramRuntime.ts
//
// Trem TIDAK disimulasikan di client. Posisi trem dikirim server (event room:world)
// sehingga semua pemain di room yang sama melihat trem di posisi yang sama.
// Client menginterpolasi snapshot dari server, lalu menghitung posisi gerbong dan penumpang.
import { loopPoint } from "@/config/railway";
import { worldNowMs } from "@/lib/worldClock";

export const TRAM = {
  carCount: 2,
  carLength: 10.3, // 4.68 m (model) x 2.2
  carGap: 0.3,
  halfWidth: 1.14, // lebar sekitar 2.3 m
  floorY: 0.6, // sejajar dengan peron yang sudah dinaikkan
  walkSpeed: 2.5,
  wall: 0.2,
};

/** Jarak antar pusat gerbong (sepanjang rel). */
export const CAR_SPACING = TRAM.carLength + TRAM.carGap;

const CAR_HALF = TRAM.carLength / 2;
const FRONT = CAR_HALF; // ujung depan dari pusat kepala
const REAR = (TRAM.carCount - 1) * CAR_SPACING + CAR_HALF; // ujung belakang dari pusat kepala

/* ---------- Status trem dari server ---------- */

export interface TramSnapshot {
  head: number; // jarak tempuh kepala trem (tidak dibungkus)
  v: number; // kecepatan (m/s)
  dwell: number; // sisa waktu berhenti di stasiun (detik)
  t: number; // waktu server (ms) saat snapshot dihitung
}

/**
 * Trem digambar sedikit di belakang waktu terkini. Dengan begitu ada snapshot
 * di kedua sisi untuk diinterpolasi, dan jitter jaringan tidak terlihat.
 */
const RENDER_DELAY_MS = 150;
/** Snapshot yang lebih tua dari ini dibuang dari buffer */
const BUFFER_KEEP_MS = 2000;
/** Batas ekstrapolasi jika snapshot terbaru belum datang */
const MAX_EXTRAPOLATE_MS = 250;

let buffer: TramSnapshot[] = [];

const view = {
  head: 0,
  lastTime: -1, // mencegah hitung ulang dalam satu frame
};

/** Dipanggil setiap kali server mengirim room:world */
export function applyTramSnapshot(s: TramSnapshot): void {
  const last = buffer[buffer.length - 1];
  if (last && s.t <= last.t) return;
  buffer.push(s);
  const cutoff = s.t - BUFFER_KEEP_MS;
  while (buffer.length > 2 && buffer[0].t < cutoff) buffer.shift();
}

/** Dipanggil saat pindah room / putus, supaya tidak memakai trem lama */
export function resetTramSnapshot(): void {
  buffer = [];
  view.head = 0;
  view.lastTime = -1;
}

/** Interpolasi Hermite antara dua snapshot: posisi dan kecepatan sama-sama halus. */
function hermite(a: TramSnapshot, b: TramSnapshot, rt: number): number {
  const span = b.t - a.t;
  const u = (rt - a.t) / span;
  const dt = span / 1000;
  const m0 = a.v * dt;
  const m1 = b.v * dt;
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * a.head +
    (u3 - 2 * u2 + u) * m0 +
    (-2 * u3 + 3 * u2) * b.head +
    (u3 - u2) * m1
  );
}

/** Posisi kepala trem pada waktu render (waktu dunia dikurangi delay). */
function estimateHead(): number {
  const n = buffer.length;
  if (n === 0) return view.head;

  const rt = worldNowMs() - RENDER_DELAY_MS;
  const first = buffer[0];
  const last = buffer[n - 1];

  if (rt <= first.t) return first.head;

  if (rt >= last.t) {
    // Paket berikutnya belum datang: lanjutkan dengan kecepatan terakhir
    if (last.dwell > 0) return last.head;
    const ahead = Math.min(rt - last.t, MAX_EXTRAPOLATE_MS) / 1000;
    return last.head + last.v * ahead;
  }

  for (let i = n - 1; i > 0; i--) {
    if (buffer[i - 1].t <= rt) {
      return hermite(buffer[i - 1], buffer[i], rt);
    }
  }
  return first.head;
}

/**
 * Perbarui posisi trem untuk frame ini. Aman dipanggil berkali-kali dalam satu frame
 * (dari Tram, OfficeScene, atau Avatar3D); hanya dihitung sekali.
 */
export function stepTramView(time: number): void {
  if (time === view.lastTime) return;
  view.lastTime = time;
  view.head = estimateHead();
}

export function getTramHead(): number {
  return view.head;
}

/** true jika trem sedang berhenti di stasiun (saat itu pemain boleh naik/turun) */
export function isTramStopped(): boolean {
  const last = buffer[buffer.length - 1];
  return !!last && last.dwell > 0;
}

/* ---------- Geometri gerbong ---------- */

/**
 * Pose (pusat & arah) gerbong ke-`i` (0 = kepala).
 * Ujung depan dan belakang gerbong ditempatkan tepat di rel, lalu pusatnya diambil
 * di tengah kedua ujung itu. Dengan begitu bodi gerbong mengikuti lengkung rel,
 * dan tidak menyerong keluar seperti jika hanya pusatnya yang ada di rel.
 */
export function carPose(i: number): { x: number; z: number; angle: number } {
  const center = view.head - i * CAR_SPACING;
  const front = loopPoint(center + CAR_HALF);
  const back = loopPoint(center - CAR_HALF);
  return {
    x: (front.x + back.x) / 2,
    z: (front.z + back.z) / 2,
    angle: Math.atan2(front.x - back.x, front.z - back.z),
  };
}

function toLocal(x: number, z: number, ox: number, oz: number, a: number) {
  const dx = x - ox;
  const dz = z - oz;
  return {
    lx: dx * Math.cos(a) - dz * Math.sin(a),
    lz: dx * Math.sin(a) + dz * Math.cos(a),
  };
}

function toWorld(
  lx: number,
  lz: number,
  ox: number,
  oz: number,
  a: number,
): [number, number] {
  return [
    ox + lx * Math.cos(a) + lz * Math.sin(a),
    oz - lx * Math.sin(a) + lz * Math.cos(a),
  ];
}

/**
 * Posisi penumpang disimpan sebagai `rz` = jarak dari pusat kepala sepanjang trem
 * (positif = depan). Gerbong yang memuat penumpang ditentukan dari `rz`.
 */
function carIndexFor(rz: number): number {
  const i = Math.round(-rz / CAR_SPACING);
  return Math.max(0, Math.min(TRAM.carCount - 1, i));
}

/** Posisi dunia penumpang dari (rx, rz), memakai gerbong yang memuatnya. */
function riderWorld(rx: number, rz: number): [number, number] {
  const i = carIndexFor(rz);
  const cp = carPose(i);
  // Di dalam gerbong ke-i, titik asal lokalnya adalah pusat gerbong itu
  const lz = rz + i * CAR_SPACING;
  return toWorld(rx, lz, cp.x, cp.z, cp.angle);
}

/**
 * Posisi dunia penumpang lain yang sedang naik.
 * Dipakai di client lain, sehingga penumpang ikut bergerak bersama bodi gerbong.
 */
export function riderWorldPos(rx: number, rz: number): [number, number] {
  return riderWorld(rx, rz);
}

/* ---------- Naik / turun / berjalan di dalam kabin ---------- */

/** Jarak maksimum dari sumbu rel agar pemain di peron masih bisa naik. */
const DOOR_REACH = 4.5;

/**
 * Cari gerbong yang pintunya bisa dijangkau pemain di (x, z).
 * Mengembalikan indeks gerbong dan posisi `rz`, atau null jika tidak ada.
 */
function findDoor(
  x: number,
  z: number,
): { i: number; lx: number; rz: number } | null {
  for (let i = 0; i < TRAM.carCount; i++) {
    const cp = carPose(i);
    const { lx, lz } = toLocal(x, z, cp.x, cp.z, cp.angle);
    if (Math.abs(lx) <= DOOR_REACH && Math.abs(lz) <= CAR_HALF - TRAM.wall) {
      return { i, lx, rz: lz - i * CAR_SPACING };
    }
  }
  return null;
}

/** Dipakai untuk petunjuk "Tekan E untuk naik" di layar. */
export function isNearTramDoor(x: number, z: number): boolean {
  return findDoor(x, z) !== null;
}

let boardRequested = false;

/** Pasang listener tombol E. Kembalikan fungsi untuk melepasnya. */
export function installTramKey(): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.code !== "KeyE" || e.repeat) return;
    const t = e.target as HTMLElement | null;
    if (
      t &&
      (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
    )
      return;
    boardRequested = true;
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}

/** Status naik trem milik pemain lokal. */
export interface RiderState {
  riding: boolean;
  rx: number; // posisi lateral di kabin
  rz: number; // posisi sepanjang trem, relatif ke pusat kepala
}

export interface RideResult {
  riding: boolean;
  pos: [number, number];
}

/**
 * Dipanggil setiap frame dari OfficeScene (setelah stepTramView).
 * - `player`: posisi pemain saat ini (x, z) di dunia.
 * - `want`: arah jalan pemain (x, z) yang sudah dinormalisasi, atau null jika diam.
 * Mengembalikan posisi dunia jika pemain sedang di trem (atau baru turun), null jika di luar.
 */
export function updateRider(
  dt: number,
  player: [number, number],
  want: [number, number] | null,
  rider: RiderState,
): RideResult | null {
  const stopped = isTramStopped();
  const maxX = TRAM.halfWidth - TRAM.wall;

  if (boardRequested) {
    boardRequested = false;

    if (stopped) {
      if (!rider.riding) {
        const door = findDoor(player[0], player[1]);
        if (door) {
          // Masuk lewat pintu di sisi pemain berdiri
          rider.riding = true;
          rider.rx = door.lx >= 0 ? maxX : -maxX;
          rider.rz = door.rz;
        }
      } else {
        // Turun di sisi kabin tempat pemain berdiri
        rider.riding = false;
        const side = rider.rx >= 0 ? 1 : -1;
        const [x, z] = riderWorld(side * (TRAM.halfWidth + 1), rider.rz);
        return { riding: false, pos: [x, z] };
      }
    }
  }

  if (!rider.riding) return null;

  if (want) {
    // Arah jalan mengikuti gerbong tempat pemain berdiri, supaya benar di tikungan
    const cp = carPose(carIndexFor(rider.rz));
    const s = TRAM.walkSpeed * dt;
    const dlx =
      (want[0] * Math.cos(cp.angle) - want[1] * Math.sin(cp.angle)) * s;
    const dlz =
      (want[0] * Math.sin(cp.angle) + want[1] * Math.cos(cp.angle)) * s;

    rider.rx = Math.max(-maxX, Math.min(maxX, rider.rx + dlx));
    rider.rz = Math.max(
      -REAR + TRAM.wall,
      Math.min(FRONT - TRAM.wall, rider.rz + dlz),
    );
  }

  const [x, z] = riderWorld(rider.rx, rider.rz);
  return { riding: true, pos: [x, z] };
}
