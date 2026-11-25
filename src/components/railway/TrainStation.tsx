// src/components/railway/TrainStation.tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { isTramStopped, stepTramView } from "@/lib/tramRuntime";

type TrainStationProps = {
  position?: [number, number, number];
};

const CANOPY_POST_X = [-12, -4, 4, 12];
const CANOPY_POST_Z = [-1.2, 1.2];
const BENCH_X = [-8, 8];

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
      {/* Peron */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[26, 0.6, 3]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>

      {/* Garis kuning tepi peron */}
      <mesh position={[0, 0.61, 1.25]}>
        <boxGeometry args={[26, 0.02, 0.25]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>

      {/* Tiang kanopi */}
      {CANOPY_POST_X.flatMap((x) =>
        CANOPY_POST_Z.map((z) => (
          <mesh key={`post-${x}-${z}`} position={[x, 2.2, z]} castShadow>
            <boxGeometry args={[0.25, 4, 0.25]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        )),
      )}

      {/* Atap kanopi */}
      <mesh position={[0, 4.3, 0]} castShadow>
        <boxGeometry args={[26.6, 0.25, 3.8]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.6} />
      </mesh>

      {/* Bangku */}
      {BENCH_X.map((x) => (
        <group key={`bench-${x}`} position={[x, 0.4, 0.6]}>
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[2, 0.15, 0.5]} />
            <meshStandardMaterial color="#92400e" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.5, -0.25]} castShadow>
            <boxGeometry args={[2, 0.6, 0.1]} />
            <meshStandardMaterial color="#92400e" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Papan nama & status kedatangan trem */}
      <Html position={[0, 3.4, -1.6]} center>
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
