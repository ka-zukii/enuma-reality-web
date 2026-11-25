import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LowPolyCar } from "@/components/CityProps";
import { LANES, laneLength, sampleLane } from "@/components/city/life/lanes";
import { CAR_COLORS, REDUCED_MOTION } from "@/components/city/life/shared";

interface CarSpec {
  lane: "outer" | "inner";
  speed: number;
  /** Posisi awal 0..1 sepanjang lintasan */
  offset: number;
  color: string;
}

const CARS: CarSpec[] = [
  { lane: "outer", speed: 4.2, offset: 0.05, color: CAR_COLORS[0] },
  { lane: "outer", speed: 3.8, offset: 0.3, color: CAR_COLORS[1] },
  { lane: "outer", speed: 4.0, offset: 0.56, color: CAR_COLORS[3] },
  { lane: "outer", speed: 3.9, offset: 0.82, color: CAR_COLORS[5] },
  { lane: "inner", speed: 4.1, offset: 0.12, color: CAR_COLORS[2] },
  { lane: "inner", speed: 3.7, offset: 0.46, color: CAR_COLORS[4] },
  { lane: "inner", speed: 4.0, offset: 0.78, color: CAR_COLORS[0] },
];

const SAFE_FOLLOW_DIST = 10.0;

/** Siklus lampu lalu lintas 18 detik: 0-9s hijau, 9-11s kuning, 11-18s merah */
export function getTrafficSignal(elapsed: number): "green" | "yellow" | "red" {
  const m = elapsed % 18;
  if (m < 9) return "green";
  if (m < 11) return "yellow";
  return "red";
}

export function Traffic({ isNight = false }: { isNight?: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const distRef = useRef<number[]>(
    CARS.map((c) => c.offset * laneLength(LANES[c.lane])),
  );

  useFrame(({ clock }, delta) => {
    if (REDUCED_MOTION) return;
    const dt = Math.min(delta, 0.05);
    const dists = distRef.current;
    const signal = getTrafficSignal(clock.elapsedTime);

    for (let i = 0; i < CARS.length; i++) {
      const c = CARS[i];
      const lane = LANES[c.lane];
      const total = laneLength(lane);
      const cur = dists[i];
      const curSample = sampleLane(lane, cur);
      const curTx = curSample.tx * lane.dir;

      let blocked = false;
      for (let j = 0; j < CARS.length; j++) {
        if (i === j || CARS[j].lane !== c.lane) continue;
        const other = dists[j];
        const forwardDist =
          lane.dir > 0
            ? (other - cur + total) % total
            : (cur - other + total) % total;
        if (forwardDist > 0 && forwardDist < SAFE_FOLLOW_DIST) {
          blocked = true;
          break;
        }
      }

      // Berhenti di belakang zebra cross (x = 0) saat lampu merah/kuning
      if (!blocked && signal !== "green" && Math.abs(curTx) > 0.7) {
        if (curTx > 0 && curSample.x >= -5.5 && curSample.x <= -2.6) {
          blocked = true;
        } else if (curTx < 0 && curSample.x <= 5.5 && curSample.x >= 2.6) {
          blocked = true;
        }
      }

      if (!blocked) {
        dists[i] = (((cur + lane.dir * c.speed * dt) % total) + total) % total;
      }

      const g = refs.current[i];
      if (!g) continue;
      const sample = sampleLane(lane, dists[i]);
      const tx = sample.tx * lane.dir;
      const tz = sample.tz * lane.dir;
      g.position.set(sample.x, 0, sample.z);
      g.rotation.y = Math.atan2(-tx, -tz);
    }
  });

  return (
    <group>
      {CARS.map((c, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <LowPolyCar
            position={[0, 0, 0]}
            color={c.color}
            isNight={isNight}
            spinning
          />
        </group>
      ))}
    </group>
  );
}
