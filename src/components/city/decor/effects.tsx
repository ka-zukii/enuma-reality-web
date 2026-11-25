import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Kunang-kunang di taman saat malam */
export function Fireflies({ center }: { center: [number, number, number] }) {
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
