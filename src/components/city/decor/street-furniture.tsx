import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const FLOWER_COLORS = [
  "#f43f5e",
  "#f59e0b",
  "#ec4899",
  "#a855f7",
  "#38bdf8",
];

/** Pot tanaman & bunga hias */
export function PlanterBox({
  position,
  flowerColor = "#f43f5e",
}: {
  position: [number, number, number];
  flowerColor?: string;
}) {
  return (
    <group position={position}>
      {/* Kotak pot batu */}
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <boxGeometry args={[1.4, 0.44, 0.7]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>
      {/* Tanah */}
      <mesh position={[0, 0.43, 0]}>
        <boxGeometry args={[1.24, 0.04, 0.54]} />
        <meshStandardMaterial color="#573b26" roughness={0.95} />
      </mesh>
      {/* Semak & bunga */}
      {[-0.38, 0, 0.38].map((x, idx) => (
        <group key={x} position={[x, 0.55, 0]}>
          <mesh>
            <sphereGeometry args={[0.24, 8, 8]} />
            <meshStandardMaterial color="#16a34a" roughness={0.8} />
          </mesh>
          <mesh position={[0.05, 0.16, 0.06]}>
            <sphereGeometry args={[0.075, 6, 6]} />
            <meshStandardMaterial
              color={idx === 1 ? "#facc15" : flowerColor}
              roughness={0.5}
            />
          </mesh>
          <mesh position={[-0.08, 0.14, -0.05]}>
            <sphereGeometry args={[0.065, 6, 6]} />
            <meshStandardMaterial color={flowerColor} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Air mancur taman dengan animasi semburan air ringan */
export function Fountain({
  position,
  isNight = false,
}: {
  position: [number, number, number];
  isNight?: boolean;
}) {
  const jetRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (jetRef.current) {
      jetRef.current.scale.y = 0.85 + Math.sin(t * 4.5) * 0.18;
    }
    if (ringRef.current) {
      const s = 0.8 + ((t * 0.6) % 1) * 0.5;
      ringRef.current.scale.set(s, 1, s);
    }
  });

  return (
    <group position={position}>
      {/* Tepi kolam bundar */}
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <cylinderGeometry args={[2.3, 2.45, 0.4, 24]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>
      {/* Air kolam */}
      <mesh position={[0, 0.37, 0]}>
        <cylinderGeometry args={[2.05, 2.05, 0.08, 24]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive={isNight ? "#0284c7" : "#000000"}
          emissiveIntensity={isNight ? 0.9 : 0}
          roughness={0.15}
          metalness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Riak air */}
      <mesh
        ref={ringRef}
        position={[0, 0.415, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.8, 0.92, 24]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.6} />
      </mesh>
      {/* Pilar tengah */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.42, 0.9, 14]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.85, 0.35, 0.22, 18]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
      </mesh>
      {/* Semburan air */}
      <mesh ref={jetRef} position={[0, 1.9, 0]}>
        <cylinderGeometry args={[0.07, 0.26, 0.95, 12]} />
        <meshStandardMaterial
          color="#e0f2fe"
          transparent
          opacity={0.78}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

/** Halte bus modern di tepi jalan */
export function BusStop({
  position,
  rotationY = 0,
  isNight = false,
}: {
  position: [number, number, number];
  rotationY?: number;
  isNight?: boolean;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Platform peron halte dengan tepi kuning */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[4.6, 0.1, 1.8]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.105, 0]} receiveShadow>
        <boxGeometry args={[4.5, 0.015, 1.7]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.115, 0.78]}>
        <boxGeometry args={[4.4, 0.01, 0.14]} />
        <meshStandardMaterial color="#facc15" roughness={0.5} />
      </mesh>

      {/* Tiang baja utama */}
      {[-1.95, 0, 1.95].map((x) => (
        <group key={x} position={[x, 0.1, -0.68]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[0.1, 2.4, 0.1]} />
            <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 2.34, 0.65]} castShadow>
            <boxGeometry args={[0.08, 0.08, 1.4]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Dinding kaca belakang & samping kiri */}
      <mesh position={[0, 1.3, -0.7]}>
        <boxGeometry args={[3.8, 1.95, 0.05]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.38} roughness={0.1} />
      </mesh>
      <mesh position={[-1.95, 1.3, 0.02]}>
        <boxGeometry args={[0.05, 1.95, 1.35]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.38} roughness={0.1} />
      </mesh>

      {/* Kotak lightbox rute & informasi di sisi kanan */}
      <group position={[1.95, 1.28, 0.02]}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 1.95, 1.15]} />
          <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[-0.095, 0.05, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.96, 1.6]} />
          <meshStandardMaterial
            color="#e0f2fe"
            emissive="#38bdf8"
            emissiveIntensity={isNight ? 0.95 : 0.35}
          />
        </mesh>
      </group>

      {/* Atap halte modern berlapis */}
      <group position={[0, 2.52, 0.05]} rotation={[0.06, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[4.7, 0.12, 2.0]} />
          <meshStandardMaterial color="#0f172a" roughness={0.45} metalness={0.35} />
        </mesh>
        {/* List biru Enuma di depan atap */}
        <mesh position={[0, 0, 1.01]}>
          <boxGeometry args={[4.72, 0.09, 0.04]} />
          <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={0.35} />
        </mesh>
        {/* Skylight kaca atas */}
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[3.4, 0.03, 0.8]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.5} />
        </mesh>
        {/* Strip lampu LED bawah atap */}
        <mesh position={[0, -0.07, 0.15]}>
          <boxGeometry args={[3.8, 0.025, 0.14]} />
          <meshStandardMaterial
            color={isNight ? "#fef9c3" : "#cbd5e1"}
            emissive="#fef08a"
            emissiveIntensity={isNight ? 1.5 : 0}
          />
        </mesh>
      </group>

      {/* Kursi tunggu 3 dudukan berkaki lengkap */}
      <group position={[-0.2, 0.1, -0.32]}>
        {[-1.0, 1.0].map((lx) => (
          <mesh key={lx} position={[lx, 0.21, 0]} castShadow>
            <boxGeometry args={[0.07, 0.42, 0.36]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[2.3, 0.05, 0.1]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} />
        </mesh>
        {[-0.75, 0, 0.75].map((sx) => (
          <group key={sx} position={[sx, 0.46, 0]}>
            <mesh position={[0, 0, 0.04]} castShadow>
              <boxGeometry args={[0.64, 0.05, 0.42]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.22, -0.17]} rotation={[-0.14, 0, 0]} castShadow>
              <boxGeometry args={[0.64, 0.36, 0.045]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.45} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Tiang rambu & indikator digital halte */}
      <group position={[2.48, 0.1, 0.55]}>
        <mesh position={[0, 1.35, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.05, 2.7, 10]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} />
        </mesh>
        <mesh position={[0, 2.55, 0]} castShadow>
          <boxGeometry args={[0.52, 0.52, 0.08]} />
          <meshStandardMaterial color="#2563eb" />
        </mesh>
        <mesh position={[0, 2.1, 0]}>
          <boxGeometry args={[0.42, 0.22, 0.08]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive="#22c55e"
            emissiveIntensity={isNight ? 0.8 : 0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

/** Tempat sampah & hidran kota */
export function StreetProps({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* Tempat sampah */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.2, 0.18, 0.7, 12]} />
        <meshStandardMaterial color="#16a34a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 12]} />
        <meshStandardMaterial color="#15803d" roughness={0.5} />
      </mesh>
      {/* Hidran merah di sebelah */}
      <mesh position={[0.7, 0.28, 0]}>
        <cylinderGeometry args={[0.11, 0.13, 0.56, 10]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} />
      </mesh>
      <mesh position={[0.7, 0.58, 0]}>
        <sphereGeometry args={[0.11, 10, 8]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Meja kafe outdoor berpayung & 2 kursi */
export function CafeTable({
  position,
  umbrellaColor = "#ef4444",
}: {
  position: [number, number, number];
  umbrellaColor?: string;
}) {
  return (
    <group position={position}>
      {/* Tiang payung & meja */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.76, 10]} />
        <meshStandardMaterial color="#334155" metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.76, 0]} castShadow>
        <cylinderGeometry args={[0.58, 0.58, 0.05, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Tiang atas & payung */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.6, 8]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[0, 2.28, 0]} castShadow>
        <coneGeometry args={[1.25, 0.45, 12]} />
        <meshStandardMaterial color={umbrellaColor} roughness={0.6} />
      </mesh>
      {/* 2 kursi bistro bersandaran */}
      {[-0.8, 0.8].map((x) => {
        const dir = x < 0 ? -1 : 1;
        return (
          <group key={x} position={[x, 0, 0]}>
            {/* Tapak bawah & tiang kursi */}
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.2, 0.22, 0.04, 12]} />
              <meshStandardMaterial color="#1e293b" metalness={0.5} />
            </mesh>
            <mesh position={[0, 0.23, 0]} castShadow>
              <cylinderGeometry args={[0.035, 0.04, 0.42, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.5} />
            </mesh>
            {/* Dudukan */}
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.24, 0.05, 14]} />
              <meshStandardMaterial color="#b45309" roughness={0.65} />
            </mesh>
            {/* Penyangga & sandaran punggung */}
            <mesh position={[dir * 0.21, 0.64, 0]} rotation={[0, 0, dir * -0.1]}>
              <boxGeometry args={[0.04, 0.36, 0.06]} />
              <meshStandardMaterial color="#1e293b" metalness={0.5} />
            </mesh>
            <mesh position={[dir * 0.23, 0.78, 0]} rotation={[0, 0, dir * -0.1]} castShadow>
              <boxGeometry args={[0.05, 0.2, 0.38]} />
              <meshStandardMaterial color="#b45309" roughness={0.65} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Lampu penyeberangan di dekat zebra cross */
export function CrossingSignal({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 2.7, 10]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.45, 0]}>
        <boxGeometry args={[0.24, 0.56, 0.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.57, 0.105]}>
        <circleGeometry args={[0.065, 12]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={1.2}
        />
      </mesh>
      <mesh position={[0, 2.33, 0.105]}>
        <circleGeometry args={[0.065, 12]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={1.4}
        />
      </mesh>
    </group>
  );
}

/** Papan petunjuk arah kota */
export function CitySignpost({
  position,
}: {
  position: [number, number, number];
}) {
  const signs: { y: number; rotY: number; color: string }[] = [
    { y: 2.35, rotY: 0.2, color: "#2563eb" },
    { y: 2.08, rotY: -0.5, color: "#059669" },
    { y: 1.81, rotY: 1.4, color: "#d97706" },
  ];
  return (
    <group position={position}>
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 2.6, 10]} />
        <meshStandardMaterial color="#334155" metalness={0.6} />
      </mesh>
      {signs.map((s, idx) => (
        <mesh key={idx} position={[0, s.y, 0]} rotation={[0, s.rotY, 0]}>
          <boxGeometry args={[0.95, 0.18, 0.05]} />
          <meshStandardMaterial color={s.color} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** Lampu taman pendek (bollard) di sepanjang jalur setapak */
export function BollardLight({
  position,
  isNight = false,
}: {
  position: [number, number, number];
  isNight?: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.06, 0.075, 0.52, 10]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.1, 10]} />
        <meshStandardMaterial
          color={isNight ? "#fef08a" : "#cbd5e1"}
          emissive="#fde047"
          emissiveIntensity={isNight ? 2.0 : 0}
        />
      </mesh>
    </group>
  );
}
