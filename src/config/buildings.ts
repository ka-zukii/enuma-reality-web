import { SOLID_PROP_BOXES } from "@/config/cityProps";
import { ENUMA_FURNITURE_BOXES, ENUMA_SEATS } from "@/config/interiorFurniture";
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

/** Titik di path tangga: [x, z] atau [x, z, tinggi] */
export type StairPathPoint = [number, number] | [number, number, number];

/**
 * Tangga yang bisa dinaiki.
 *
 * `path` adalah garis tengah tangga dalam koordinat ruangan [x, z, tinggi?].
 * - Jika setiap titik punya tinggi, tinggi lantai diinterpolasi antar titik
 *   (bordes datar = dua titik dengan tinggi sama).
 * - Jika tidak, tinggi naik rata dari 0 sampai `height` sepanjang path.
 *
 * `zones` (opsional) adalah footprint tangga yang sebenarnya (gabungan kotak, mis. tangga bentuk U/L).
 * `gates` (opsional) adalah satu-satunya tempat tangga boleh dimasuki dan ditinggalkan.
 * Jika `gates` diisi, sisi tangga dan kolong tangga tidak bisa ditembus.
 */
export interface StairsConfig {
  /** Kotak pembatas seluruh tangga. Dipakai NPC untuk menghindar, dan sebagai footprint bila `zones` kosong */
  box: Box;
  path: StairPathPoint[];
  height: number;
  zones?: Box[];
  gates?: { floor: 0 | 1; box: Box }[];
}

/** Pintu yang bisa dibuka/ditutup dengan tombol E */
export interface InteriorDoor {
  /** Id unik pintu di gedung ini */
  id: string;
  /** Nama mesh daun pintu & knob di file .glb (boleh dengan spasi dan titik) */
  parts: string[];
  /** Engsel dalam koordinat interior (X dan Z, Y diabaikan) */
  hinge: Vec3;
  /** Pusat pintu, dipakai untuk jarak tekan E */
  center: Vec3;
  /** Jarak maksimal karakter dari pusat pintu agar bisa tekan E */
  reach: number;
  /** Sudut buka (radian). Positif = pintu terbuka ke dalam ruangan */
  openAngle: number;
  /** Penghalang saat pintu tertutup */
  blocker: Box;
  /** Potongan dinding statis yang harus dilubangi saat pintu terbuka (opsional) */
  wallTarget?: Box;
  /** Pengganti potongan dinding itu saat pintu terbuka */
  wallOpen?: Box[];
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
  /** Benda di dalam ruangan yang tidak bisa ditembus (meja, rak, dll). Untuk lantai bawah */
  obstacles: Box[];
  /** Penghalang khusus lantai atas. Kosong = lantai atas memakai `obstacles` yang sama */
  upperObstacles?: Box[];
  /** Titik duduk di dalam gedung (opsional) */
  seats?: { id: string; x: number; y: number; z: number; rotationY: number }[];  
  /** Pintu interaktif (opsional) */
  doors?: InteriorDoor[]; 
  /** Pintu keluar tambahan selain `exit` utama (opsional) */
  extraExits?: { position: Vec3; radius: number }[];  
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
      bounds: { minX: -5.0, maxX: 8.5, minZ: -10.8, maxZ: 13.0 },
      spawn: [-0.72, 0, 8.2],
      exit: { position: [-0.72, 0, 10.2], radius: 1.0 },
      seats: ENUMA_SEATS,
      extraExits: [{ position: [6.2, 0, 13.0], radius: 1.2 }],      
      doors: [
        {
          id: "lobi",
          parts: ["Door Slab", "Door Slab Knob"],
          hinge: [0.03, 0, 6.54],
          center: [0.41, 0, 6.54],
          reach: 2.0,
          openAngle: -Math.PI / 2,
          blocker: { minX: 0.02, maxX: 0.8, minZ: 6.45, maxZ: 6.63 },
          wallTarget: { minX: -0.26, maxX: 4.64, minZ: 6.65, maxZ: 6.8 },
          wallOpen: [
            { minX: -0.26, maxX: -0.07, minZ: 6.65, maxZ: 6.8 },
            { minX: 0.89, maxX: 4.64, minZ: 6.65, maxZ: 6.8 },
          ],
        },
        {
          id: "keluar",
          parts: ["Door Slab.004", "Door Slab Knob.004"],
          hinge: [-1.1, 0, 9.69],
          center: [-0.72, 0, 9.69],
          reach: 2.0,
          openAngle: Math.PI / 2,
          blocker: { minX: -1.12, maxX: -0.32, minZ: 9.55, maxZ: 9.85 },
        },
        {
          id: "tengah-1",
          parts: ["Door Slab.001", "Door Slab Knob.001"],
          hinge: [-0.18, 0, 0.99],
          center: [-0.18, 0, 0.61],
          reach: 2.0,
          openAngle: Math.PI / 2,
          blocker: { minX: -0.21, maxX: -0.16, minZ: 0.23, maxZ: 0.99 },
        },
        {
          id: "tengah-2",
          parts: ["Door Slab.002", "Door Slab Knob.002"],
          hinge: [-0.18, 0, -0.19],
          center: [-0.18, 0, -0.57],
          reach: 2.0,
          openAngle: Math.PI / 2,
          blocker: { minX: -0.21, maxX: -0.16, minZ: -0.95, maxZ: -0.19 },
        },
        {
          id: "melintang",
          parts: ["Door Slab.003", "Door Slab Knob.003"],
          hinge: [0.73, 0, -5.15],
          center: [0.35, 0, -5.15],
          reach: 2.0,
          openAngle: Math.PI / 2,
          blocker: { minX: -0.03, maxX: 0.73, minZ: -5.18, maxZ: -5.12 },
        },
        {
          id: "sayap-kanan",
          parts: ["Door Slab.005", "Door Slab Knob.005"],
          hinge: [4.71, 0, 6.39],
          center: [4.71, 0, 6.01],
          reach: 2.0,
          openAngle: Math.PI / 2,
          blocker: { minX: 4.69, maxX: 4.74, minZ: 5.63, maxZ: 6.39 },
        },
        {
          id: "belakang-kanan",
          parts: ["Door Slab.006", "Door Slab Knob.006"],
          hinge: [7.03, 0, -6.91],
          center: [7.03, 0, -6.53],
          reach: 2.0,
          openAngle: Math.PI / 2,
          blocker: { minX: 6.95, maxX: 7.1, minZ: -6.91, maxZ: -6.15 },
          wallTarget: { minX: 6.95, maxX: 7.1, minZ: -11.07, maxZ: -5.07 },
          wallOpen: [
            { minX: 6.95, maxX: 7.1, minZ: -11.07, maxZ: -7.01 },
            { minX: 6.95, maxX: 7.1, minZ: -6.05, maxZ: -5.07 },
          ],
        },
        {
          id: "belakang-1",
          parts: ["Door Slab.007", "Door Slab Knob.007"],
          hinge: [2.7, 0, -9.85],
          center: [2.7, 0, -10.23],
          reach: 2.0,
          openAngle: -Math.PI / 2,
          blocker: { minX: 2.62, maxX: 2.81, minZ: -10.61, maxZ: -9.85 },
        },
        {
          id: "belakang-2",
          parts: ["Door Slab.008", "Door Slab Knob.008"],
          hinge: [2.71, 0, -9.45],
          center: [2.71, 0, -9.07],
          reach: 2.0,
          openAngle: Math.PI / 2,
          blocker: { minX: 2.62, maxX: 2.81, minZ: -9.45, maxZ: -8.69 },
        },
      ],
      obstacles: [
        ...ENUMA_FURNITURE_BOXES,        
        // Dinding luar (barat, utara, timur, teras depan)
        { minX: -5.36, maxX: -5.21, minZ: -11.23, maxZ: 13.64 },
        { minX: -5.21, maxX: 8.94, minZ: -11.23, maxZ: -11.07 },
        { minX: 8.79, maxX: 8.94, minZ: -11.22, maxZ: 13.42 },
        { minX: -5.36, maxX: 4.79, minZ: 13.48, maxZ: 13.64 },
        // Dinding depan selatan (pintu masuk utama di x -1.42 s.d. -0.02 terbuka)
        { minX: -5.21, maxX: -1.42, minZ: 9.62, maxZ: 9.77 },
        { minX: -0.02, maxX: 4.79, minZ: 9.62, maxZ: 9.77 },
        // Sekat lobi & ruang kanan-depan (padat di z 6.65 s.d. 9.62; koridor z 5.25 s.d. 6.65 terbuka)
        { minX: -0.26, maxX: -0.11, minZ: 6.65, maxZ: 9.62 },
        { minX: -0.26, maxX: 4.64, minZ: 6.65, maxZ: 6.8 },
        // Tulang tengah (terbuka di z 5.25 s.d. 6.65, z 0.10 s.d. 1.40, dan z -1.40 s.d. -0.10)
        { minX: -0.26, maxX: -0.11, minZ: 1.4, maxZ: 5.25 },
        { minX: -0.26, maxX: -0.11, minZ: -5.08, maxZ: -1.4 },
        // Sekat ruangan sisi kiri
        { minX: -5.21, maxX: -0.26, minZ: 5.25, maxZ: 5.43 },
        { minX: -5.21, maxX: -0.26, minZ: -0.08, maxZ: 0.07 },
        // Sekat melintang belakang (pintu di x -0.35 s.d. 1.05 terbuka)
        { minX: -5.21, maxX: -0.35, minZ: -5.23, maxZ: -5.08 },
        { minX: 1.05, maxX: 4.64, minZ: -5.23, maxZ: -5.08 },
        // Dinding pemisah sayap kanan (terbuka di z 5.25 s.d. 6.65)
        { minX: 4.64, maxX: 4.79, minZ: -11.07, maxZ: 5.25 },
        { minX: 4.64, maxX: 4.79, minZ: 6.65, maxZ: 9.77 },
        // Ruangan kecil belakang tengah
        { minX: 2.64, maxX: 4.64, minZ: -9.7, maxZ: -9.55 },
        { minX: 2.64, maxX: 4.64, minZ: -8.2, maxZ: -8.05 },
        // Ruangan belakang sayap kanan
        { minX: 6.95, maxX: 7.1, minZ: -11.07, maxZ: -5.07 },
        { minX: 6.95, maxX: 8.79, minZ: -5.22, maxZ: -5.07 },
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
        { minX: 7.36, maxX: 7.51, minZ: -12.52, maxZ: 12.48 },
        // Coffee bar (mesh CoffeeBar)
        { minX: 1.28, maxX: 4.2, minZ: -8.79, maxZ: -7.34 },
        // Meja lantai bawah (mesh Meja1 s.d. Meja14)
        { minX: 4.83, maxX: 5.63, minZ: 11.39, maxZ: 12.19 },
        { minX: 2.18, maxX: 2.98, minZ: 11.39, maxZ: 12.19 },
        { minX: -3.22, maxX: -2.42, minZ: 11.39, maxZ: 12.19 },
        { minX: -5.88, maxX: -5.08, minZ: 11.39, maxZ: 12.19 },
        { minX: 4.52, maxX: 5.32, minZ: 7.89, maxZ: 8.69 },
        { minX: 1.73, maxX: 2.53, minZ: 6.64, maxZ: 7.44 },
        { minX: -5.88, maxX: -5.08, minZ: 8.22, maxZ: 9.02 },
        { minX: -3.17, maxX: -2.37, minZ: 6.64, maxZ: 7.44 },
        { minX: 3.96, maxX: 4.76, minZ: 3.43, maxZ: 4.23 },
        { minX: -3.66, maxX: -2.86, minZ: 3.01, maxZ: 3.81 },
        { minX: -6.55, maxX: -5.75, minZ: 4.22, maxZ: 5.02 },
        { minX: 5.21, maxX: 6.01, minZ: -1.96, maxZ: -1.16 },
        { minX: 1.99, maxX: 2.79, minZ: -0.23, maxZ: 0.57 },
        { minX: -5.4, maxX: -4.6, minZ: -0.13, maxZ: 0.67 },
      ],
      // Penghalang lantai dua. Dinding pemisah di z = -5.4 (mesh Wall.017) hanya ada di lantai ini,
      // dengan celah pintu di x 4.91 s.d. 6.91.
      upperObstacles: [
        { minX: 7.36, maxX: 7.51, minZ: -12.52, maxZ: 12.48 },
        { minX: -7.49, maxX: 7.51, minZ: -12.52, maxZ: -12.37 },
        { minX: -7.49, maxX: -7.34, minZ: -12.52, maxZ: 12.48 },
        // Pagar balkon depan (Railing.002, .003, .005)
        { minX: -7.34, maxX: 7.36, minZ: 12.35, maxZ: 12.41 },
        // Dinding pemisah ruang belakang (Wall.017), celah pintu 4.91 s.d. 6.91
        { minX: -7.34, maxX: 4.91, minZ: -5.43, maxZ: -5.28 },
        { minX: 6.91, maxX: 7.36, minZ: -5.43, maxZ: -5.28 },
        // Pagar lubang tangga (Railing.004 dan Railing.007)
        { minX: -6.06, maxX: -3.61, minZ: -4.24, maxZ: -4.2 },
        { minX: -3.62, maxX: -3.57, minZ: -5.21, maxZ: -4.21 },
        // Meja lantai atas (mesh Meja6.001 s.d. Meja6.018)
        { minX: 1.75, maxX: 2.55, minZ: 8.3, maxZ: 9.1 },
        { minX: -3.17, maxX: -2.08, minZ: 7.38, maxZ: 8.47 },
        { minX: -5.75, maxX: -4.95, minZ: -7.81, maxZ: -7.01 },
        { minX: 0.07, maxX: 0.87, minZ: 5.2, maxZ: 6 },
        { minX: -2.77, maxX: -1.97, minZ: -0.17, maxZ: 0.63 },
        { minX: 3.25, maxX: 4.05, minZ: -1.08, maxZ: -0.28 },
        { minX: -4.08, maxX: -3.28, minZ: 3.58, maxZ: 4.38 },
        { minX: 1.21, maxX: 2.01, minZ: 1.2, maxZ: 2 },
        { minX: 3.5, maxX: 4.63, minZ: 4.55, maxZ: 5.68 },
        { minX: -5.81, maxX: -4.83, minZ: -11.13, maxZ: -10.15 },
        { minX: -3.77, maxX: -2.97, minZ: 11.09, maxZ: 11.89 },
        { minX: -0.37, maxX: 0.43, minZ: 11.09, maxZ: 11.89 },
        { minX: 3.22, maxX: 4.02, minZ: 11.09, maxZ: 11.89 },
        { minX: -1.8, maxX: -0.69, minZ: -11.18, maxZ: -10.07 },
        { minX: -1.67, maxX: -0.81, minZ: -7.24, maxZ: -6.37 },
        { minX: 1.94, maxX: 3.06, minZ: -7.34, maxZ: -6.23 },
        { minX: 1.94, maxX: 3.06, minZ: -10.57, maxZ: -9.46 },
        { minX: 5.41, maxX: 6.53, minZ: -10.57, maxZ: -9.46 },
      ],
      // Tangga bentuk U (diukur dari mesh Stairs di cafe.glb):
      //  1) Lari pertama menuju barat (-X) dari x = -4.05 sampai bordes di x = -5.78, naik 0 -> 2 m
      //  2) Bordes datar (tinggi 2 m) di x -7.32 s.d. -5.78
      //  3) Lari kedua menuju utara (+Z) dari z = -4.33 sampai z = -2.37, naik 2 -> 4 m
      // Tangga hanya bisa dimasuki dari gerbang (pangkal di timur, ujung atas di utara).
      stairs: {
        box: { minX: -7.32, maxX: -4.05, minZ: -5.44, maxZ: -2.37 },
        zones: [
          { minX: -5.78, maxX: -4.05, minZ: -5.44, maxZ: -4.33 }, // lari pertama
          { minX: -7.32, maxX: -5.78, minZ: -5.44, maxZ: -4.33 }, // bordes
          { minX: -7.32, maxX: -6.05, minZ: -4.33, maxZ: -2.37 }, // lari kedua
        ],
        path: [
          [-4.05, -4.885, 0],
          [-5.78, -4.885, 1.9],
          [-6.725, -4.885, 2.0],
          [-6.725, -4.33, 2.08],
          [-6.725, -2.37, 4.0],
        ],
        height: 4.0,
        gates: [
          // Pangkal tangga di lantai bawah (x -4.05 menuju timur)
          { floor: 0, box: { minX: -4.05, maxX: -3.45, minZ: -5.44, maxZ: -4.33 } },
          // Ujung atas tangga di lantai dua (z -2.37 menuju utara)
          { floor: 1, box: { minX: -7.32, maxX: -6.05, minZ: -2.37, maxZ: -1.85 } },
        ],
      },
    },
  },
];

/** Semua gedung dan objek di eksterior yang tidak bisa ditembus */
export const CITY_OBSTACLES: Box[] = [
  ...BUILDINGS.map((b) => boxFromFootprint(b.footprint)),
  ...SOLID_PROP_BOXES,
];

export function getBuilding(
  key: string | null | undefined,
): BuildingConfig | undefined {
  if (!key) return undefined;
  return BUILDINGS.find((b) => b.key === key);
}