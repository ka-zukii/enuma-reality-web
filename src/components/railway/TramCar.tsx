// src/components/railway/TramCar.tsx
import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { BED_Y } from "@/components/railway/RailTrack";

export const TRAM_MODEL_URL = "/models/tram.glb";
useGLTF.preload(TRAM_MODEL_URL);

/** Model asli sekitar 4,7 m. Diskalakan 2,2x supaya sekitar 10 m, ukuran trem kota Eropa. */
const MODEL_SCALE = 2.2;

/** Titik tengah dan dasar roda model asli (sebelum skala), dari bounding box GLB tanpa pantograph */
const MODEL_CENTER_X = 0.174;
const MODEL_CENTER_Z = 0.164;
const MODEL_BOTTOM_Y = 0.184;

/**
 * Model menghadap -Z, sedangkan trem bergerak ke +Z.
 * Ubah ke 0 jika ternyata sudah benar.
 */
const MODEL_ROTATION_Y = Math.PI;

export function TramCar() {
  const { scene } = useGLTF(TRAM_MODEL_URL);

  const model = useMemo(() => {
    const root = scene.clone(true);
    root.getObjectByName("pantograph_3")?.removeFromParent();
    root.traverse((obj) => {
      if ((obj as any).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return root;
  }, [scene]);

  return (
    // Urutan transformasi: skala dan putar dulu, lalu naikkan ke permukaan lintasan
    <group position={[0, BED_Y, 0]} rotation={[0, MODEL_ROTATION_Y, 0]} scale={MODEL_SCALE}>
      <primitive
        object={model}
        position={[-MODEL_CENTER_X, -MODEL_BOTTOM_Y, -MODEL_CENTER_Z]}
      />
    </group>
  );
}