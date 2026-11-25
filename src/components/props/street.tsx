import { useEffect, useMemo } from "react";
import * as THREE from "three";

/* ============================================================
 * LAMPU JALAN
 * Tiang meruncing, lengan melengkung, dan kepala lampu dengan lensa menyala.
 * Kepala lampu berada di sekitar (0.75, 4.0, 0), sesuai posisi cahaya di CityLife.
 * ============================================================ */
export function StreetLamp({
  position,
  isNight = false,
}: {
  position: [number, number, number];
  isNight?: boolean;
}) {
  const armGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 4.1, 0),
      new THREE.Vector3(0.35, 4.42, 0),
      new THREE.Vector3(0.75, 4.12, 0),
    ]);
    return new THREE.TubeGeometry(curve, 16, 0.035, 6, false);
  }, []);

  useEffect(() => () => armGeo.dispose(), [armGeo]);

  return (
    <group position={position}>
      {/* Pondasi */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.24, 0.24, 14]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>

      {/* Tiang meruncing */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.12, 4.2, 14]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Lengan */}
      <mesh geometry={armGeo} castShadow>
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Tudung lampu, bukaan menghadap ke bawah */}
      <mesh position={[0.75, 4.12, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.22, 0.2, 14]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Lensa yang menyala */}
      <mesh position={[0.75, 4.0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.03, 16]} />
        <meshStandardMaterial
          color={isNight ? "#fef08a" : "#e2e8f0"}
          emissive="#fde047"
          emissiveIntensity={isNight ? 2.5 : 0.35}
        />
      </mesh>
      {isNight && (
        <mesh position={[0.75, 3.85, 0]}>
          <coneGeometry args={[0.75, 0.9, 12, 1, true]} />
          <meshBasicMaterial
            color="#fef08a"
            transparent
            opacity={0.14}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

/* ============================================================
 * BANGKU TAMAN
 * Dudukan dan sandaran dari bilah kayu, kaki besi cor dengan lengan.
 * ============================================================ */
export function ParkBench({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const seatSlats = [-0.18, -0.09, 0, 0.09, 0.18];
  const backSlats = [0.62, 0.74, 0.86];

  return (
    <group position={position} rotation={rotation}>
      {/* Dudukan dari bilah kayu */}
      {seatSlats.map((z) => (
        <mesh key={`seat-${z}`} position={[0, 0.46, z]} castShadow>
          <boxGeometry args={[1.5, 0.04, 0.08]} />
          <meshStandardMaterial color="#92400e" roughness={0.85} />
        </mesh>
      ))}

      {/* Sandaran dari bilah kayu */}
      {backSlats.map((y) => (
        <mesh key={`back-${y}`} position={[0, y, -0.22]} castShadow>
          <boxGeometry args={[1.5, 0.07, 0.04]} />
          <meshStandardMaterial color="#92400e" roughness={0.85} />
        </mesh>
      ))}

      {/* Kaki besi cor dan sandaran tangan */}
      {[-0.66, 0.66].map((x) => (
        <group key={`leg-${x}`} position={[x, 0, 0]}>
          <mesh position={[0, 0.22, 0.02]}>
            <boxGeometry args={[0.06, 0.44, 0.44]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.4}
              roughness={0.5}
            />
          </mesh>
          <mesh position={[0, 0.02, -0.2]}>
            <boxGeometry args={[0.06, 0.04, 0.3]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.4}
              roughness={0.5}
            />
          </mesh>
          <mesh position={[0, 0.7, -0.1]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.06, 0.06, 0.5]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.4}
              roughness={0.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
