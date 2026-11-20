import { type ReactNode, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const GHOST_OPACITY = 0.35;

/** Redupkan avatar pemain yang sedang reconnecting (ditahan server selama grace period) */
export function GhostGroup({
  dim,
  children,
}: {
  dim: boolean;
  children: ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  // null = belum pernah diterapkan, true = sedang redup, false = sudah normal
  const appliedRef = useRef<boolean | null>(null);

  useFrame(() => {
    const root = groupRef.current;
    if (!root) return;

    // Saat redup, terapkan setiap frame karena material Text dibuat secara asinkron.
    // Saat normal, cukup satu kali.
    if (dim || appliedRef.current !== false) {
      applyDim(root, dim);
      appliedRef.current = dim;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function applyDim(root: THREE.Object3D, dim: boolean) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;

    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];

    for (const mat of materials) {
      // Simpan nilai asli sekali, lalu pulihkan dari nilai itu
      if (mat.userData.baseOpacity === undefined) {
        mat.userData.baseOpacity = mat.opacity;
        mat.userData.baseTransparent = mat.transparent;
      }
      const baseOpacity = mat.userData.baseOpacity as number;
      const baseTransparent = mat.userData.baseTransparent as boolean;

      const transparent = dim || baseTransparent;
      if (mat.transparent !== transparent) {
        mat.transparent = transparent;
        mat.needsUpdate = true;
      }
      mat.opacity = dim ? baseOpacity * GHOST_OPACITY : baseOpacity;
    }
  });
}
