import * as THREE from "three";
import { useMemo } from "react";
import { Html, useGLTF } from "@react-three/drei";
import type { InteriorConfig } from "@/config/buildings";

const _size = new THREE.Vector3();

function meshMaxDim(mesh: THREE.Mesh): number {
  const geo = mesh.geometry;
  if (!geo) return 0;
  if (!geo.boundingBox) geo.computeBoundingBox();
  if (!geo.boundingBox) return 0;
  geo.boundingBox.getSize(_size);
  return Math.max(_size.x, _size.y, _size.z);
}

/**
 * Interior satu gedung. Seluruh ruangan (dinding, lantai, meja, dll.)
 * berasal dari file .glb di public/buildings. Batas gerak dan collision
 * mengikuti `bounds` dan `obstacles` di konfigurasi.
 */
export function InteriorEnvironment({ config }: { config: InteriorConfig }) {
  const { scene } = useGLTF(config.model);
  const { bounds, exit, accent, name, modelCenter, modelRotationY } = config;

  // Aktifkan bayangan hanya untuk elemen struktural/besar agar shadow pass ringan
  useMemo(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        const dim = meshMaxDim(mesh);
        mesh.castShadow = dim >= 0.8;
        mesh.receiveShadow = dim >= 0.4;
      }
      if (obj !== scene) {
        obj.updateMatrix();
        obj.matrixAutoUpdate = false;
      }
    });
  }, [scene]);

  return (
    <group>
      {/* Model dipusatkan di (0,0) lalu diputar, sehingga pintu menghadap +Z */}
      <group rotation={[0, modelRotationY, 0]}>
        <primitive
          object={scene}
          position={[-modelCenter[0], 0, -modelCenter[2]]}
        />
      </group>

      {/* Papan nama di dinding belakang */}
      <Html position={[0, 3.0, bounds.minZ + 0.3]} center>
        <div className="px-3 py-1 rounded-lg bg-white/90 text-xs font-bold text-slate-700 shadow whitespace-nowrap">
          {name}
        </div>
      </Html>

      {/* Penanda pintu keluar */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[exit.position[0], 0.03, exit.position[2]]}
      >
        <planeGeometry args={[1.6, 1.0]} />
        <meshStandardMaterial color={accent} transparent opacity={0.5} />
      </mesh>
      <Html position={[exit.position[0], 0.8, exit.position[2]]} center>
        <div className="px-2 py-0.5 rounded-md bg-white/90 text-[10px] font-semibold text-slate-600 shadow whitespace-nowrap">
          Keluar
        </div>
      </Html>
    </group>
  );
}
