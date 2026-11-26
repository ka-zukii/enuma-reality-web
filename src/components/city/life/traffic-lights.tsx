import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getNpcSignal } from "@/lib/npcRuntime";

/* ============================================================
 * LAMPU LALU LINTAS AKTIF DI ZEBRA CROSS
 * ============================================================ */
const SIGNAL_POLES: { pos: [number, number, number]; rotY: number }[] = [
  { pos: [-3.8, 0, 26.2], rotY: 0 },
  { pos: [3.8, 0, 17.8], rotY: Math.PI },
  { pos: [-3.8, 0, -25.8], rotY: 0 },
  { pos: [3.8, 0, -34.2], rotY: Math.PI },
];

const OFF_COLOR = new THREE.Color("#1f2937");

const SIGNAL_COLORS = {
  red: new THREE.Color("#e60000"),
  yellow: new THREE.Color("#f5a600"),
  green: new THREE.Color("#00d948"),
};

export function TrafficLights() {
  const redRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const yellowRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const greenRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useFrame(() => {
    const sig = getNpcSignal();
    for (let i = 0; i < SIGNAL_POLES.length; i++) {
      for (let side = 0; side < 2; side++) {
        const idx = i * 2 + side;
        const r = redRefs.current[idx];
        const y = yellowRefs.current[idx];
        const g = greenRefs.current[idx];
        if (r) {
          const on = sig === "red";
          r.color.copy(on ? SIGNAL_COLORS.red : OFF_COLOR);
          r.emissiveIntensity = on ? 1.3 : 0;
        }
        if (y) {
          const on = sig === "yellow";
          y.color.copy(on ? SIGNAL_COLORS.yellow : OFF_COLOR);
          y.emissiveIntensity = on ? 1.15 : 0;
        }
        if (g) {
          const on = sig === "green";
          g.color.copy(on ? SIGNAL_COLORS.green : OFF_COLOR);
          g.emissiveIntensity = on ? 1.15 : 0;
        }
      }
    }
  });

  return (
    <group>
      {SIGNAL_POLES.map((p, i) => (
        <group key={i} position={p.pos} rotation={[0, p.rotY, 0]}>
          {/* Alas beton & flens dasar tiang */}
          <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.16, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Tiang utama & lengan kantilever menjorok ke arah jalan */}
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.095, 4.4, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.35} />
          </mesh>
          {/* Sambungan siku atas */}
          <mesh position={[0, 4.25, -0.05]}>
            <boxGeometry args={[0.18, 0.22, 0.22]} />
            <meshStandardMaterial color="#0f172a" metalness={0.6} />
          </mesh>
          <mesh position={[0, 4.25, -0.85]} castShadow>
            <boxGeometry args={[0.11, 0.11, 1.8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.35} />
          </mesh>

          {/* Kotak lampu menghadap arah datang mobil (+X & -X) */}
          <group position={[0, 4.05, -1.55]} rotation={[0, Math.PI / 2, 0]}>
            {/* Backplate berbingkai kuning tipis agar tegas di siang maupun malam */}
            <mesh>
              <boxGeometry args={[0.58, 1.56, 0.36]} />
              <meshStandardMaterial color="#0f172a" roughness={0.45} metalness={0.3} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.5, 1.48, 0.42]} />
              <meshStandardMaterial color="#090d16" roughness={0.5} />
            </mesh>
            {[0.21, -0.21].map((zFace, side) => {
              const idx = i * 2 + side;
              const rotY = side === 0 ? 0 : Math.PI;
              return (
                <group
                  key={side}
                  position={[0, 0, zFace]}
                  rotation={[0, rotY, 0]}
                >
                  {/* Tudung pelindung cahaya di atas tiap lampu */}
                  {[0.44, 0, -0.44].map((ly) => (
                    <mesh key={ly} position={[0, ly + 0.14, 0.08]} rotation={[0.18, 0, 0]}>
                      <boxGeometry args={[0.32, 0.03, 0.16]} />
                      <meshStandardMaterial color="#090d16" roughness={0.6} />
                    </mesh>
                  ))}

                  <mesh position={[0, 0.44, 0.03]} scale={[1, 1, 0.55]}>
                    <sphereGeometry args={[0.15, 14, 12]} />
                    <meshStandardMaterial
                      ref={(el) => {
                        redRefs.current[idx] = el;
                      }}
                      color="#1f2937"
                      emissive="#e60000"
                      emissiveIntensity={0}
                      roughness={0.2}
                    />
                  </mesh>
                  <mesh position={[0, 0, 0.03]} scale={[1, 1, 0.55]}>
                    <sphereGeometry args={[0.15, 14, 12]} />
                    <meshStandardMaterial
                      ref={(el) => {
                        yellowRefs.current[idx] = el;
                      }}
                      color="#1f2937"
                      emissive="#f5a600"
                      emissiveIntensity={0}
                      roughness={0.2}
                    />
                  </mesh>
                  <mesh position={[0, -0.44, 0.03]} scale={[1, 1, 0.55]}>
                    <sphereGeometry args={[0.15, 14, 12]} />
                    <meshStandardMaterial
                      ref={(el) => {
                        greenRefs.current[idx] = el;
                      }}
                      color="#00d948"
                      emissive="#00d948"
                      emissiveIntensity={1.15}
                      roughness={0.2}
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        </group>
      ))}
    </group>
  );
}
