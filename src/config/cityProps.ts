import type { Box } from "@/config/buildings";

/** Kotak tabrakan untuk prop kota. hx/hz = setengah ukuran dasar objek (meter) */
const box = (x: number, z: number, hx: number, hz: number): Box => ({
  minX: x - hx,
  maxX: x + hx,
  minZ: z - hz,
  maxZ: z + hz,
});

/** Pohon: hanya batang yang bisa ditabrak, radius sebanding skala */
const tree = (x: number, z: number, scale: number) =>
  box(x, z, 0.35 * scale, 0.35 * scale);

/** Bangku panjang 2,2 m, lebar 0,8 m. Rotasi ±90° membuatnya menyamping */
const bench = (x: number, z: number, rotY: number) => {
  const sideways = Math.abs(Math.sin(rotY)) > 0.5;
  return sideways ? box(x, z, 0.4, 1.1) : box(x, z, 1.1, 0.4);
};

/** Tiang lampu / tiang tipis */
const pole = (x: number, z: number) => box(x, z, 0.15, 0.15);

/** Pot tanaman 1,4 x 0,7 m */
const planter = (x: number, z: number) => box(x, z, 0.7, 0.35);

/** Pot/tanaman di sepanjang deretan */
const planters = (xs: number[], z: number) => xs.map((x) => planter(x, z));

export const SOLID_PROP_BOXES: Box[] = [
  // ===== Pohon =====
  tree(-39, -14, 2.2),
  tree(-39, 8, 2.0),
  tree(39, -12, 2.3),
  tree(39, 8, 2.1),
  tree(-8, -21, 2.0),
  tree(6, -21, 1.8),
  tree(24, -21, 2.1),
  tree(-25, 29, 2.1),
  tree(-26, 36, 1.9),
  tree(-6, 29, 2.0),
  tree(-6, 36, 1.8),

  // ===== Pot tanaman =====
  ...planters([-22, -19, -13, -10], 26.6),
  ...planters([-34, -12, -6, 6, 26, 34], 17.3),
  ...planters([-34, -18, -6, 10, 22, 34], -25.3),

  // ===== Bangku =====
  bench(-8, 13.5, Math.PI),
  bench(6, 13.5, Math.PI),
  bench(14, 13.5, Math.PI),
  bench(28, 13.5, Math.PI),
  bench(6, -23, 0),
  bench(-16, 28.4, 0),
  bench(-16, 36.6, Math.PI),
  bench(-20.1, 32.5, Math.PI / 2),
  bench(-11.9, 32.5, -Math.PI / 2),

  // ===== Lampu jalan & tiang kecil =====
  pole(-32, 13.5),
  pole(-4, 13.5),
  pole(24, 13.5),
  pole(-32, -23.5),
  pole(-4, -23.5),
  pole(24, -23.5),
  pole(-1.9, 28),
  pole(1.9, 28),
  pole(-1.9, 33),
  pole(1.9, 33),
  pole(-1.9, 38),
  pole(1.9, 38),
  pole(3.6, 13.5), // papan petunjuk

  // ===== Lampu lalu lintas (tiang + kepala lampu) =====
  // rotY 0: kepala di -Z dari tiang; rotY π: kepala di +Z
  pole(-3.8, 26.2),
  box(-3.8, 26.2 - 1.55, 0.25, 0.25),
  pole(3.8, 17.8),
  box(3.8, 17.8 + 1.55, 0.25, 0.25),
  pole(-3.8, -25.8),
  box(-3.8, -25.8 - 1.55, 0.25, 0.25),
  pole(3.8, -34.2),
  box(3.8, -34.2 + 1.55, 0.25, 0.25),

  // ===== Penyeberangan (tiang) =====
  pole(-2.8, 17.8),
  pole(2.8, 26.2),

  // ===== Mobil parkir (panjang sejajar Z) =====
  box(14, 30, 0.95, 2.0),
  box(22, 30, 0.95, 2.0),
  box(28, 30, 0.95, 2.0),

  // ===== Meja kafe bermayung =====
  box(35.5, 12.2, 0.45, 0.45),
  box(-8.2, 34.5, 0.45, 0.45),

  // ===== Air mancur taman (tepi bundar didekati persegi) =====
  box(-16, 32.5, 1.9, 1.9),

  // ===== Halte bus (dua halte) =====
  box(-22, 17.2, 2.2, 0.9),
  box(16, 17.2, 2.2, 0.9),

  // ===== Parkir sepeda (setelah dipindah ke x 19,5) =====
  box(-19.5, 13.5, 1.1, 0.4),
  box(19.5, 13.5, 1.1, 0.4),

  // ===== Menara jam & hologram & papan reklame =====
  box(-32, 32.5, 1.2, 1.2),
  box(4.6, 31, 0.8, 0.8),
  box(20.5, 15.8, 1.6, 0.3),

  // ===== Perlengkapan jalan (StreetProps) =====
  box(-15, 13.6, 0.5, 0.5),
  box(8, 13.6, 0.5, 0.5),
  box(31, 13.6, 0.5, 0.5),
];