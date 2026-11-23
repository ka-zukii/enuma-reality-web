// src/lib/tramRuntime.ts
import { LOOP_LENGTH, STATION_STOPS, loopPoint } from "@/config/railway";

export const TRAM = {
  carCount: 2,
  carLength: 10.3,   // 4.68 m (model) x 2.2
  carGap: 0.3,
  halfWidth: 1.14,   // lebar sekitar 2.3 m
  floorY: 0.6,       // sejajar dengan peron yang sudah dinaikkan (lihat langkah 5)
  speed: 7,
  accel: 1.5,        // trem berat, jadi perlu lebih lambat saat mengerem dan berangkat
  walkSpeed: 2.5,
  wall: 0.2,
  startOffset: 0,
};

/** Jarak antar pusat gerbong. */
export const CAR_SPACING = TRAM.carLength + TRAM.carGap;
const STOP_OFFSET = ((TRAM.carCount - 1) * CAR_SPACING) / 2;

const FRONT = TRAM.carLength / 2;                                    // ujung depan dari pusat kepala
const REAR = (TRAM.carCount - 1) * CAR_SPACING + TRAM.carLength / 2; // ujung belakang dari pusat kepala

type TramState = {
  head: number;      // jarak tempuh kepala trem (tidak dibungkus)
  v: number;         // kecepatan saat ini (unit/detik)
  dwell: number;     // sisa waktu berhenti di stasiun (detik)
  lastTime: number;  // mencegah langkah ganda dalam satu frame
  pending: boolean;  // permintaan naik/turun dari tombol E
  boarded: boolean;  // apakah pemain sedang di dalam trem
  rx: number;        // posisi pemain di kabin (lokal, origin = pusat kepala)
  rz: number;
};

export const tram: TramState = {
  head: TRAM.startOffset,
  v: 0,
  dwell: 0,
  lastTime: -1,
  pending: false,
  boarded: false,
  rx: 0,
  rz: 0,
};

/** Jarak dari kepala trem ke stasiun berikutnya di depan (dan lama berhentinya). */
function distToNextStop(head: number): { dist: number; dwell: number } {
  let dist = Infinity;
  let dwell = 0;
  for (const st of STATION_STOPS) {
    // Titik berhenti kepala = posisi stasiun + STOP_OFFSET
    let d = (st.s + STOP_OFFSET - head) % LOOP_LENGTH;
    if (d < 0) d += LOOP_LENGTH;
    // Titik berhenti tepat di bawah kepala (baru ditinggalkan) dianggap satu putaran penuh
    if (d < 1e-4) d = LOOP_LENGTH;
    if (d < dist) {
      dist = d;
      dwell = st.dwell;
    }
  }
  return { dist, dwell };
}

const STOP_EPS = 0.05;

/**
 * Maju satu langkah dengan profil kecepatan halus:
 * - mulai dari diam lalu naik perlahan sampai kecepatan jelajah,
 * - mengerem tepat sebelum stasiun, lalu berhenti di titiknya,
 * - setelah dwell, berangkat lagi dari diam.
 * Dipanggil dari Tram (visual) dan OfficeScene (pemain). Guard `lastTime`
 * memastikan hanya berjalan sekali per frame.
 */
export function stepTram(time: number, delta: number) {
  if (time === tram.lastTime) return;
  tram.lastTime = time;

  const dt = Math.min(delta, 1 / 30);

  if (tram.dwell > 0) {
    tram.dwell = Math.max(0, tram.dwell - dt);
    tram.v = 0;
    return;
  }

  const { dist, dwell } = distToNextStop(tram.head);

  // Kecepatan terbesar yang masih bisa direm tepat di stasiun
  const vTarget = Math.min(TRAM.speed, Math.sqrt(2 * TRAM.accel * dist));

  // Ubah kecepatan secara bertahap (bukan langsung)
  if (tram.v < vTarget) {
    tram.v = Math.min(vTarget, tram.v + TRAM.accel * dt);
  } else {
    tram.v = Math.max(vTarget, tram.v - TRAM.accel * dt);
  }

  const step = tram.v * dt;

  // Sampai di stasiun: kunci posisinya dan mulai berhenti
  if (step >= dist || (dist - step < STOP_EPS && tram.v < 1)) {
    tram.head += dist;
    tram.v = 0;
    tram.dwell = dwell;
  } else {
    tram.head += step;
  }
}

/**
 * Posisi (x, z) dan heading yang halus di jarak `s`.
 * Heading dihitung dari dua titik di kedua sisi, bukan dari satu segmen,
 * sehingga tidak ada loncatan rotasi saat melewati titik sudut belokan.
 */
export function poseAt(s: number): { x: number; z: number; angle: number } {
  const h = 0.6;
  const c = loopPoint(s);
  const a = loopPoint(s - h);
  const b = loopPoint(s + h);
  return {
    x: c.x,
    z: c.z,
    angle: Math.atan2(b.x - a.x, b.z - a.z),
  };
}

/* ---------- Konversi koordinat (dunia <-> lokal trem) ---------- */

function toLocal(x: number, z: number, ox: number, oz: number, a: number) {
  const dx = x - ox;
  const dz = z - oz;
  return {
    lx: dx * Math.cos(a) - dz * Math.sin(a),
    lz: dx * Math.sin(a) + dz * Math.cos(a),
  };
}

function toWorld(lx: number, lz: number, ox: number, oz: number, a: number): [number, number] {
  return [
    ox + lx * Math.cos(a) + lz * Math.sin(a),
    oz - lx * Math.sin(a) + lz * Math.cos(a),
  ];
}

function inCabin(lx: number, lz: number) {
  return (
    Math.abs(lx) <= TRAM.halfWidth - TRAM.wall &&
    lz <= FRONT - TRAM.wall &&
    lz >= -REAR + TRAM.wall
  );
}

export type RideResult = {
  /** true jika pemain sedang di dalam trem */
  riding: boolean;
  /** Posisi (x, z) pemain di dunia jika perlu diset; null jika tidak ada perubahan */
  pos: [number, number] | null;
};

/**
 * Dipanggil setiap frame dari OfficeScene.
 * - `player`: posisi pemain saat ini (x, z) di dunia.
 * - `want`: arah jalan pemain di dunia (x, z) yang sudah dinormalisasi, atau null jika diam.
 */
export function updateRider(
  dt: number,
  player: [number, number],
  want: [number, number] | null
): RideResult {
  const pose = poseAt(tram.head);
  const a = pose.angle;
  const ox = pose.x;
  const oz = pose.z;
  const stopped = tram.dwell > 0;

  // Tombol E ditekan
  if (tram.pending) {
    tram.pending = false;

    if (!tram.boarded && stopped) {
      const { lx, lz } = toLocal(player[0], player[1], ox, oz, a);
      if (inCabin(lx, lz)) {
        tram.boarded = true;
        tram.rx = lx;
        tram.rz = lz;
      }
    } else if (tram.boarded && stopped) {
      // Turun di sisi kabin tempat pemain berdiri
      tram.boarded = false;
      const side = tram.rx >= 0 ? 1 : -1;
      const [x, z] = toWorld(side * (TRAM.halfWidth + 1), tram.rz, ox, oz, a);
      return { riding: false, pos: [x, z] };
    }
  }

  if (!tram.boarded) return { riding: false, pos: null };

  // Pemain bisa berjalan di dalam kabin
  if (want) {
    const s = TRAM.walkSpeed * dt;
    const dlx = (want[0] * Math.cos(a) - want[1] * Math.sin(a)) * s;
    const dlz = (want[0] * Math.sin(a) + want[1] * Math.cos(a)) * s;

    const maxX = TRAM.halfWidth - TRAM.wall;
    tram.rx = Math.max(-maxX, Math.min(maxX, tram.rx + dlx));
    tram.rz = Math.max(-REAR + TRAM.wall, Math.min(FRONT - TRAM.wall, tram.rz + dlz));
  }

  const [x, z] = toWorld(tram.rx, tram.rz, ox, oz, a);
  return { riding: true, pos: [x, z] };
}

/** Pasang listener tombol E. Kembalikan fungsi untuk melepasnya. */
export function installTramKey(): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.code !== "KeyE" || e.repeat) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    tram.pending = true;
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}