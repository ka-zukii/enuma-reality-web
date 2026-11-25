import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Menara jam taman kota bergaya klasik tinggi (±12 m) dengan 4 muka jam & jarum bergerak */
export function ClockTower({
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
            <meshStandardMaterial
              color="#f59e0b"
              metalness={0.8}
              roughness={0.25}
            />
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
        <meshStandardMaterial
          color="#fbbf24"
          metalness={0.85}
          roughness={0.2}
        />
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
