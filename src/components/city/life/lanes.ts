export interface LaneSpec {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  r: number;
  dir: 1 | -1; // 1 = searah jarum jam, -1 = berlawanan
}

export const LANES: Record<"outer" | "inner", LaneSpec> = {
  // Jalur luar searah jarum jam
  outer: {
    minX: -45.75,
    maxX: 45.75,
    minZ: -31.75,
    maxZ: 23.75,
    r: 7.75,
    dir: 1,
  },
  // Jalur dalam berlawanan arah jarum jam
  inner: {
    minX: -42.25,
    maxX: 42.25,
    minZ: -28.25,
    maxZ: 20.25,
    r: 5.25,
    dir: -1,
  },
};

export function laneLength(l: LaneSpec): number {
  const straightX = Math.max(0, l.maxX - l.minX - 2 * l.r);
  const straightZ = Math.max(0, l.maxZ - l.minZ - 2 * l.r);
  return 2 * (straightX + straightZ) + 2 * Math.PI * l.r;
}

/** Posisi (x, z) dan arah gerak (tx, tz) pada lintasan persegi-lengkung tertutup */
export function sampleLane(
  l: LaneSpec,
  dist: number,
): { x: number; z: number; tx: number; tz: number } {
  const sx = Math.max(0, l.maxX - l.minX - 2 * l.r);
  const sz = Math.max(0, l.maxZ - l.minZ - 2 * l.r);
  const arc = (Math.PI / 2) * l.r;
  const total = 2 * (sx + sz) + 4 * arc;
  let d = ((dist % total) + total) % total;

  // 1. Sisi utara (+X)
  if (d < sx) {
    return { x: l.minX + l.r + d, z: l.minZ, tx: 1, tz: 0 };
  }
  d -= sx;
  // 2. Sudut timur laut
  if (d < arc) {
    const a = -Math.PI / 2 + (d / arc) * (Math.PI / 2);
    return {
      x: l.maxX - l.r + Math.cos(a) * l.r,
      z: l.minZ + l.r + Math.sin(a) * l.r,
      tx: -Math.sin(a),
      tz: Math.cos(a),
    };
  }
  d -= arc;
  // 3. Sisi timur (+Z)
  if (d < sz) {
    return { x: l.maxX, z: l.minZ + l.r + d, tx: 0, tz: 1 };
  }
  d -= sz;
  // 4. Sudut tenggara
  if (d < arc) {
    const a = (d / arc) * (Math.PI / 2);
    return {
      x: l.maxX - l.r + Math.cos(a) * l.r,
      z: l.maxZ - l.r + Math.sin(a) * l.r,
      tx: -Math.sin(a),
      tz: Math.cos(a),
    };
  }
  d -= arc;
  // 5. Sisi selatan (-X)
  if (d < sx) {
    return { x: l.maxX - l.r - d, z: l.maxZ, tx: -1, tz: 0 };
  }
  d -= sx;
  // 6. Sudut barat daya
  if (d < arc) {
    const a = Math.PI / 2 + (d / arc) * (Math.PI / 2);
    return {
      x: l.minX + l.r + Math.cos(a) * l.r,
      z: l.maxZ - l.r + Math.sin(a) * l.r,
      tx: -Math.sin(a),
      tz: Math.cos(a),
    };
  }
  d -= arc;
  // 7. Sisi barat (-Z)
  if (d < sz) {
    return { x: l.minX, z: l.maxZ - l.r - d, tx: 0, tz: -1 };
  }
  d -= sz;
  // 8. Sudut barat laut
  const a = Math.PI + (d / arc) * (Math.PI / 2);
  return {
    x: l.minX + l.r + Math.cos(a) * l.r,
    z: l.minZ + l.r + Math.sin(a) * l.r,
    tx: -Math.sin(a),
    tz: Math.cos(a),
  };
}
