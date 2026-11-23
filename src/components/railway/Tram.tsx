// src/components/railway/Tram.tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { TRAM, carPose, stepTramView } from "@/lib/tramRuntime";
import { TramCar } from "@/components/railway/TramCar";

export function Tram() {
  const carRefs = useRef<(Group | null)[]>([]);

  useFrame(({ clock }) => {
    // Posisi dari server (sama untuk semua pemain), bukan simulasi lokal
    stepTramView(clock.elapsedTime);

    for (let i = 0; i < TRAM.carCount; i++) {
      const car = carRefs.current[i];
      if (!car) continue;
      // Pose gerbong dihitung dari ujung-ujungnya, sama dengan yang dipakai penumpang
      const p = carPose(i);
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
