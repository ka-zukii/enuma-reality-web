import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CITY_DOORS } from "@/config/doors";
import { doorReady, playerPos } from "@/lib/playerPosition";

/** Pintu geser kaca berbingkai aluminium + gagang */
export function SlidingDoors({
  frontZ,
  doorCfgKey,
  entrance,
  glassColor,
  isNight,
}: {
  frontZ: number;
  doorCfgKey: string;
  entrance: [number, number, number];
  glassColor: string;
  isNight: boolean;
}) {
  const doorCfg = CITY_DOORS[doorCfgKey];
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const openRef = useRef(0);

  useFrame((_, delta) => {
    if (!doorCfg) return;
    const dx = playerPos.x - entrance[0];
    const dz = playerPos.z - entrance[2];
    const near = Math.hypot(dx, dz) <= doorCfg.openRadius;
    const target = near ? 1 : 0;
    openRef.current += (target - openRef.current) * Math.min(1, delta * 5);
    const p = openRef.current;

    if (leftRef.current) leftRef.current.position.x = -0.52 - 0.85 * p;
    if (rightRef.current) rightRef.current.position.x = 0.52 + 0.85 * p;
    doorReady[doorCfgKey] = p > 0.95;
  });

  return (
    <group position={[0, 0.2, frontZ]}>
      {/* Kusen pintu */}
      <mesh position={[0, 1.15, 0.02]}>
        <boxGeometry args={[2.38, 2.32, 0.1]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>
      {/* Latar dalam pintu */}
      <mesh position={[0, 1.15, 0.08]}>
        <planeGeometry args={[2.05, 2.18]} />
        <meshStandardMaterial
          color={isNight ? "#fef3c7" : "#1e293b"}
          emissive={isNight ? "#f59e0b" : "#000000"}
          emissiveIntensity={isNight ? 0.65 : 0}
        />
      </mesh>
      {/* Daun pintu kiri */}
      <group ref={leftRef} position={[-0.52, 1.12, 0.1]}>
        <mesh>
          <boxGeometry args={[0.98, 2.15, 0.05]} />
          <meshStandardMaterial
            color={glassColor}
            transparent
            opacity={0.72}
            roughness={0.1}
            metalness={0.25}
          />
        </mesh>
        <mesh position={[0.38, 0, 0.04]}>
          <boxGeometry args={[0.04, 0.55, 0.04]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>
      </group>
      {/* Daun pintu kanan */}
      <group ref={rightRef} position={[0.52, 1.12, 0.1]}>
        <mesh>
          <boxGeometry args={[0.98, 2.15, 0.05]} />
          <meshStandardMaterial
            color={glassColor}
            transparent
            opacity={0.72}
            roughness={0.1}
            metalness={0.25}
          />
        </mesh>
        <mesh position={[-0.38, 0, 0.04]}>
          <boxGeometry args={[0.04, 0.55, 0.04]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>
      </group>
    </group>
  );
}
