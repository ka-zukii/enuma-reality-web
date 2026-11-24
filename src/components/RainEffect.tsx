// Efek hujan dan petir di kota. Mengikuti data cuaca BMKG (intensitas & petir).
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { useWeather, type RainIntensity } from "@/hooks/useWeather";

const MAX_DROPS = 2000;
const AREA = 90;
const HEIGHT = 30;
const LEN = 0.9;

/** Jumlah tetesan, kecepatan, dan kepekatan per intensitas */
const LEVEL: Record<RainIntensity, { drops: number; speed: number; opacity: number }> = {
  light: { drops: 500, speed: 0.8, opacity: 0.3 },
  moderate: { drops: 1000, speed: 1, opacity: 0.45 },
  heavy: { drops: 1500, speed: 1.3, opacity: 0.6 },
};

/** Tombol Hujan / Badai di panel status menimpa cuaca BMKG */
export type WeatherOverride = "hujan" | "badai" | null;

export function RainEffect({ override = null }: { override?: WeatherOverride }) {
  const weather = useWeather();
  let kind = weather?.kind;
  let intensity: RainIntensity = weather?.intensity ?? "light";
  let thunder = weather?.thunder ?? false;

  if (override === "hujan") {
    kind = "rain";
    intensity = "moderate";
    thunder = false;
  } else if (override === "badai") {
    kind = "storm";
    intensity = "heavy";
    thunder = true;
  }

  if (kind !== "rain" && kind !== "storm") return null;
  const level = LEVEL[kind === "storm" ? "heavy" : intensity];
  return <Rain level={level} thunder={thunder || kind === "storm"} />;
}

function makeBolt(arr: Float32Array) {
  // Garis petir zig-zag dari langit ke tanah, di posisi acak
  let x = (Math.random() - 0.5) * AREA;
  let z = (Math.random() - 0.5) * AREA;
  let y = HEIGHT + 8;
  const steps = 8;
  for (let i = 0; i < steps; i++) {
    const nx = x + (Math.random() - 0.5) * 4;
    const nz = z + (Math.random() - 0.5) * 4;
    const ny = y - (HEIGHT + 8) / steps;
    const o = i * 6;
    arr[o] = x; arr[o + 1] = y; arr[o + 2] = z;
    arr[o + 3] = nx; arr[o + 4] = ny; arr[o + 5] = nz;
    x = nx; z = nz; y = ny;
  }
}

function Rain({ level, thunder }: { level: { drops: number; speed: number; opacity: number }; thunder: boolean }) {
  const ref = useRef<THREE.LineSegments>(null);
  const boltRef = useRef<THREE.LineSegments>(null);
  const lightRef = useRef<THREE.AmbientLight>(null);
  const nextFlash = useRef(3 + Math.random() * 6);
  const flashLeft = useRef(0);

  const { xs, ys, zs, speeds, positions, boltPos } = useMemo(() => {
    const xs = new Float32Array(MAX_DROPS);
    const ys = new Float32Array(MAX_DROPS);
    const zs = new Float32Array(MAX_DROPS);
    const speeds = new Float32Array(MAX_DROPS);
    const positions = new Float32Array(MAX_DROPS * 6);
    for (let i = 0; i < MAX_DROPS; i++) {
      xs[i] = (Math.random() - 0.5) * AREA;
      ys[i] = Math.random() * HEIGHT;
      zs[i] = (Math.random() - 0.5) * AREA;
      speeds[i] = 18 + Math.random() * 8;
    }
    const boltPos = new Float32Array(8 * 6);
    return { xs, ys, zs, speeds, positions, boltPos };
  }, []);

  useFrame((_, delta) => {
    // Hujan: hanya sebagian tetesan yang digambar, sesuai intensitas
    const geo = ref.current?.geometry;
    if (geo) {
      const attr = geo.attributes.position as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < level.drops; i++) {
        ys[i] -= speeds[i] * level.speed * delta;
        if (ys[i] < 0) {
          ys[i] = HEIGHT;
          xs[i] = (Math.random() - 0.5) * AREA;
          zs[i] = (Math.random() - 0.5) * AREA;
        }
        const o = i * 6;
        arr[o] = xs[i]; arr[o + 1] = ys[i]; arr[o + 2] = zs[i];
        arr[o + 3] = xs[i]; arr[o + 4] = ys[i] - LEN; arr[o + 5] = zs[i];
      }
      geo.setDrawRange(0, level.drops * 2);
      attr.needsUpdate = true;
    }

    // Petir: kilatan acak, dengan cahaya dan garis petir sebentar
    if (thunder) {
      nextFlash.current -= delta;
      if (nextFlash.current <= 0) {
        flashLeft.current = 0.25;
        nextFlash.current = 5 + Math.random() * 10;
        const bolt = boltRef.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
        if (bolt) {
          makeBolt(boltPos);
          (bolt.array as Float32Array).set(boltPos);
          bolt.needsUpdate = true;
        }
      }
    } else {
      flashLeft.current = 0;
    }
    flashLeft.current = Math.max(0, flashLeft.current - delta);
    const flashing = flashLeft.current > 0;
    if (lightRef.current) lightRef.current.intensity = flashing ? 1.6 : 0;
    if (boltRef.current) boltRef.current.visible = flashing;
  });

  return (
    <>
      <lineSegments ref={ref} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#cbd5e1" transparent opacity={level.opacity} />
      </lineSegments>

      {thunder && (
        <>
          <ambientLight ref={lightRef} intensity={0} color="#e0f2fe" />
          <lineSegments ref={boltRef} visible={false} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[boltPos, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#f8fafc" transparent opacity={1} />
          </lineSegments>
        </>
      )}
    </>
  );
}