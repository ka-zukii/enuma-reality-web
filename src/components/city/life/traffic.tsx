import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LowPolyCar } from "@/components/CityProps";
import { CAR_COLORS } from "@/components/city/life/shared";
import { createNpcPose, readNpcPose } from "@/lib/npcRuntime";

/* ============================================================
 * MOBIL KOTA
 * Posisi dan arah dikirim server (id "car-0" .. "car-6").
 * Client hanya menempatkan model di pose tersebut.
 * ============================================================ */
const CAR_LOOKS = [
  CAR_COLORS[0],
  CAR_COLORS[1],
  CAR_COLORS[3],
  CAR_COLORS[5],
  CAR_COLORS[2],
  CAR_COLORS[4],
  CAR_COLORS[0],
];

const pose = createNpcPose();

export function Traffic({ isNight = false }: { isNight?: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame(() => {
    for (let i = 0; i < CAR_LOOKS.length; i++) {
      const g = refs.current[i];
      if (!g || !readNpcPose(`car-${i}`, pose)) continue;
      g.position.set(pose.x, 0, pose.z);
      g.rotation.y = pose.yaw;
    }
  });

  return (
    <group>
      {CAR_LOOKS.map((color, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <LowPolyCar
            position={[0, 0, 0]}
            color={color}
            isNight={isNight}
            spinning
          />
        </group>
      ))}
    </group>
  );
}
