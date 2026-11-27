// src/lib/stairs.ts
// Logika tangga & collision per lantai di interior. Dipisah dari OfficeScene agar mudah dites.
import { PLAYER_RADIUS, type Box, type StairsConfig } from "@/config/buildings";

export function inBox(x: number, z: number, b: Box): boolean {
  return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
}

/** Titik (x, z) dianggap menabrak jika berada di dalam kotak yang sudah diperbesar radius avatar */
export function isBlocked(x: number, z: number, boxes: Box[]): boolean {
  for (const b of boxes) {
    if (
      x > b.minX - PLAYER_RADIUS &&
      x < b.maxX + PLAYER_RADIUS &&
      z > b.minZ - PLAYER_RADIUS &&
      z < b.maxZ + PLAYER_RADIUS
    ) {
      return true;
    }
  }
  return false;
}

/** Apakah (x, z) berada di atas anak tangga / bordes (footprint tangga yang sebenarnya) */
export function inStairZones(stairs: StairsConfig, x: number, z: number): boolean {
  const zones = stairs.zones ?? [stairs.box];
  for (const b of zones) if (inBox(x, z, b)) return true;
  return false;
}

/** Gerbang tangga di (x, z): 0 = pangkal tangga (lantai bawah), 1 = ujung atas (lantai atas), null = bukan gerbang */
export function gateFloorAt(stairs: StairsConfig, x: number, z: number): 0 | 1 | null {
  for (const g of stairs.gates ?? []) if (inBox(x, z, g.box)) return g.floor;
  return null;
}

/** Lantai yang sedang dipijak di luar tangga: 0 = bawah, 1 = atas */
export function floorOfElevation(stairs: StairsConfig, elevation: number): 0 | 1 {
  return elevation >= stairs.height / 2 ? 1 : 0;
}

/**
 * Tinggi lantai tangga di titik (x, z): proyeksi ke segmen `path` terdekat.
 * - Jika setiap titik path punya tinggi (elemen ke-3), tinggi diinterpolasi di antara titik
 *   (bordes datar = dua titik dengan tinggi sama).
 * - Jika tidak, tinggi sebanding dengan jarak sepanjang path (perilaku lama).
 */
export function stairHeight(stairs: StairsConfig, x: number, z: number): number {
  const p = stairs.path;
  const withHeights = p.every((pt) => pt.length >= 3);
  let total = 0;
  const cum: number[] = [0];
  for (let i = 1; i < p.length; i++) {
    total += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    cum.push(total);
  }
  let bestDist = Infinity;
  let bestH = 0;
  let bestProgress = 0;
  for (let i = 1; i < p.length; i++) {
    const [ax, az] = p[i - 1];
    const [bx, bz] = p[i];
    const dx = bx - ax;
    const dz = bz - az;
    const len2 = dx * dx + dz * dz || 1;
    const u = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / len2));
    const d = Math.hypot(x - (ax + dx * u), z - (az + dz * u));
    if (d < bestDist) {
      bestDist = d;
      bestProgress = cum[i - 1] + Math.hypot(dx, dz) * u;
      if (withHeights) {
        const ha = p[i - 1][2] as number;
        const hb = p[i][2] as number;
        bestH = ha + (hb - ha) * u;
      }
    }
  }
  if (withHeights) return bestH;
  return total > 0 ? (bestProgress / total) * stairs.height : 0;
}

export interface MoveContext {
  stairs?: StairsConfig;
  /** true jika frame sebelumnya pemain berada di atas tangga */
  wasOnStairs: boolean;
  /** lantai yang sedang dipijak di luar tangga */
  floor: 0 | 1;
  /** posisi sebelum bergerak (dipakai untuk memeriksa gerbang masuk) */
  fromX: number;
  fromZ: number;
  /** collision lantai bawah dan (opsional) lantai atas */
  obstacles: Box[];
  upperObstacles?: Box[];
}

/** Penghalang yang berlaku untuk sebuah lantai */
export function obstaclesForFloor(
  floor: 0 | 1,
  obstacles: Box[],
  upperObstacles?: Box[],
): Box[] {
  return floor === 1 && upperObstacles ? upperObstacles : obstacles;
}

/**
 * Apakah pemain tidak boleh berdiri di (x, z)?
 * Tanpa `stairs.gates`, perilaku sama seperti dulu (hanya cek obstacles lantai aktif).
 * Dengan gates:
 *  - dari lantai: tangga hanya bisa dimasuki lewat gerbang lantai tersebut;
 *  - di atas tangga: boleh bergerak bebas di footprint tangga, dan hanya bisa keluar lewat gerbang.
 */
export function isMoveBlocked(ctx: MoveContext, x: number, z: number): boolean {
  const { stairs } = ctx;
  if (stairs?.gates) {
    const inside = inStairZones(stairs, x, z);
    if (ctx.wasOnStairs) {
      if (inside) return false;
      const g = gateFloorAt(stairs, x, z);
      if (g === null) return true;
      return isBlocked(x, z, obstaclesForFloor(g, ctx.obstacles, ctx.upperObstacles));
    }
    if (inside) return gateFloorAt(stairs, ctx.fromX, ctx.fromZ) !== ctx.floor;
  }
  return isBlocked(x, z, obstaclesForFloor(ctx.floor, ctx.obstacles, ctx.upperObstacles));
}