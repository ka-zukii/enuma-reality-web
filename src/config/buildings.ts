export type Vec3 = [number, number, number];

/** Kotak collision dua dimensi di bidang XZ */
export interface Box {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface Footprint {
  x: number;
  z: number;
  w: number;
  d: number;
}

/** Radius tubuh avatar, dipakai untuk jarak minimum ke collision */
export const PLAYER_RADIUS = 0.45;

// Harus sama dengan BUILDING_KEYS di backend (src/config/buildings.ts)
export const BUILDING_KEYS = [
  "enuma-hq",
  "indomart",
  "warung-madura",
  "lunara-cafe",
] as const;
export type BuildingKey = (typeof BUILDING_KEYS)[number];

/** Info gedung yang tampil di panel detail kota. `buildingKey` dipakai untuk tombol "Masuk" */
export interface BuildingInfo {
  buildingKey: BuildingKey;
  name: string;
  category: string;
  desc: string;
  status: string;
}

export interface InteriorBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Tangga yang bisa dinaiki. `path` adalah garis tengah tangga dalam koordinat
 * ruangan [x, z], dari ujung bawah (tinggi 0) sampai ujung atas (tinggi `height`).
 * Tinggi di dalam `box` dihitung dari posisi terdekat di sepanjang `path`.
 */
export interface StairsConfig {
  box: Box;
  path: [number, number][];
  height: number;
}

export interface InteriorConfig {
  name: string;
  accent: string;
  /** Path file .glb di folder public/buildings */
  model: string;
  /**
   * Titik tengah model (koordinat asli di dalam file .glb, sumbu X dan Z).
   * Model digeser agar titik ini jatuh di (0, 0) sebelum diputar.
   */
  modelCenter: Vec3;
  /** Rotasi model terhadap sumbu Y (radian), agar sisi pintu menghadap +Z */
  modelRotationY: number;
  /** Batas area yang bisa dijelajahi avatar (sudah dikurangi margin dinding) */
  bounds: InteriorBounds;
  spawn: Vec3;
  exit: { position: Vec3; radius: number };
  /** Benda di dalam ruangan yang tidak bisa ditembus (meja, rak, dll) */
  obstacles: Box[];
  /** Tangga ke lantai atas, jika ada */
  stairs?: StairsConfig;
  buildingKey: BuildingKey;
}

export interface BuildingConfig {
  key: BuildingKey;
  name: string;
  /** Area fisik gedung di eksterior, dipakai untuk collision */
  footprint: Footprint;
  /** Posisi pintu di eksterior, juga titik keluar dari interior */
  entrance: Vec3;
  /** Jarak untuk memunculkan popup masuk */
  entranceRadius: number;
  interior: InteriorConfig;
}

export function boxFromFootprint(f: Footprint): Box {
  return {
    minX: f.x - f.w / 2,
    maxX: f.x + f.w / 2,
    minZ: f.z - f.d / 2,
    maxZ: f.z + f.d / 2,
  };
}

const HALF_PI = Math.PI / 2;

/**
 * Empat gedung di baris utama (z = -4).
 * Jarak antar gedung ±2 satuan, dan promenade tengah (x 3.6 s.d. 8.4) tetap kosong.
 *
 * Nilai `bounds`, `spawn`, dan `exit` dihitung dari ukuran model .glb.
 * Nilai yang ditandai TODO perlu dicek ulang setelah model dilihat di browser.
 */
export const BUILDINGS: BuildingConfig[] = [
  {
    key: "warung-madura",
    name: "Warung Madura",
    footprint: { x: -30.85, z: 3.4, w: 8.3, d: 10.3 },
    entrance: [-30.85, 0, 9.15],
    entranceRadius: 3,
    interior: {
      name: "Warung Madura",
      buildingKey: "warung-madura",
      accent: "#f97316",
      model: "/buildings/warung-madura-modern.glb",
      // Ukuran model ±8.3 x 10.3 m, pintu di sisi depan (z ≈ -0.5 asli)
      modelCenter: [0.33, 0, -5.54],
      modelRotationY: 0,
      bounds: { minX: -3.85, maxX: 3.85, minZ: -4.85, maxZ: 4.85 },
      spawn: [0.46, 0, 3.5],
      exit: { position: [0.46, 0, 5.6], radius: 1.0 },
      obstacles: [
        // Dinding (dari mesh Wall di .glb, sudah dipotong di pintu)
        { minX: -4.15, maxX: -4.0, minZ: -5.17, maxZ: 5.13 },
        { minX: -4.15, maxX: -1.05, minZ: 4.98, maxZ: 5.13 },
        { minX: -4.15, maxX: 4.15, minZ: -5.17, maxZ: -5.02 },
        // Sekat tengah, dibuka celah 2 m di tengah agar ruangan belakang bisa dimasuki
        { minX: -4.0, maxX: -1.0, minZ: 0.38, maxZ: 0.53 },
        { minX: 1.0, maxX: 4.0, minZ: 0.38, maxZ: 0.53 },
        { minX: 1.05, maxX: 4.15, minZ: 4.98, maxZ: 5.13 },
        { minX: 4.0, maxX: 4.15, minZ: -5.17, maxZ: 5.13 },
      ],
    },
  },
  {
    key: "indomart",
    name: "Indomart",
    footprint: { x: -12.65, z: -4, w: 20.1, d: 25.1 },
    entrance: [-12.65, 0, 9.15],
    entranceRadius: 3,
    interior: {
      name: "Indomart",
      accent: "#dc2626",
      buildingKey: "indomart",
      model: "/buildings/indomaret.glb",
      // Ukuran asli ±30 x 20 m. Fasad (pintu geser) ada di sisi timur (+X),
      // sehingga model diputar -90° agar pintu menghadap +Z.
      modelCenter: [-5.14, 0, -0.04],
      modelRotationY: -HALF_PI,
      bounds: { minX: -9.73, maxX: 9.73, minZ: -14.75, maxZ: 14.75 },
      spawn: [-0.9, 0, 12.5],
      exit: { position: [-0.9, 0, 15.5], radius: 1.0 },
      obstacles: [
        // Dinding (dari mesh Wall di .glb, sudah dipotong di pintu)
        { minX: -9.97, maxX: -9.82, minZ: -14.98, maxZ: 15.02 },
        { minX: -9.97, maxX: -2.0, minZ: 14.87, maxZ: 15.02 },
        { minX: -9.97, maxX: 10.03, minZ: -14.98, maxZ: -14.83 },
        { minX: -9.82, maxX: -6.02, minZ: -10.0, maxZ: -9.85 },
        { minX: -5.95, maxX: -5.8, minZ: -14.83, maxZ: -10.85 },
        { minX: -5.73, maxX: 6.32, minZ: -10.0, maxZ: -9.85 },
        { minX: 2.1, maxX: 10.03, minZ: 14.87, maxZ: 15.02 },
        { minX: 4.73, maxX: 4.88, minZ: -14.83, maxZ: -12.32 },
        { minX: 4.73, maxX: 4.88, minZ: -12.47, maxZ: -10.0 },
        { minX: 4.73, maxX: 6.45, minZ: -12.47, maxZ: -12.32 },
        { minX: 7.3, maxX: 7.45, minZ: -14.83, maxZ: -12.54 },
        { minX: 7.35, maxX: 7.41, minZ: -12.47, maxZ: -12.32 },
        { minX: 8.31, maxX: 9.88, minZ: -12.47, maxZ: -12.32 },
        { minX: 8.42, maxX: 9.88, minZ: -10.0, maxZ: -9.85 },
        { minX: 9.88, maxX: 10.03, minZ: -14.98, maxZ: 15.02 },
      ],
    },
  },
  {
    key: "enuma-hq",
    name: "Kantor Enuma Technology",
    footprint: { x: 8.7, z: -4, w: 14.6, d: 25.1 },
    entrance: [8.7, 0, 9.15],
    entranceRadius: 3,
    interior: {
      name: "Kantor Enuma Technology",
      accent: "#2563eb",
      buildingKey: "enuma-hq",
      model: "/buildings/enuma_kantor.glb",
      // Pintu depan ada di dinding barat (x ≈ -9,81), di koordinat asli sekitar
      // (-9,81; -0,52), dengan dua jendela kaca di tiap sisi pintu. Model diputar
      // +90° agar dinding barat menghadap +Z. Ini perkiraan dari posisi node.
      modelCenter: [-0.12, 0, 0.2],
      modelRotationY: Math.PI / 2,
      bounds: { minX: -4.5, maxX: 4.5, minZ: -9.4, maxZ: 9.4 },
      spawn: [-0.72, 0, 8.2],
      exit: { position: [-0.72, 0, 10.2], radius: 1.0 },
      obstacles: [
        // Dinding (dari mesh Wall di .glb, sudah dipotong di pintu)
        { minX: -5.36, maxX: -5.21, minZ: -11.23, maxZ: -5.08 },
        { minX: -5.36, maxX: -5.21, minZ: -5.23, maxZ: 9.62 },
        { minX: -5.36, maxX: -5.21, minZ: 9.62, maxZ: 9.77 },
        { minX: -5.36, maxX: -5.21, minZ: 9.64, maxZ: 13.64 },
        { minX: -5.36, maxX: -0.16, minZ: -5.23, maxZ: -5.08 },
        { minX: -5.21, maxX: -1.23, minZ: 9.62, maxZ: 9.77 },
        { minX: -5.21, maxX: -0.33, minZ: -0.08, maxZ: 0.07 },
        { minX: -5.21, maxX: -0.26, minZ: 5.43, maxZ: 5.59 },
        { minX: -0.26, maxX: -0.11, minZ: -5.01, maxZ: -4.53 },
        { minX: -0.26, maxX: -0.11, minZ: -4.53, maxZ: -1.08 },
        { minX: -0.26, maxX: -0.11, minZ: -0.07, maxZ: 0.1 },
        { minX: -0.26, maxX: -0.11, minZ: 1.12, maxZ: 6.4 },
        // Sekat lobi dibuka di z 6,69 s.d. 7,9 agar bisa lewat ke ruangan dalam
        { minX: -0.26, maxX: -0.11, minZ: 7.9, maxZ: 9.55 },
        { minX: -0.26, maxX: -0.1, minZ: 6.47, maxZ: 6.62 },
        { minX: -0.22, maxX: 4.79, minZ: 9.62, maxZ: 9.77 },
        { minX: 0.86, maxX: 4.79, minZ: -5.23, maxZ: -5.08 },
        { minX: 0.92, maxX: 4.57, minZ: 6.47, maxZ: 6.62 },
        { minX: 2.62, maxX: 2.78, minZ: -11.08, maxZ: -10.74 },
        { minX: 2.64, maxX: 2.79, minZ: -8.57, maxZ: -8.05 },
        { minX: 2.64, maxX: 4.64, minZ: -8.2, maxZ: -8.05 },
        { minX: 2.86, maxX: 4.64, minZ: -9.7, maxZ: -9.55 },
        { minX: 4.64, maxX: 4.79, minZ: -11.23, maxZ: -5.23 },
        { minX: 4.64, maxX: 4.79, minZ: -5.23, maxZ: 5.51 },
        { minX: 4.64, maxX: 4.79, minZ: 6.52, maxZ: 9.77 },
      ],
    },
  },
  {
    key: "lunara-cafe",
    name: "Lunara Cafe",
    footprint: { x: 27.5, z: -4, w: 15, d: 25.1 },
    entrance: [27.5, 0, 9.15],
    entranceRadius: 3,
    interior: {
      name: "Lunara Cafe",
      accent: "#f472b6",
      buildingKey: "lunara-cafe",
      model: "/buildings/cafe.glb",
      // Ukuran ±25 x 15 m. Fasad ada di sisi timur (+X), model diputar -90°.
      // TODO: model punya lantai dua (tinggi ±8 m); tinggi kamera mungkin perlu disesuaikan.
      modelCenter: [-12.5, 0, -0.5],
      modelRotationY: -HALF_PI,
      bounds: { minX: -7.2, maxX: 7.2, minZ: -12.23, maxZ: 12.23 },
      spawn: [-0.46, 0, 10.5],
      exit: { position: [-0.46, 0, 12.9], radius: 1.0 },
      obstacles: [
        // Dinding (dari mesh Wall di .glb, sudah dipotong di pintu)
        { minX: -7.49, maxX: -7.34, minZ: -12.52, maxZ: 12.48 },
        { minX: -7.49, maxX: -1.04, minZ: 12.33, maxZ: 12.48 },
        { minX: -7.49, maxX: 7.51, minZ: -12.52, maxZ: -12.37 },
        { minX: -7.34, maxX: -6.55, minZ: -7.0, maxZ: -6.85 },
        { minX: -7.34, maxX: -6.52, minZ: -11.0, maxZ: -10.85 },
        { minX: -7.34, maxX: -3.49, minZ: -9.07, maxZ: -8.92 },
        { minX: -7.34, maxX: -3.34, minZ: -5.56, maxZ: -5.41 },
        { minX: -7.34, maxX: 4.86, minZ: -5.43, maxZ: -5.28 },
        { minX: -5.56, maxX: -5.4, minZ: -6.78, maxZ: -5.56 },
        { minX: -5.55, maxX: -5.4, minZ: -12.37, maxZ: -11.07 },
        { minX: -5.53, maxX: -5.46, minZ: -7.0, maxZ: -6.85 },
        { minX: -5.5, maxX: -5.45, minZ: -11.0, maxZ: -10.85 },
        { minX: -4.44, maxX: -3.49, minZ: -7.0, maxZ: -6.85 },
        { minX: -4.43, maxX: -3.49, minZ: -11.0, maxZ: -10.85 },
        { minX: -3.49, maxX: -3.34, minZ: -12.37, maxZ: -10.47 },
        { minX: -3.49, maxX: -3.34, minZ: -9.46, maxZ: -8.46 },
        { minX: -3.49, maxX: -3.34, minZ: -7.45, maxZ: -5.41 },
        { minX: 1.06, maxX: 7.51, minZ: 12.33, maxZ: 12.48 },
        { minX: 4.21, maxX: 4.36, minZ: -12.37, maxZ: -7.32 },
        { minX: 4.21, maxX: 7.36, minZ: -7.47, maxZ: -7.32 },
        { minX: 6.96, maxX: 7.36, minZ: -5.43, maxZ: -5.28 },
        { minX: 7.36, maxX: 7.51, minZ: -12.52, maxZ: 12.48 },
      ],
      // Tangga di sisi barat: lurus ke +Z dulu, lalu belok kiri ke +X menuju lantai dua.
      // Koordinat ini perkiraan, sesuaikan jika posisi naik/belok belum pas.
      stairs: {
        box: { minX: -7.32, maxX: -4.05, minZ: -5.44, maxZ: -2.37 },
        path: [
          [-6.5, -4.8],
          [-6.5, -2.6],
          [-4.3, -2.6],
        ],
        height: 4.0,
      },
    },
  },
];

/** Semua gedung di eksterior yang tidak bisa ditembus */
export const CITY_OBSTACLES: Box[] = BUILDINGS.map((b) =>
  boxFromFootprint(b.footprint),
);

export function getBuilding(
  key: string | null | undefined,
): BuildingConfig | undefined {
  if (!key) return undefined;
  return BUILDINGS.find((b) => b.key === key);
}