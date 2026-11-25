import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const BIRDS = [
  { cx: -14, cz: 32, r: 9, speed: 0.45, y: 11, phase: 0 },
  { cx: -14, cz: 32, r: 10.5, speed: 0.42, y: 12.2, phase: 1.2 },
  { cx: -14, cz: 32, r: 8.2, speed: 0.48, y: 10.4, phase: 2.5 },
  { cx: 20, cz: 32, r: 11, speed: 0.38, y: 13, phase: 0.8 },
  { cx: 20, cz: 32, r: 9.5, speed: 0.41, y: 11.8, phase: 3.1 },
];

function Bird({
  cx,
  cz,
  r,
  speed,
  y,
  phase,
}: (typeof BIRDS)[number]) {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + phase;
    if (groupRef.current) {
      const x = cx + Math.cos(t) * r;
      const z = cz + Math.sin(t) * r;
      groupRef.current.position.set(x, y + Math.sin(t * 2) * 0.4, z);
      groupRef.current.rotation.y = -t;
    }
    const flap = Math.sin(clock.elapsedTime * 9 + phase) * 0.45;
    if (leftWingRef.current) leftWingRef.current.rotation.z = flap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -flap;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[0.12, 0.08, 0.32]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh ref={leftWingRef} position={[-0.18, 0.02, 0]}>
        <boxGeometry args={[0.32, 0.02, 0.14]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh ref={rightWingRef} position={[0.18, 0.02, 0]}>
        <boxGeometry args={[0.32, 0.02, 0.14]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
    </group>
  );
}

/** Kawanan burung terbang melingkar di atas taman & plaza pada siang/sore hari */
export function CityAmbientLife({ isNight = false }: { isNight?: boolean }) {
  if (isNight) return null;
  return (
    <group>
      {BIRDS.map((b, i) => (
        <Bird key={i} {...b} />
      ))}
    </group>
  );
}
