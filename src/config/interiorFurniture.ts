import type { Box } from "@/config/buildings";

export interface InteriorSeat {
  id: string;
  x: number;
  y: number;
  z: number;
  /** Arah menghadap saat duduk (radian). Menghadap meja terdekat */
  rotationY: number;
}

/** Titik duduk di Kantor Enuma (koordinat interior) */
export const ENUMA_SEATS: InteriorSeat[] = [
  { id: "Kursi.Anang", x: 3.75, y: 0, z: -1.12, rotationY: -1.65 },
  { id: "Kursi.Bintang", x: 1.45, y: 0, z: -1.17, rotationY: 1.62 },
  { id: "Kursi.Helga", x: 1.51, y: 0, z: -2.23, rotationY: 0.78 },
  { id: "Kursi.Juan", x: 1.45, y: 0, z: -0.16, rotationY: 2.36 },
  { id: "Kursi.Masnya1", x: 3.58, y: 0, z: 1.47, rotationY: -1.26 },
  { id: "Kursi.Masnya2", x: 3.58, y: 0, z: 2.44, rotationY: -2.09 },
  { id: "Kursi.Mbanya1", x: 1.41, y: 0, z: 2.95, rotationY: 2.37 },
  { id: "Kursi.Mbanya2", x: 1.41, y: 0, z: 2.19, rotationY: 1.9 },
  { id: "Kursi.Mbanya3", x: 1.41, y: 0, z: 1.42, rotationY: 1.22 },
  { id: "Kursi.Mbanya4", x: 1.41, y: 0, z: 0.71, rotationY: 0.78 },
  { id: "Kursi.Reza", x: 3.58, y: 0, z: -2.05, rotationY: -0.91 },
  { id: "Kursi.Rizky", x: 3.57, y: 0, z: -0.15, rotationY: -2.36 },
  { id: "KursiIoT", x: -2.35, y: 0, z: 4.41, rotationY: 0.06 },
  { id: "IoTKursi", x: 2.45, y: 0, z: 7.61, rotationY: 2.7 },
];

/**
 * Pengurangan (meter) di setiap sisi box furnitur untuk tabrakan karakter.
 * Ubah angka ini untuk mengecilkan semua box sekaligus. 0 = ukuran asli.
 */
export const FURNITURE_SHRINK = 0.5;

/** Mengecilkan box di setiap sisi. Box yang terlalu kecil dibiarkan tidak berubah. */
function shrinkBox(b: Box, amount: number): Box {
  const dx = b.maxX - b.minX;
  const dz = b.maxZ - b.minZ;
  const a = Math.min(amount, dx / 2 - 0.01, dz / 2 - 0.01);
  if (a <= 0) return b;
  return {
    minX: b.minX + a,
    maxX: b.maxX - a,
    minZ: b.minZ + a,
    maxZ: b.maxZ - a,
  };
}

/** Kotak solid asli untuk meja, lemari, rak, dan kursi (koordinat interior) */
const ENUMA_FURNITURE_BOXES_RAW: Box[] = [
  // Meja (tetap)
  { minX: 1.75, maxX: 3.25, minZ: -2.77, maxZ: 0.33 }, // Meja-AMIKOM-5
  { minX: 1.75, maxX: 3.25, minZ: 0.27, maxZ: 3.37 }, // Meja-AMIKOM-7-SMK2
  { minX: -2.84, maxX: -1.73, minZ: 4.85, maxZ: 5.45 }, // Meja.MasPutut
  { minX: 1.84, maxX: 2.94, minZ: 6.57, maxZ: 7.17 }, // Meja.MasPutut.001
  { minX: -4.17, maxX: -3.48, minZ: 1.18, maxZ: 2.54 }, // MejaMasGibran
  // Lemari & rak (tetap)
  { minX: 0.54, maxX: 2.2, minZ: 8.43, maxZ: 10.07 }, // FileCabinet
  { minX: -5.68, maxX: -4.04, minZ: 2.85, maxZ: 4.5 }, // FileCabinet.001
  { minX: -1.42, maxX: 0.22, minZ: 2.92, maxZ: 4.58 }, // FileCabinet.002
  { minX: 4.14, maxX: 4.64, minZ: 8.0, maxZ: 9.3 }, // Shelf.001
  { minX: 4.16, maxX: 4.66, minZ: 6.62, maxZ: 7.92 }, // Shelf.002
  // Kursi (kotak kecil, sebesar dudukan)
  { minX: 3.3, maxX: 3.86, minZ: -1.4, maxZ: -0.84 }, // Kursi.Anang
  { minX: 1.17, maxX: 1.73, minZ: -1.45, maxZ: -0.89 }, // Kursi.Bintang
  { minX: 1.23, maxX: 1.79, minZ: -2.51, maxZ: -1.95 }, // Kursi.Helga
  { minX: 1.17, maxX: 1.73, minZ: -0.44, maxZ: 0.12 }, // Kursi.Juan
  { minX: 3.3, maxX: 3.86, minZ: 1.19, maxZ: 1.75 }, // Kursi.Masnya1
  { minX: 3.3, maxX: 3.86, minZ: 2.16, maxZ: 2.72 }, // Kursi.Masnya2
  { minX: 1.13, maxX: 1.69, minZ: 2.67, maxZ: 3.23 }, // Kursi.Mbanya1
  { minX: 1.13, maxX: 1.69, minZ: 1.91, maxZ: 2.47 }, // Kursi.Mbanya2
  { minX: 1.13, maxX: 1.69, minZ: 1.14, maxZ: 1.7 }, // Kursi.Mbanya3
  { minX: 1.13, maxX: 1.69, minZ: 0.43, maxZ: 0.99 }, // Kursi.Mbanya4
  { minX: 3.3, maxX: 3.86, minZ: -2.33, maxZ: -1.77 }, // Kursi.Reza
  { minX: 3.29, maxX: 3.85, minZ: -0.43, maxZ: 0.13 }, // Kursi.Rizky
  { minX: -2.63, maxX: -2.07, minZ: 4.13, maxZ: 4.69 }, // KursiIoT
  { minX: 2.17, maxX: 2.73, minZ: 7.33, maxZ: 7.89 }, // IoTKursi
];

/** Kotak solid yang sudah dikecilkan, dipakai untuk tabrakan karakter */
export const ENUMA_FURNITURE_BOXES: Box[] = ENUMA_FURNITURE_BOXES_RAW.map(
  (b) => shrinkBox(b, FURNITURE_SHRINK),
);