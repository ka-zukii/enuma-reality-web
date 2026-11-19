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
export const BUILDING_KEYS = ["enuma-hq", "board-game-cafe", "m-cafe"] as const;
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

export interface InteriorConfig {
  name: string;
  accent: string;
  bounds: InteriorBounds;
  spawn: Vec3;
  exit: { position: Vec3; radius: number };
  /** Benda di dalam ruangan yang tidak bisa ditembus */
  obstacles: Box[];
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

/** Posisi meja kerja di interior, dipakai untuk render dan collision */
export const DESK_POSITIONS: Vec3[] = [
  [-3, 0, -2],
  [3, 0, -2],
  [-3, 0, 1],
  [3, 0, 1],
];
const DESK_W = 2.2;
const DESK_D = 0.9;

function makeInterior(name: string, accent: string): InteriorConfig {
  return {
    name,
    accent,
    bounds: { minX: -6, maxX: 6, minZ: -4, maxZ: 3.5 },
    spawn: [0, 0, 1.5],
    exit: { position: [0, 0, 4.0], radius: 1.0 },
    obstacles: DESK_POSITIONS.map((p) => ({
      minX: p[0] - DESK_W / 2,
      maxX: p[0] + DESK_W / 2,
      minZ: p[2] - DESK_D / 2,
      maxZ: p[2] + DESK_D / 2,
    })),
  };
}

export const BUILDINGS: BuildingConfig[] = [
  {
    key: "enuma-hq",
    name: "Enuma Reality Virtual Office",
    footprint: { x: -1, z: -4, w: 13, d: 11 },
    entrance: [-1, 0, 2.7],
    entranceRadius: 3,
    interior: makeInterior("Enuma Reality HQ", "#2563eb"),
  },
  {
    key: "board-game-cafe",
    name: "Board Game & Mahjong Cafe",
    footprint: { x: -15, z: -4, w: 11, d: 10 },
    entrance: [-15, 0, 2.2],
    entranceRadius: 3,
    interior: makeInterior("Board Game & Mahjong Cafe", "#f59e0b"),
  },
  {
    key: "m-cafe",
    name: "M Cafe & Terrace",
    footprint: { x: 20, z: -4, w: 11, d: 10 },
    entrance: [20, 0, 2.2],
    entranceRadius: 3,
    interior: makeInterior("M Cafe & Terrace", "#ec4899"),
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
