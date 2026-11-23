// src/components/railway/RailTrack.tsx
import { useMemo } from "react";
import * as THREE from "three";
import { RAIL, buildRoundedPath, type PathPoint } from "@/config/railway";

/** Lintasan batu/aspal di sekitar rel, seperti trem kota di Eropa. Ganti ke "#3f7d3a" untuk rumput. */
const BED_COLOR = "#6b6b6b";
const RAIL_COLOR = "#4b5563";
/** Lebar lintasan di luar tiap rel */
const BED_EXTRA = 0.9;
/** Tinggi permukaan lintasan. Roda trem menempel di sini. */
export const BED_Y = 0.05;
const RAIL_RADIUS = 0.035;
const RAIL_Y = RAIL.railY;

/** Satu rel: tabung halus mengikuti jalur tertutup. */
function Rail({ points }: { points: PathPoint[] }) {
  const geometry = useMemo(() => {
    // Buang titik penutup yang duplikat, lalu bentuk kurva tertutup
    const vecs = points
      .slice(0, -1)
      .map((p) => new THREE.Vector3(p.x, RAIL_Y, p.z));
    const curve = new THREE.CatmullRomCurve3(vecs, true, "centripetal");
    return new THREE.TubeGeometry(curve, points.length * 3, RAIL_RADIUS, 8, true);
  }, [points]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={RAIL_COLOR} metalness={0.7} roughness={0.35} />
    </mesh>
  );
}

/** Lintasan batu/aspal berbentuk cincin di antara dan sekitar rel. */
function TrackBed() {
  const geometry = useMemo(() => {
    const e = RAIL.gauge / 2 + BED_EXTRA;
    const outer = buildRoundedPath(RAIL.halfX + e, RAIL.halfZ + e, RAIL.cornerRadius + e)
      .points.slice(0, -1);
    const inner = buildRoundedPath(RAIL.halfX - e, RAIL.halfZ - e, RAIL.cornerRadius - e)
      .points.slice(0, -1);

    // Shape berada di bidang XY, jadi y dibalik ke -z agar setelah diputar hasilnya sesuai XZ
    const shape = new THREE.Shape(outer.map((p) => new THREE.Vector2(p.x, -p.z)));
    shape.holes.push(new THREE.Path(inner.map((p) => new THREE.Vector2(p.x, -p.z))));
    return new THREE.ShapeGeometry(shape, 1);
  }, []);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, BED_Y, 0]}
      receiveShadow
    >
      <meshStandardMaterial color={BED_COLOR} roughness={0.95} />
    </mesh>
  );
}

export function RailTrack() {
  const half = RAIL.gauge / 2;

  const outer = useMemo(
    () => buildRoundedPath(RAIL.halfX + half, RAIL.halfZ + half, RAIL.cornerRadius + half).points,
    [half]
  );
  const inner = useMemo(
    () => buildRoundedPath(RAIL.halfX - half, RAIL.halfZ - half, RAIL.cornerRadius - half).points,
    [half]
  );

  return (
    <group>
      <TrackBed />
      <Rail points={outer} />
      <Rail points={inner} />
    </group>
  );
}