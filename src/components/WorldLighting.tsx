// src/components/WorldLighting.tsx
// Siklus siang-malam untuk kota: langit, kabut, bintang, dan cahaya.
// Fase dihitung dari jam server, jadi semua pemain melihat kondisi yang sama.
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Sky, Stars } from "@react-three/drei";
import { cyclePhase, lightingAt, type SkyLighting } from "@/config/dayCycle";
import { worldNowMs } from "@/lib/worldClock";

/** Seberapa sering warna & cahaya diperbarui. 1 jam dunia = 50 detik. */
const UPDATE_MS = 500;
/** Kabut di kota: mulai tipis dari jarak ini, dan hilang sepenuhnya di jarak far */
const FOG_NEAR = 120;
const FOG_FAR = 420;

function currentLighting(): SkyLighting {
  return lightingAt(cyclePhase(worldNowMs()));
}

export function WorldLighting() {
  const [l, setL] = useState<SkyLighting>(currentLighting);
  const fog = useMemo(() => new THREE.Fog("#ffffff", FOG_NEAR, FOG_FAR), []);

  useEffect(() => {
    const id = window.setInterval(() => setL(currentLighting()), UPDATE_MS);
    return () => window.clearInterval(id);
  }, []);

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
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
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
    </>
  );
}
