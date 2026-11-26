import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
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

/** Cari mesh berdasarkan nama, abaikan spasi, titik, dan garis bawah (nama di GLTF sudah disanitasi) */
function normName(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

type DoorRuntime = {
  id: string;
  openAngle: number;
  hinge: { x: number; z: number };
  parts: { mesh: THREE.Object3D; orig: THREE.Matrix4 }[];
};

/**
 * Interior satu gedung. Seluruh ruangan (dinding, lantai, meja, dll.)
 * berasal dari file .glb di public/buildings. Batas gerak dan collision
 * mengikuti `bounds` dan `obstacles` di konfigurasi.
 */
export function InteriorEnvironment({
  config,
  openDoors = {},
}: {
  config: InteriorConfig;
  openDoors?: Record<string, boolean>;
}) {
  const { scene } = useGLTF(config.model);
  const { bounds, exit, accent, name, modelCenter, modelRotationY, doors } = config;

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

  // Setiap pintu: daun & knob-nya, engsel dalam koordinat .glb, dan matriks awal
  const doorRuntime = useMemo<DoorRuntime[]>(() => {
    if (!doors || doors.length === 0) return [];
    const c = Math.cos(modelRotationY);
    const s = Math.sin(modelRotationY);
    return doors.map((d) => {
      const wanted = d.parts.map(normName);
      const parts: DoorRuntime["parts"] = [];
      scene.traverse((obj) => {
        if (wanted.includes(normName(obj.name))) {
          parts.push({ mesh: obj, orig: obj.matrix.clone() });
        }
      });
      const hx = d.hinge[0];
      const hz = d.hinge[2];
      return {
        id: d.id,
        openAngle: d.openAngle,
        // Kebalikan dari rotasi & pergeseran model di render (koordinat interior -> .glb)
        hinge: {
          x: hx * c - hz * s + modelCenter[0],
          z: hx * s + hz * c + modelCenter[2],
        },
        parts,
      };
    });
  }, [scene, doors, modelRotationY, modelCenter]);

  const angles = useRef<Record<string, number>>({});
  const pivotT = useMemo(() => new THREE.Matrix4(), []);
  const pivotR = useMemo(() => new THREE.Matrix4(), []);
  const pivotBack = useMemo(() => new THREE.Matrix4(), []);
  const tmp = useMemo(() => new THREE.Matrix4(), []);

  // Animasi semua pintu: tiap daun berputar di sekitar engselnya
  useFrame((_, delta) => {
    for (const d of doorRuntime) {
      const cur = angles.current[d.id] ?? 0;
      const target = openDoors[d.id] ? d.openAngle : 0;
      const next = THREE.MathUtils.damp(cur, target, 8, delta);
      angles.current[d.id] = next;

      pivotT.makeTranslation(d.hinge.x, 0, d.hinge.z);
      pivotR.makeRotationY(next);
      pivotBack.makeTranslation(-d.hinge.x, 0, -d.hinge.z);
      tmp.copy(pivotT).multiply(pivotR).multiply(pivotBack);

      for (const part of d.parts) {
        part.mesh.matrix.copy(tmp).multiply(part.orig);
        part.mesh.matrixWorldNeedsUpdate = true;
      }
    }
  });

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