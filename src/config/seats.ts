export interface SeatConfig {
  id: string;
  x: number;
  y: number;
  z: number;
  /** Arah menghadap karakter saat duduk (radian) */
  rotationY: number;
}

export const CITY_SEATS: SeatConfig[] = [
  // Bangku trotoar selatan (menghadap -Z, digeser sedikit ke depan agar punggung tidak menembus sandaran)
  { id: "bench-s1", x: -8, y: 0, z: 13.4, rotationY: Math.PI },
  { id: "bench-s2", x: 6, y: 0, z: 13.4, rotationY: Math.PI },
  { id: "bench-s3", x: 14, y: 0, z: 13.4, rotationY: Math.PI },
  { id: "bench-s4", x: 28, y: 0, z: 13.4, rotationY: Math.PI },
  // Bangku trotoar utara (menghadap +Z)
  { id: "bench-n1", x: 6, y: 0, z: -22.9, rotationY: 0 },

  // 4 bangku taman air mancur
  { id: "park-n", x: -16, y: 0, z: 28.5, rotationY: 0 },
  { id: "park-s", x: -16, y: 0, z: 36.5, rotationY: Math.PI },
  { id: "park-w", x: -20.0, y: 0, z: 32.5, rotationY: Math.PI / 2 },
  { id: "park-e", x: -12.0, y: 0, z: 32.5, rotationY: -Math.PI / 2 },

  // Kursi meja kafe outdoor
  { id: "cafe-1a", x: 34.72, y: 0, z: 12.2, rotationY: Math.PI / 2 },
  { id: "cafe-1b", x: 36.28, y: 0, z: 12.2, rotationY: -Math.PI / 2 },
  { id: "cafe-2a", x: -8.98, y: 0, z: 34.5, rotationY: Math.PI / 2 },
  { id: "cafe-2b", x: -7.42, y: 0, z: 34.5, rotationY: -Math.PI / 2 },
];

export function findNearestSeat(
  x: number,
  z: number,
  seats: SeatConfig[] = CITY_SEATS,
  maxDist = 1.75,
): SeatConfig | null {
  let best: SeatConfig | null = null;
  let bestD = maxDist;
  for (const s of seats) {
    const d = Math.hypot(x - s.x, z - s.z);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}
