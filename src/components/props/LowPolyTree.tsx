import { useMemo } from "react";
import * as THREE from "three";

/* ============================================================
 * POHON
 * Batang meruncing dan tajuk dari beberapa bola yang bentuknya sedikit tidak beraturan.
 * Noise dihitung dari posisi vertex, jadi tidak ada celah di sambungan.
 * ============================================================ */
function makeCanopyGeometry(
  radius: number,
  seed: number,
): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const k =
      Math.sin(v.x * 5.3 + seed) *
      Math.sin(v.y * 4.7 + seed * 0.7) *
      Math.sin(v.z * 5.9 + seed * 1.9);
    v.multiplyScalar(1 + 0.12 * k);
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

const CANOPY_SHADES = ["#15803d", "#16a34a", "#22c55e", "#4ade80"];

export function LowPolyTree({
  position,
  scale = 1.6,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const seed = Math.abs(Math.round(position[0] * 7 + position[2] * 13));

  const crowns = useMemo(
    () =>
      [
        { pos: [0, 2.6, 0] as const, r: 1.2 },
        { pos: [0.35, 3.5, -0.2] as const, r: 0.95 },
        { pos: [-0.3, 3.3, 0.25] as const, r: 0.85 },
        { pos: [0.05, 4.4, 0.05] as const, r: 0.7 },
      ].map((c, i) => ({
        pos: c.pos,
        color: CANOPY_SHADES[(seed + i) % CANOPY_SHADES.length],
        geo: makeCanopyGeometry(c.r, seed + i * 3.1),
      })),
    [seed],
  );

  return (
    <group position={position} scale={scale}>
      {/* Batang meruncing ke atas */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.24, 2.4, 8]} />
        <meshStandardMaterial color="#6b3f1d" roughness={0.95} />
      </mesh>

      {crowns.map((c, i) => (
        <mesh
          key={i}
          geometry={c.geo}
          position={c.pos as [number, number, number]}
          castShadow
        >
          <meshStandardMaterial color={c.color} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
