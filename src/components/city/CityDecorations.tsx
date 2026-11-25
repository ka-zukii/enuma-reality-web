import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LowPolyTree, ParkBench } from "@/components/CityProps";

const FLOWER_COLORS = ["#f43f5e", "#f59e0b", "#ec4899", "#a855f7", "#38bdf8"];

/** Pot tanaman & bunga hias */
function PlanterBox({
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
function Fountain({
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
      <mesh ref={ringRef} position={[0, 0.415, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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
function BusStop({
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
      {/* Platform */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.08, 1.6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>
      {/* Tiang penyangga */}
      {[-1.8, 1.8].map((x) => (
        <mesh key={x} position={[x, 1.25, -0.55]}>
          <cylinderGeometry args={[0.06, 0.06, 2.4, 10]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {/* Dinding kaca belakang */}
      <mesh position={[0, 1.25, -0.58]}>
        <boxGeometry args={[3.5, 1.8, 0.06]} />
        <meshStandardMaterial
          color="#bae6fd"
          transparent
          opacity={0.45}
          roughness={0.1}
        />
      </mesh>
      {/* Atap halte */}
      <mesh position={[0, 2.48, 0.05]} rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[4.4, 0.1, 1.8]} />
        <meshStandardMaterial color="#0284c7" roughness={0.35} metalness={0.3} />
      </mesh>
      {/* Strip lampu atap halte saat malam */}
      <mesh position={[0, 2.41, 0.2]}>
        <boxGeometry args={[3.6, 0.03, 0.12]} />
        <meshStandardMaterial
          color={isNight ? "#e0f2fe" : "#94a3b8"}
          emissive="#38bdf8"
          emissiveIntensity={isNight ? 1.8 : 0}
        />
      </mesh>
      {/* Kursi tunggu */}
      <mesh position={[0, 0.5, -0.25]}>
        <boxGeometry args={[2.6, 0.08, 0.45]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.5} />
      </mesh>
      {/* Tiang rambu halte */}
      <mesh position={[2.35, 1.3, 0.4]}>
        <cylinderGeometry args={[0.04, 0.04, 2.6, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.6} />
      </mesh>
      <mesh position={[2.35, 2.35, 0.4]}>
        <boxGeometry args={[0.45, 0.45, 0.06]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
    </group>
  );
}

/** Menara jam taman kota bergaya klasik tinggi (±12 m) dengan 4 muka jam & jarum bergerak */
function ClockTower({
  position,
  isNight = false,
}: {
  position: [number, number, number];
  isNight?: boolean;
}) {
  const minuteRefs = useRef<(THREE.Mesh | null)[]>([]);
  const hourRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (const m of minuteRefs.current) {
      if (m) m.rotation.z = -t * 0.4;
    }
    for (const h of hourRefs.current) {
      if (h) h.rotation.z = -t * 0.05;
    }
  });

  // 4 sisi muka jam: [rotY, posisi lokal]
  const faces: { rotY: number; pos: [number, number, number] }[] = [
    { rotY: 0, pos: [0, 8.2, 0.96] },
    { rotY: Math.PI, pos: [0, 8.2, -0.96] },
    { rotY: Math.PI / 2, pos: [0.96, 8.2, 0] },
    { rotY: -Math.PI / 2, pos: [-0.96, 8.2, 0] },
  ];

  return (
    <group position={position}>
      {/* Alas bertingkat batu */}
      <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.7, 0.7, 2.7]} />
        <meshStandardMaterial color="#475569" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.95, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.15, 0.5, 2.15]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>

      {/* Badan menara utama */}
      <mesh position={[0, 4.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.65, 5.8, 1.65]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.55} />
      </mesh>

      {/* Pilar sudut & lis horizontal pemisah tingkat */}
      {[
        [-0.8, -0.8],
        [0.8, -0.8],
        [-0.8, 0.8],
        [0.8, 0.8],
      ].map(([x, z], idx) => (
        <mesh key={`pil-${idx}`} position={[x, 4.1, z]}>
          <boxGeometry args={[0.18, 5.8, 0.18]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
        </mesh>
      ))}
      {[2.6, 5.0, 7.05].map((y) => (
        <mesh key={`ledge-${y}`} position={[0, y, 0]}>
          <boxGeometry args={[1.88, 0.18, 1.88]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.6} />
        </mesh>
      ))}

      {/* Jendela vertikal tinggi di 4 sisi menara */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((rotY, idx) => (
        <group key={`win-${idx}`} rotation={[0, rotY, 0]}>
          <mesh position={[0, 3.8, 0.84]}>
            <planeGeometry args={[0.38, 1.5]} />
            <meshStandardMaterial
              color={isNight ? "#fef08a" : "#7dd3fc"}
              emissive={isNight ? "#f59e0b" : "#000000"}
              emissiveIntensity={isNight ? 0.95 : 0}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, 6.0, 0.84]}>
            <planeGeometry args={[0.38, 1.2]} />
            <meshStandardMaterial
              color={isNight ? "#fef08a" : "#7dd3fc"}
              emissive={isNight ? "#f59e0b" : "#000000"}
              emissiveIntensity={isNight ? 0.95 : 0}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Ruang jam (lebih lebar sedikit di atas) */}
      <mesh position={[0, 8.2, 0]} castShadow>
        <boxGeometry args={[1.88, 2.15, 1.88]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>
      <mesh position={[0, 9.35, 0]}>
        <boxGeometry args={[2.15, 0.22, 2.15]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>

      {/* 4 Muka Jam berbingkai emas */}
      {faces.map((f, idx) => (
        <group key={`face-${idx}`} position={f.pos} rotation={[0, f.rotY, 0]}>
          {/* Bingkai emas */}
          <mesh>
            <torusGeometry args={[0.56, 0.05, 10, 24]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.25} />
          </mesh>
          {/* Latar jam */}
          <mesh position={[0, 0, -0.01]}>
            <circleGeometry args={[0.54, 24]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={isNight ? "#fef3c7" : "#000000"}
              emissiveIntensity={isNight ? 1.1 : 0}
            />
          </mesh>
          {/* Jarum jam & menit berputar */}
          <mesh
            ref={(el) => {
              hourRefs.current[idx] = el;
            }}
            position={[0, 0, 0.02]}
          >
            <boxGeometry args={[0.045, 0.28, 0.02]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh
            ref={(el) => {
              minuteRefs.current[idx] = el;
            }}
            position={[0, 0, 0.03]}
          >
            <boxGeometry args={[0.03, 0.42, 0.02]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      ))}

      {/* Atap menara runcing & puncak emas */}
      <mesh position={[0, 10.65, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.45, 2.5, 4]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 12.15, 0]}>
        <cylinderGeometry args={[0.02, 0.05, 0.85, 10]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, 12.6, 0]}>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshStandardMaterial
          color="#fde047"
          emissive="#fbbf24"
          emissiveIntensity={isNight ? 1.8 : 0.3}
          metalness={0.6}
        />
      </mesh>
    </group>
  );
}

/** Tempat sampah & hidran kota */
function StreetProps({ position }: { position: [number, number, number] }) {
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
function CafeTable({
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
      {/* 2 kursi */}
      {[-0.78, 0.78].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.44, 8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.04, 12]} />
            <meshStandardMaterial color="#b45309" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Lampu penyeberangan di dekat zebra cross */
function CrossingSignal({
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
function CitySignpost({ position }: { position: [number, number, number] }) {
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

/** Kunang-kunang di taman saat malam */
function Fireflies({ center }: { center: [number, number, number] }) {
  const ref = useRef<THREE.Points>(null);
  const count = 28;
  const { positions, seeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 2 + (i % 5) * 1.1;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = 0.6 + (i % 4) * 0.45;
      pos[i * 3 + 2] = Math.sin(a) * r;
      s[i] = i * 0.7;
    }
    return { positions: pos, seeds: s };
  }, []);

  useFrame(({ clock }) => {
    const geo = ref.current?.geometry;
    if (!geo) return;
    const arr = geo.attributes.position.array as Float32Array;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] = 0.7 + Math.sin(t * 1.6 + seeds[i]) * 0.45;
      arr[i * 3] += Math.cos(t * 0.8 + seeds[i]) * 0.004;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} position={center}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.14}
        color="#bef264"
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}

/** Lampu taman pendek (bollard) di sepanjang jalur setapak */
function BollardLight({
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

const BILLBOARD_SLIDES = [
  { title: "ENUMA CITY", sub: "Virtual Office · Live", bg: "#0f172a", accent: "#38bdf8" },
  { title: "LUNARA CAFE", sub: "Kopi Susu & Pastry", bg: "#3d150c", accent: "#f59e0b" },
  { title: "STASIUN ENUMA", sub: "Naik Trem Gratis!", bg: "#1e3a8a", accent: "#4ade80" },
];

/** Billboard LED animasi berganti slide tiap 4 detik */
function LedBillboard({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % BILLBOARD_SLIDES.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  const textures = useMemo(
    () =>
      BILLBOARD_SLIDES.map((s) => {
        const c = document.createElement("canvas");
        c.width = 512;
        c.height = 256;
        const g = c.getContext("2d");
        if (g) {
          g.fillStyle = s.bg;
          g.fillRect(0, 0, 512, 256);
          g.fillStyle = s.accent;
          g.fillRect(0, 0, 512, 16);
          g.fillRect(0, 240, 512, 16);
          g.fillStyle = "#ffffff";
          g.font = "bold 52px sans-serif";
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(s.title, 256, 108);
          g.fillStyle = s.accent;
          g.font = "bold 28px sans-serif";
          g.fillText(s.sub, 256, 168);
        }
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      }),
    [],
  );

  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  const tex = textures[slideIdx];

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Tiang penyangga */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 3.0, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Rangka layar */}
      <mesh position={[0, 3.5, 0]}>
        <boxGeometry args={[3.9, 2.0, 0.22]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Layar LED */}
      <mesh position={[0, 3.5, 0.12]}>
        <planeGeometry args={[3.65, 1.75]} />
        <meshStandardMaterial
          map={tex}
          emissive="#ffffff"
          emissiveMap={tex}
          emissiveIntensity={0.85}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

/** Dekorasi taman, trotoar, dan fasilitas kota */
export function CityDecorations({ isNight = false }: { isNight?: boolean }) {
  return (
    <group>
      {/* ============ JALUR SETAPAK PENGHUBUNG (ZEBRA CROSS -> TAMAN & STASIUN) ============ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.017, 34]} receiveShadow>
        <planeGeometry args={[3.2, 16.5]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5.8, 0.017, 32.5]} receiveShadow>
        <planeGeometry args={[10.5, 2.4]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
      </mesh>

      {/* ============ TAMAN KOTA SELATAN (z: 27 s.d. 38, aman dari jalan z<=25.5) ============ */}
      {/* Paving bundar taman */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-16, 0.018, 32.5]} receiveShadow>
        <circleGeometry args={[5.4, 32]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-16, 0.02, 32.5]}>
        <ringGeometry args={[5.15, 5.4, 32]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>

      {/* Lampu taman pendek di sisi jalur setapak */}
      {[28, 33, 38].map((z) => (
        <group key={`bol-${z}`}>
          <BollardLight position={[-1.9, 0, z]} isNight={isNight} />
          <BollardLight position={[1.9, 0, z]} isNight={isNight} />
        </group>
      ))}

      {/* Air mancur pusat taman */}
      <Fountain position={[-16, 0, 32.5]} isNight={isNight} />

      {/* 4 bangku mengelilingi air mancur */}
      <ParkBench position={[-16, 0, 28.4]} rotation={[0, 0, 0]} />
      <ParkBench position={[-16, 0, 36.6]} rotation={[0, Math.PI, 0]} />
      <ParkBench position={[-20.1, 0, 32.5]} rotation={[0, Math.PI / 2, 0]} />
      <ParkBench position={[-11.9, 0, 32.5]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Pohon rindang di sekitar taman */}
      <LowPolyTree position={[-25, 0, 29]} scale={2.1} />
      <LowPolyTree position={[-26, 0, 36]} scale={1.9} />
      <LowPolyTree position={[-6, 0, 29]} scale={2.0} />
      <LowPolyTree position={[-6, 0, 36]} scale={1.8} />

      {/* Menara jam taman kota */}
      <ClockTower position={[-32, 0, 32.5]} isNight={isNight} />

      {/* Kunang-kunang khusus malam hari di taman */}
      {isNight && <Fireflies center={[-16, 0, 32.5]} />}

      {/* Area kafe outdoor berpayung */}
      <CafeTable position={[35.5, 0, 12.2]} umbrellaColor="#ef4444" />
      <CafeTable position={[-8.2, 0, 34.5]} umbrellaColor="#0284c7" />

      {/* Lampu penyeberangan & papan petunjuk arah */}
      <CrossingSignal position={[-2.8, 0, 17.8]} rotationY={0} />
      <CrossingSignal position={[2.8, 0, 26.2]} rotationY={Math.PI} />
      <CitySignpost position={[3.6, 0, 13.5]} />
      <LedBillboard position={[20.5, 0, 15.8]} rotationY={0} />

      {/* Pot bunga di tepi taman */}
      {[-22, -19, -13, -10].map((x, i) => (
        <PlanterBox
          key={`park-fl-${x}`}
          position={[x, 0, 26.6]}
          flowerColor={FLOWER_COLORS[i % FLOWER_COLORS.length]}
        />
      ))}

      {/* ============ TROTOAR & HALTE JALAN SELATAN ============ */}
      <BusStop position={[-22, 0, 17.2]} rotationY={0} isNight={isNight} />
      <BusStop position={[16, 0, 17.2]} rotationY={0} isNight={isNight} />

      {/* Pot bunga sepanjang trotoar selatan (menghindari zebra cross x=-2..2 & halte) */}
      {[-34, -12, -6, 6, 26, 34].map((x, i) => (
        <PlanterBox
          key={`south-fl-${x}`}
          position={[x, 0, 17.3]}
          flowerColor={FLOWER_COLORS[(i + 1) % FLOWER_COLORS.length]}
        />
      ))}

      {/* Tempat sampah & hidran di trotoar */}
      <StreetProps position={[-15, 0, 13.6]} />
      <StreetProps position={[8, 0, 13.6]} />
      <StreetProps position={[31, 0, 13.6]} />

      {/* ============ TROTOAR JALAN UTARA ============ */}
      {[-34, -18, -6, 10, 22, 34].map((x, i) => (
        <PlanterBox
          key={`north-fl-${x}`}
          position={[x, 0, -25.3]}
          flowerColor={FLOWER_COLORS[(i + 2) % FLOWER_COLORS.length]}
        />
      ))}
    </group>
  );
}
