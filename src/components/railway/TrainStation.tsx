// src/components/railway/TrainStation.tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { isTramStopped, stepTramView } from "@/lib/tramRuntime";

type TrainStationProps = {
  position?: [number, number, number];
};

const CANOPY_POST_X = [-12, -4, 4, 12];
const BENCH_X = [-9, -3, 3, 9];
const BIN_X = [-6.5, 6.5];
const TOTEM_X = [-5.5, 5.5];
const PLANTER_X = [-12.2, 12.2];
// Segmen pagar kaca di sisi kota (z = -1.42), menyisakan bukaan tangga di x = -10 dan x = +10
const RAIL_SEGMENTS: { x: number; w: number }[] = [
  { x: -12.1, w: 1.6 },
  { x: 0, w: 17.6 },
  { x: 12.1, w: 1.6 },
];
const ENTRY_STAIR_X = [-10, 10];

function ModernBench({ x }: { x: number }) {
  return (
    <group position={[x, 0.6, -0.55]}>
      {/* Kaki besi */}
      {[-0.75, 0.75].map((lx) => (
        <mesh key={lx} position={[lx, 0.2, 0]} castShadow>
          <boxGeometry args={[0.08, 0.4, 0.46]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* Dudukan kayu */}
      <mesh position={[0, 0.42, 0.04]} castShadow>
        <boxGeometry args={[1.9, 0.07, 0.48]} />
        <meshStandardMaterial color="#b45309" roughness={0.75} />
      </mesh>
      {/* Sandaran kayu */}
      <mesh position={[0, 0.68, -0.18]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[1.9, 0.36, 0.06]} />
        <meshStandardMaterial color="#b45309" roughness={0.75} />
      </mesh>
      {/* Sandaran tangan */}
      {[-0.9, 0.9].map((ax) => (
        <mesh key={ax} position={[ax, 0.56, 0]} castShadow>
          <boxGeometry args={[0.06, 0.05, 0.44]} />
          <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function InfoTotem({ x }: { x: number }) {
  return (
    <group position={[x, 0.6, -0.7]}>
      {/* Bodi totem */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.7, 2.1, 0.16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.35} />
      </mesh>
      {/* Layar jadwal digital */}
      <mesh position={[0, 1.25, 0.085]}>
        <planeGeometry args={[0.56, 1.1]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#38bdf8"
          emissiveIntensity={0.45}
          roughness={0.2}
        />
      </mesh>
      {/* Aksen garis biru di bawah layar */}
      <mesh position={[0, 0.52, 0.085]}>
        <planeGeometry args={[0.56, 0.08]} />
        <meshStandardMaterial
          color="#2563eb"
          emissive="#60a5fa"
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

function TrashBin({ x }: { x: number }) {
  return (
    <group position={[x, 0.6, -0.8]}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.42, 0.76, 0.36]} />
        <meshStandardMaterial color="#334155" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[0.44, 0.05, 0.38]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Indikator pilah hijau & biru */}
      <mesh position={[-0.09, 0.45, 0.185]}>
        <planeGeometry args={[0.14, 0.22]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <mesh position={[0.09, 0.45, 0.185]}>
        <planeGeometry args={[0.14, 0.22]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
    </group>
  );
}

function PlanterBox({ x }: { x: number }) {
  return (
    <group position={[x, 0.6, -0.75]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.9, 0.44, 0.65]} />
        <meshStandardMaterial color="#475569" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.8, 0.04, 0.55]} />
        <meshStandardMaterial color="#5c4033" roughness={1} />
      </mesh>
      {/* Rimbunan tanaman */}
      <mesh position={[-0.18, 0.66, 0]} castShadow>
        <dodecahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial color="#16a34a" roughness={0.85} />
      </mesh>
      <mesh position={[0.16, 0.62, 0.04]} castShadow>
        <dodecahedronGeometry args={[0.21, 0]} />
        <meshStandardMaterial color="#22c55e" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.74, -0.05]} castShadow>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#15803d" roughness={0.85} />
      </mesh>
    </group>
  );
}

function TicketGate({ x }: { x: number }) {
  return (
    <group position={[x, 0.6, -1.05]}>
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[0.22, 0.96, 0.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Pad tap kartu menyala */}
      <mesh position={[0, 0.97, 0.14]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.16, 0.03, 0.2]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#34d399"
          emissiveIntensity={0.7}
        />
      </mesh>
    </group>
  );
}

export function TrainStation({ position = [0, 0, 35.5] }: TrainStationProps) {
  const statusRef = useRef<HTMLDivElement>(null);
  const lastStoppedRef = useRef<boolean | null>(null);

  useFrame(({ clock }) => {
    stepTramView(clock.elapsedTime);
    const stopped = isTramStopped();
    if (stopped !== lastStoppedRef.current && statusRef.current) {
      lastStoppedRef.current = stopped;
      statusRef.current.textContent = stopped
        ? "● TREM TIBA · SILAKAN NAIK"
        : "● TREM DALAM PERJALANAN";
      statusRef.current.style.color = stopped ? "#4ade80" : "#fde047";
    }
  });

  return (
    <group position={position}>
      {/* Struktur dasar peron */}
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[26, 0.56, 3]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>
      {/* Lapisan permukaan peron */}
      <mesh position={[0, 0.58, 0]} receiveShadow>
        <boxGeometry args={[25.9, 0.04, 2.9]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>

      {/* Garis kuning tepi peron (sisi rel +Z) */}
      <mesh position={[0, 0.605, 1.26]}>
        <boxGeometry args={[25.8, 0.015, 0.22]} />
        <meshStandardMaterial color="#facc15" roughness={0.5} />
      </mesh>

      {/* Tangga akses dari sisi kota (-Z) */}
      {ENTRY_STAIR_X.map((sx) => (
        <group key={`stair-${sx}`} position={[sx, 0, -1.7]}>
          <mesh position={[0, 0.14, -0.25]} receiveShadow castShadow>
            <boxGeometry args={[2.2, 0.28, 0.5]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.34, 0.1]} receiveShadow castShadow>
            <boxGeometry args={[2.2, 0.28, 0.45]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Pagar kaca pengaman di sisi belakang (-Z) */}
      {RAIL_SEGMENTS.map((seg) => (
        <group key={`rail-${seg.x}`} position={[seg.x, 0.6, -1.42]}>
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[seg.w, 0.85, 0.04]} />
            <meshStandardMaterial
              color="#bae6fd"
              transparent
              opacity={0.35}
              roughness={0.1}
            />
          </mesh>
          <mesh position={[0, 0.96, 0]} castShadow>
            <boxGeometry args={[seg.w, 0.06, 0.08]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Tiang kanopi dengan dudukan dasar & penopang atas */}
      {CANOPY_POST_X.map((x) => (
        <group key={`post-${x}`} position={[x, 0.6, -0.9]}>
          {/* Base plate */}
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.42, 0.1, 0.42]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Tiang utama */}
          <mesh position={[0, 1.85, 0]} castShadow>
            <boxGeometry args={[0.24, 3.6, 0.24]} />
            <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.4} />
          </mesh>
          {/* Lengan penyangga atap ke arah rel (+Z) */}
          <mesh position={[0, 3.55, 0.9]} rotation={[0.12, 0, 0]} castShadow>
            <boxGeometry args={[0.18, 0.18, 2.2]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Atap kanopi modern bertingkat */}
      <group position={[0, 4.35, 0.1]}>
        {/* Lapisan atap utama */}
        <mesh castShadow>
          <boxGeometry args={[26.8, 0.18, 4.0]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* List biru Enuma di keliling tepi atap */}
        <mesh position={[0, -0.02, 2.01]}>
          <boxGeometry args={[26.82, 0.14, 0.04]} />
          <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, -0.02, -2.01]}>
          <boxGeometry args={[26.82, 0.14, 0.04]} />
          <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={0.3} />
        </mesh>
        {/* Skylight kaca di tengah atap */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[20, 0.06, 1.2]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.45}
            roughness={0.15}
          />
        </mesh>
        {/* Strip lampu LED di bawah kanopi */}
        <mesh position={[0, -0.1, 0.3]}>
          <boxGeometry args={[24, 0.03, 0.18]} />
          <meshStandardMaterial
            color="#fef9c3"
            emissive="#fef08a"
            emissiveIntensity={0.85}
          />
        </mesh>
      </group>

      {/* Bangku modern */}
      {BENCH_X.map((x) => (
        <ModernBench key={`bench-${x}`} x={x} />
      ))}

      {/* Papan informasi digital */}
      {TOTEM_X.map((x) => (
        <InfoTotem key={`totem-${x}`} x={x} />
      ))}

      {/* Tempat sampah pilah */}
      {BIN_X.map((x) => (
        <TrashBin key={`bin-${x}`} x={x} />
      ))}

      {/* Pot tanaman hias */}
      {PLANTER_X.map((x) => (
        <PlanterBox key={`planter-${x}`} x={x} />
      ))}

      {/* Gate tap kartu di kedua ujung tangga */}
      <TicketGate x={-8.6} />
      <TicketGate x={8.6} />

      {/* Papan nama & status kedatangan trem */}
      <Html position={[0, 3.35, -1.65]} center>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            background: "#0f172a",
            color: "#ffffff",
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid rgba(56, 189, 248, 0.45)",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5 }}>
            STASIUN ENUMA
          </span>
          <div
            ref={statusRef}
            style={{ fontSize: 10, fontWeight: 700, color: "#fde047" }}
          >
            ● TREM DALAM PERJALANAN
          </div>
        </div>
      </Html>
    </group>
  );
}
