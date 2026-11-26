import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { getNpcSignal } from "@/lib/npcRuntime";

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

/** Air mancur taman bertingkat dengan pancuran, lampu bawah air & riak air */
export function Fountain({
  position,
  isNight = false,
}: {
  position: [number, number, number];
  isNight?: boolean;
}) {
  const jetRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const dropRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (jetRef.current) {
      jetRef.current.scale.y = 0.88 + Math.sin(t * 4.5) * 0.16;
    }
    if (ring1Ref.current) {
      const p1 = (t * 0.5) % 1;
      const s1 = 0.5 + p1 * 1.1;
      ring1Ref.current.scale.set(s1, s1, 1);
      (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - p1) * 0.55;
    }
    if (ring2Ref.current) {
      const p2 = (t * 0.5 + 0.5) % 1;
      const s2 = 0.5 + p2 * 1.1;
      ring2Ref.current.scale.set(s2, s2, 1);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - p2) * 0.55;
    }
    for (let i = 0; i < dropRefs.current.length; i++) {
      const d = dropRefs.current[i];
      if (!d) continue;
      const phase = ((t * 1.6 + i * 0.25) % 1);
      d.position.y = 1.38 - phase * phase * 0.96;
      const sc = 1 - phase * 0.35;
      d.scale.setScalar(sc);
    }
  });

  return (
    <group position={position}>
      {/* Undakan dasar batu luar */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[2.52, 2.58, 0.08, 32]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.75} />
      </mesh>
      {/* Dinding luar kolam */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.32, 2.42, 0.36, 32]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.65} />
      </mesh>
      {/* Bibir kolam melingkar membulat */}
      <mesh position={[0, 0.43, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[2.24, 0.12, 12, 36]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.55} />
      </mesh>
      {/* 8 ornamen pilar kecil di bibir kolam */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={`rim-${i}`}
            position={[Math.cos(a) * 2.24, 0.47, Math.sin(a) * 2.24]}
            castShadow
          >
            <cylinderGeometry args={[0.1, 0.12, 0.14, 10]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
          </mesh>
        );
      })}

      {/* Dasar kolam biru keramik */}
      <mesh position={[0, 0.31, 0]}>
        <cylinderGeometry args={[2.12, 2.12, 0.04, 32]} />
        <meshStandardMaterial color="#0369a1" roughness={0.5} />
      </mesh>
      {/* Koin & batu hias di dasar kolam */}
      {[
        [0.9, 0.6],
        [-1.1, 0.4],
        [0.4, -1.2],
        [-0.7, -0.9],
      ].map(([cx, cz], i) => (
        <mesh key={`coin-${i}`} position={[cx, 0.335, cz]}>
          <cylinderGeometry args={[0.04, 0.04, 0.01, 8]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Permukaan air kolam */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[2.12, 2.12, 0.06, 32]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive={isNight ? "#0284c7" : "#000000"}
          emissiveIntensity={isNight ? 0.8 : 0}
          roughness={0.12}
          metalness={0.25}
          transparent
          opacity={0.78}
        />
      </mesh>

      {/* Dua riak air konsentris */}
      <mesh ref={ring1Ref} position={[0, 0.415, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 0.94, 32]} />
        <meshBasicMaterial color="#e0f2fe" transparent opacity={0.5} />
      </mesh>
      <mesh ref={ring2Ref} position={[0, 0.416, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 0.94, 32]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.5} />
      </mesh>

      {/* 6 lampu sorot bawah air */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={`uw-${i}`} position={[Math.cos(a) * 1.15, 0.35, Math.sin(a) * 1.15]}>
            <cylinderGeometry args={[0.06, 0.07, 0.06, 10]} />
            <meshStandardMaterial
              color={isNight ? "#bae6fd" : "#475569"}
              emissive={isNight ? "#38bdf8" : "#000000"}
              emissiveIntensity={isNight ? 1.8 : 0}
            />
          </mesh>
        );
      })}

      {/* Alas pilar tengah */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.62, 0.18, 18]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>
      {/* Pilar tingkat 1 */}
      <mesh position={[0, 0.88, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.38, 0.7, 16]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.55} />
      </mesh>
      {/* Mangkuk besar tingkat 1 + air di dalamnya */}
      <mesh position={[0, 1.28, 0]} castShadow>
        <cylinderGeometry args={[0.96, 0.34, 0.22, 24]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.39, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.95, 0.045, 10, 28]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.37, 0]}>
        <cylinderGeometry args={[0.88, 0.88, 0.04, 24]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.85} roughness={0.1} />
      </mesh>

      {/* Pilar tingkat 2 + mangkuk kecil */}
      <mesh position={[0, 1.64, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 0.54, 14]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.94, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.2, 0.16, 20]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.02, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 0.03, 20]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.85} roughness={0.1} />
      </mesh>

      {/* Nozzle puncak kuningan */}
      <mesh position={[0, 2.12, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.1, 0.2, 12]} />
        <meshStandardMaterial color="#d97706" metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Semburan air puncak */}
      <mesh ref={jetRef} position={[0, 2.58, 0]}>
        <cylinderGeometry args={[0.04, 0.18, 0.82, 12]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.78} roughness={0.1} />
      </mesh>

      {/* 8 pancuran air jatuh dari mangkuk tingkat 1 ke kolam */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <group key={`spill-${i}`} position={[Math.cos(a) * 0.96, 0, Math.sin(a) * 0.96]}>
            <mesh position={[Math.cos(a) * 0.12, 0.9, Math.sin(a) * 0.12]}>
              <cylinderGeometry args={[0.025, 0.05, 0.96, 8]} />
              <meshStandardMaterial color="#bae6fd" transparent opacity={0.62} roughness={0.1} />
            </mesh>
            <mesh
              ref={(el) => {
                dropRefs.current[i] = el;
              }}
              position={[Math.cos(a) * 0.14, 1.35, Math.sin(a) * 0.14]}
            >
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshBasicMaterial color="#e0f2fe" transparent opacity={0.8} />
            </mesh>
          </group>
        );
      })}
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

/** Lampu penyeberangan di dekat zebra cross (sinkron dengan sinyal lalu lintas) */
export function CrossingSignal({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  const redRef = useRef<THREE.MeshStandardMaterial>(null);
  const greenRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const carSig = getNpcSignal();
    const walkGreen = carSig === "red";
    if (redRef.current) {
      redRef.current.emissiveIntensity = walkGreen ? 0.05 : 2.6;
    }
    if (greenRef.current) {
      greenRef.current.emissiveIntensity = walkGreen ? 2.8 : 0.05;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 2.7, 10]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.45, 0]} castShadow>
        <boxGeometry args={[0.26, 0.58, 0.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      {/* Tudung lampu merah & hijau */}
      <mesh position={[0, 2.65, 0.13]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.18, 0.02, 0.08]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 2.41, 0.13]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.18, 0.02, 0.08]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 2.57, 0.105]}>
        <circleGeometry args={[0.065, 12]} />
        <meshStandardMaterial
          ref={redRef}
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={2.6}
        />
      </mesh>
      <mesh position={[0, 2.33, 0.105]}>
        <circleGeometry args={[0.065, 12]} />
        <meshStandardMaterial
          ref={greenRef}
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.05}
        />
      </mesh>
    </group>
  );
}

/** Papan petunjuk arah kota dengan ujung panah & teks dua sisi */
export function CitySignpost({
  position,
}: {
  position: [number, number, number];
}) {
  const signs: {
    y: number;
    rotY: number;
    dir: 1 | -1;
    color: string;
    label: string;
    sub: string;
  }[] = [
    { y: 2.42, rotY: 0.08, dir: 1, color: "#0284c7", label: "ENUMA HQ · CAFE", sub: "120 m" },
    { y: 2.15, rotY: -0.08, dir: -1, color: "#2563eb", label: "INDOMART · WARUNG", sub: "90 m" },
    { y: 1.88, rotY: -Math.PI / 2 + 0.15, dir: 1, color: "#059669", label: "STASIUN & PLAZA", sub: "150 m" },
    { y: 1.61, rotY: Math.PI / 2 - 0.35, dir: 1, color: "#d97706", label: "TAMAN AIR MANCUR", sub: "110 m" },
  ];

  return (
    <group position={position}>
      {/* Alas dasar & flens baut */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.17, 0.1, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.11, 0.12, 12]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Tiang utama */}
      <mesh position={[0, 1.38, 0]} castShadow>
        <cylinderGeometry args={[0.048, 0.058, 2.65, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.35} />
      </mesh>

      {/* Mahkota finial puncak tiang */}
      <mesh position={[0, 2.74, 0]} castShadow>
        <sphereGeometry args={[0.075, 12, 10]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.25} />
      </mesh>

      {signs.map((s, idx) => (
        <group key={idx} position={[0, s.y, 0]} rotation={[0, s.rotY, 0]}>
          {/* Cincin penyangga di tiang */}
          <mesh>
            <cylinderGeometry args={[0.068, 0.068, 0.08, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.6} />
          </mesh>

          {/* Papan bergeser ke arah tujuan (dir: +1 kanan / -1 kiri) */}
          <group position={[s.dir * 0.48, 0, 0]}>
            {/* Badan papan utama */}
            <mesh castShadow>
              <boxGeometry args={[0.96, 0.21, 0.045]} />
              <meshStandardMaterial color={s.color} roughness={0.38} />
            </mesh>
            {/* Bingkai tipis atas & bawah */}
            {[-0.105, 0.105].map((by) => (
              <mesh key={by} position={[0, by, 0]}>
                <boxGeometry args={[0.96, 0.015, 0.052]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.3} />
              </mesh>
            ))}
            {/* Ujung panah segitiga */}
            <mesh
              position={[s.dir * 0.54, 0, 0]}
              rotation={[0, 0, s.dir * -Math.PI / 2]}
              scale={[1, 1, 0.35]}
              castShadow
            >
              <coneGeometry args={[0.115, 0.14, 4]} />
              <meshStandardMaterial color={s.color} roughness={0.38} />
            </mesh>

            {/* Teks depan & belakang papan */}
            {[0.026, -0.026].map((tz, sideIdx) => (
              <group
                key={sideIdx}
                position={[0, 0, tz]}
                rotation={[0, sideIdx === 1 ? Math.PI : 0, 0]}
              >
                <Text
                  position={[0, 0.028, 0]}
                  fontSize={0.068}
                  color="#ffffff"
                  anchorX="center"
                  anchorY="middle"
                >
                  {s.label}
                </Text>
                <Text
                  position={[0, -0.05, 0]}
                  fontSize={0.046}
                  color="#e2e8f0"
                  anchorX="center"
                  anchorY="middle"
                >
                  {s.sub}
                </Text>
              </group>
            ))}
          </group>
        </group>
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
