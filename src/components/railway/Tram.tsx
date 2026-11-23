// src/components/railway/Tram.tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { CAR_SPACING, TRAM, poseAt, stepTram, tram } from "@/lib/tramRuntime";
import { TramCar } from "@/components/railway/TramCar";

export function Tram() {
  const carRefs = useRef<(Group | null)[]>([]);

  useFrame(({ clock }, delta) => {
    stepTram(clock.elapsedTime, delta);

    for (let i = 0; i < TRAM.carCount; i++) {
      const car = carRefs.current[i];
      if (!car) continue;
      const p = poseAt(tram.head - i * CAR_SPACING);
      car.position.set(p.x, 0, p.z);
      car.rotation.set(0, p.angle, 0);
    }
  });

  return (
    <group>
      {Array.from({ length: TRAM.carCount }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            carRefs.current[i] = el;
          }}
        >
          <TramCar />
        </group>
      ))}
    </group>
  );
}