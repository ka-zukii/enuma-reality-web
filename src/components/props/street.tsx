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
 * BANGKU TAMAN MODERN
 * Bilah kayu jati ergonomis, rangka besi cor, dan sandaran tangan.
 * ============================================================ */
export function ParkBench({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const seatSlats = [-0.16, -0.06, 0.04, 0.14, 0.22];
  const backSlats = [0.06, 0.17, 0.28];

  return (
    <group position={position} rotation={rotation}>
      {/* Dudukan dari bilah kayu */}
      {seatSlats.map((z, idx) => (
        <mesh
          key={`seat-${z}`}
          position={[0, idx === 4 ? 0.44 : 0.46, z]}
          rotation={[idx === 4 ? 0.25 : 0, 0, 0]}
          castShadow
        >
          <boxGeometry args={[1.64, 0.042, 0.075]} />
          <meshStandardMaterial color="#b45309" roughness={0.75} />
        </mesh>
      ))}

      {/* Sandaran miring ergonomis */}
      <group position={[0, 0.56, -0.22]} rotation={[-0.18, 0, 0]}>
        {backSlats.map((y) => (
          <mesh key={`back-${y}`} position={[0, y, 0]} castShadow>
            <boxGeometry args={[1.64, 0.075, 0.042]} />
            <meshStandardMaterial color="#b45309" roughness={0.75} />
          </mesh>
        ))}
      </group>

      {/* Penyangga tengah bawah dudukan */}
      <mesh position={[0, 0.42, 0.02]}>
        <boxGeometry args={[1.45, 0.04, 0.06]} />
        <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.35} />
      </mesh>

      {/* Rangka kaki besi cor & sandaran tangan */}
      {[-0.72, 0.72].map((x) => (
        <group key={`leg-${x}`} position={[x, 0, 0]}>
          {/* Kaki depan & belakang */}
          <mesh position={[0, 0.22, 0.16]} castShadow>
            <boxGeometry args={[0.065, 0.44, 0.065]} />
            <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.22, -0.18]} castShadow>
            <boxGeometry args={[0.065, 0.44, 0.065]} />
            <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.35} />
          </mesh>
          {/* Palang samping & tapak bawah */}
          <mesh position={[0, 0.02, -0.01]}>
            <boxGeometry args={[0.08, 0.04, 0.46]} />
            <meshStandardMaterial color="#0f172a" metalness={0.55} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.42, -0.01]}>
            <boxGeometry args={[0.06, 0.05, 0.42]} />
            <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.35} />
          </mesh>
          {/* Tiang sandaran miring */}
          <mesh position={[0, 0.66, -0.23]} rotation={[-0.18, 0, 0]}>
            <boxGeometry args={[0.055, 0.46, 0.055]} />
            <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.35} />
          </mesh>
          {/* Penyangga & puncak sandaran tangan */}
          <mesh position={[0, 0.54, 0.14]}>
            <boxGeometry args={[0.05, 0.2, 0.05]} />
            <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.65, -0.03]} castShadow>
            <boxGeometry args={[0.075, 0.04, 0.42]} />
            <meshStandardMaterial color="#92400e" roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
