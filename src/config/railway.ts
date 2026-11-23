// src/config/railway.ts

/** Konfigurasi rel & kereta. 1 unit ≈ 1 meter. */
export const RAIL = {
  halfX: 39.5,
  halfZ: 39.5,
  cornerRadius: 18,   // belokan lebar, supaya trem 10 m tidak menyerong
  arcSegments: 24,    // belokan halus
  gauge: 1.435,       // lebar rel standar Eropa (standard gauge)
  railY: 0.1,         // pusat tabung rel
  tieY: 0.04,         // tidak dipakai lagi
  tieSpacing: 1.2,    // tidak dipakai lagi
  trainSpeed: 7,
  carLength: 10.3,
  carGap: 0.3,
} as const;

export type PathPoint = { x: number; z: number };

export type TrackPath = {
  points: PathPoint[];
  /** Jarak kumulatif dari titik pertama ke setiap titik. */
  cum: number[];
  /** Panjang total jalur. */
  length: number;
};

/**
 * Membuat jalur tertutup berbentuk persegi dengan sudut membulat.
 * hx, hz = setengah ukuran persegi, r = radius sudut.
 * Garis lurus terbentuk otomatis di antara ujung busur yang bersebelahan.
 */
export function buildRoundedPath(
  hx: number,
  hz: number,
  r: number,
  steps: number = RAIL.arcSegments
): TrackPath {
  const cx = hx - r; // pusat busur di sumbu X
  const cz = hz - r; // pusat busur di sumbu Z

  // Empat busur, searah berlawanan jarum jam di bidang XZ
  const arcs = [
    { x: cx, z: cz, a0: 0 },
    { x: -cx, z: cz, a0: Math.PI / 2 },
    { x: -cx, z: -cz, a0: Math.PI },
    { x: cx, z: -cz, a0: (3 * Math.PI) / 2 },
  ];

  const points: PathPoint[] = [];
  for (const arc of arcs) {
    for (let i = 0; i <= steps; i++) {
      const a = arc.a0 + (Math.PI / 2) * (i / steps);
      points.push({
        x: arc.x + r * Math.cos(a),
        z: arc.z + r * Math.sin(a),
      });
    }
  }
  // Tutup loop kembali ke titik awal
  points.push({ ...points[0] });

  const cum: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dz = points[i].z - points[i - 1].z;
    cum.push(cum[i - 1] + Math.hypot(dx, dz));
  }

  return { points, cum, length: cum[cum.length - 1] };
}

/** Jalur pusat (tempat kereta berjalan). */
export const CENTER_PATH = buildRoundedPath(
  RAIL.halfX,
  RAIL.halfZ,
  RAIL.cornerRadius
);

/** Keliling loop dalam unit. */
export const LOOP_LENGTH = CENTER_PATH.length;

export const STATIONS = [
  { x: 0, z: 36, dwell: 4 }, // dwell = lama kereta berhenti (detik)
];

/** Jarak sepanjang jalur pusat untuk titik terdekat dari (x, z). */
function nearestArcLength(x: number, z: number): number {
  const { points, cum } = CENTER_PATH;
  let best = 0;
  let bestDist = Infinity;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len2 = dx * dx + dz * dz || 1;

    // Proyeksi (x, z) ke segmen a→b, dibatasi di antara 0 dan 1
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / len2));
    const px = a.x + dx * t;
    const pz = a.z + dz * t;
    const d = Math.hypot(x - px, z - pz);

    if (d < bestDist) {
      bestDist = d;
      best = cum[i] + Math.sqrt(len2) * t;
    }
  }

  return best;
}

/** Titik berhenti yang sudah dihitung posisinya di sepanjang jalur. */
export const STATION_STOPS = STATIONS.map((st) => ({
  s: nearestArcLength(st.x, st.z),
  dwell: st.dwell,
}));

console.log("STATION_STOPS", STATION_STOPS, "LOOP_LENGTH", LOOP_LENGTH);

export type LoopPoint = { x: number; z: number; angle: number };

/**
 * Posisi dan arah (rotation.y) di jarak `s` sepanjang jalur pusat.
 * `s` boleh lebih besar dari keliling atau negatif, akan dibungkus otomatis.
 */
export function loopPoint(s: number): LoopPoint {
  const { points, cum, length } = CENTER_PATH;
  const d = ((s % length) + length) % length;

  // Cari segmen yang memuat jarak d (binary search)
  let lo = 0;
  let hi = points.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cum[mid] <= d) lo = mid;
    else hi = mid - 1;
  }

  const a = points[lo];
  const b = points[lo + 1];
  const segLen = cum[lo + 1] - cum[lo] || 1;
  const t = (d - cum[lo]) / segLen;
  const dx = b.x - a.x;
  const dz = b.z - a.z;

  return {
    x: a.x + dx * t,
    z: a.z + dz * t,
    // Model kereta menghadap +Z; rotasi Y mengikuti arah segmen
    angle: Math.atan2(dx, dz),
  };
}