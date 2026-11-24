// src/components/WorldLighting.tsx
// Siklus siang-malam untuk kota: langit, kabut, bintang, dan cahaya.
// Fase dihitung dari jam server, jadi semua pemain melihat kondisi yang sama.
import { RainEffect, type WeatherOverride } from "@/components/RainEffect";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Sky, Stars } from "@react-three/drei";
import { lightingAt, type SkyLighting } from "@/config/dayCycle";

/** Seberapa sering warna & cahaya diperbarui. 1 jam dunia = 50 detik. */
const UPDATE_MS = 500;
/** Kabut di kota: mulai tipis dari jarak ini, dan hilang sepenuhnya di jarak far */
const FOG_NEAR = 120;
const FOG_FAR = 420;

export type TimeMode = "live" | "istirahat" | "pagi" | "sore" | "malam";

/** Jam fixed untuk mode Pagi / Sore / Malam */
const FIXED_HOUR: Record<Exclude<TimeMode, "live">, number> = {
  istirahat: 12,
  pagi: 8,
  sore: 17,
  malam: 21,
};

/** Jam WIB sekarang, termasuk menit (contoh 9.5 = 09:30) */
function wibHour(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h + m / 60;
}

/** Fase siklus untuk jam tertentu: jam 6 = fase 0 (terbit), sesuai dayCycle */
function hourToPhase(hour: number): number {
  return ((((hour - 6) % 24) + 24) % 24) / 24;
}

function lightingFor(mode: TimeMode): SkyLighting {
  const hour = mode === "live" ? wibHour() : FIXED_HOUR[mode];
  return lightingAt(hourToPhase(hour));
}

export function WorldLighting({
  timeMode = "live",
  weatherOverride = null,
}: {
  timeMode?: TimeMode;
  weatherOverride?: WeatherOverride;
}) {
  const [l, setL] = useState<SkyLighting>(() => lightingFor(timeMode));
  const fog = useMemo(() => new THREE.Fog("#ffffff", FOG_NEAR, FOG_FAR), []);

  useEffect(() => {
    setL(lightingFor(timeMode));
    const id = window.setInterval(() => setL(lightingFor(timeMode)), UPDATE_MS);
    return () => window.clearInterval(id);
  }, [timeMode]);

  useEffect(() => {
    fog.color.copy(l.fog);
  }, [fog, l.fog]);

  return (
    <>
      <primitive attach="fog" object={fog} />
      <color attach="background" args={[l.bg.getStyle()]} />

      <Sky
        sunPosition={l.sunPosition}
        turbidity={l.turb}
        rayleigh={l.ray}
        mieCoefficient={l.mie}
        mieDirectionalG={l.mieG}
      />

      {l.stars > 0.3 && (
        <Stars
          radius={180}
          depth={60}
          count={2500}
          factor={3}
          saturation={0}
          fade
          speed={0.4}
        />
      )}

      <ambientLight intensity={l.amb} color="#ffffff" />
      <directionalLight
        position={l.lightPosition}
        intensity={l.sunI}
        color={l.sun}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={120}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />
      <hemisphereLight
        color={l.hemiSky}
        groundColor={l.hemiGround}
        intensity={l.hemi}
      />
      <RainEffect override={weatherOverride} />
    </>
  );
}