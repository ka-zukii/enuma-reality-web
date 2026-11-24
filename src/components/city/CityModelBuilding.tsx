import { useMemo, useRef } from "react";
import { Html, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Building2, Coffee, Store } from "lucide-react";
import type { BuildingConfig, BuildingInfo } from "@/config/buildings";
import { CITY_DOORS } from "@/config/doors";
import { doorReady, playerPos } from "@/lib/playerPosition";

interface CityModelBuildingProps {
  config: BuildingConfig;
  info: BuildingInfo;
  onSelect: (info: BuildingInfo) => void;
  /** Posisi pusat footprint di kota [x, z] */
  position: [number, number];
  /** Pusat bounding box model (sebelum diputar), dari hasil pengukuran GLB */
  center: [number, number];
  /** Tinggi atap model (sumbu Y), untuk menaruh label tepat di atasnya */
  top: number;
  /** false = label disembunyikan (mode orang pertama) */
  showLabel?: boolean;
}

/** Subjudul di label gedung kota */
/** Subjudul dan ikon label, sama dengan label asli di kota (ModernBuilding) */
const LABEL_STYLE: Record<string, { subtitle: string; icon: "shop" | "cafe" | "office" }> = {
  "warung-madura": { subtitle: "Jajanan & Minuman", icon: "shop" },
  indomart: { subtitle: "Minimarket & Kebutuhan Harian", icon: "shop" },
  "enuma-hq": { subtitle: "Pusat Kantor Virtual", icon: "office" },
  "lunara-cafe": { subtitle: "Kopi & Pastry", icon: "cafe" },
};

interface DoorPart {
  mesh: THREE.Object3D;
  closed: [number, number, number];
  slide: [number, number, number];
}

/**
 * Gedung di kota yang memakai model .glb yang sama dengan interiornya.
 * Interior tidak ikut berubah: pusat model di kota dihitung terpisah.
 */
export function CityModelBuilding({
  config,
  info,
  onSelect,
  position,
  center,
  top,
  showLabel = true,
}: CityModelBuildingProps) {
  const { scene } = useGLTF(config.interior.model);
  const rotationY = config.interior.modelRotationY;
  const doorCfg = CITY_DOORS[config.key];

  // Salinan terpisah, dengan semua bagian terlihat dan material dua sisi
  const { model, doors } = useMemo(() => {
    const copy = scene.clone(true);

    // Peta nama mesh pintu -> arah geser
    const slideByName = new Map<string, [number, number, number]>();
    for (const group of doorCfg?.groups ?? []) {
      for (const name of group.meshes) slideByName.set(name, group.slide);
    }

    const parts: DoorPart[] = [];

    copy.traverse((obj) => {
      obj.visible = true;
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const cloned = mats.map((m) => {
          const c = m.clone();
          c.side = THREE.DoubleSide;
          return c;
        });
        mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0];
      }

      const slide = slideByName.get(obj.name);
      if (slide) {
        parts.push({
          mesh: obj,
          closed: [obj.position.x, obj.position.y, obj.position.z],
          slide,
        });
      }
    });

    return { model: copy, doors: parts };
  }, [scene, doorCfg]);

  // Progres buka pintu: 0 = tertutup, 1 = terbuka
  const openRef = useRef(0);

  useFrame((_, delta) => {
    if (!doorCfg || doors.length === 0) return;

    const dx = playerPos.x - config.entrance[0];
    const dz = playerPos.z - config.entrance[2];
    const near = Math.hypot(dx, dz) <= doorCfg.openRadius;

    const target = near ? 1 : 0;
    openRef.current += (target - openRef.current) * Math.min(1, delta * 5);
    const p = openRef.current;

    for (const d of doors) {
      d.mesh.position.set(
        d.closed[0] + d.slide[0] * p,
        d.closed[1] + d.slide[1] * p,
        d.closed[2] + d.slide[2] * p,
      );
    }

    doorReady[config.key] = p > 0.95;
  });

  const style = LABEL_STYLE[config.key] ?? { subtitle: info.category, icon: "office" as const };

  return (
    <group position={[position[0], 0, position[1]]}>
      <group
        rotation={[0, rotationY, 0]}
        onClick={(e) => {
          e.stopPropagation();
          // DEBUG: catat nama mesh yang diklik
          console.log("[DEBUG gedung]", config.key, "| mesh:", e.object.name, "| parent:", e.object.parent?.name, "| titik:", e.point.toArray().map((v) => v.toFixed(2)));
          onSelect(info);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <primitive object={model} position={[-center[0], 0, -center[1]]} />
      </group>

      {showLabel && (
      <Html
        position={[0, top + 1.2, 0]}
        center
        distanceFactor={22}
        zIndexRange={[10, 0]}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect(info);
          }}
          className="group cursor-pointer flex items-center gap-1.5 p-1.5 pl-3 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white border border-cyan-400/80 shadow-[0_4px_20px_rgba(56,189,248,0.35)] backdrop-blur-md transition-all duration-200 hover:scale-105 select-none"
        >
          <div className="w-6 h-6 rounded-full bg-linear-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-inner">
            {style.icon === "shop" && <Store className="w-3.5 h-3.5" />}
            {style.icon === "cafe" && <Coffee className="w-3.5 h-3.5" />}
            {style.icon === "office" && <Building2 className="w-3.5 h-3.5" />}
          </div>
          <div className="flex flex-col pr-1">
            <span className="text-xs font-bold tracking-tight text-white whitespace-nowrap leading-tight">
              {info.name}
            </span>
            <span className="text-[10px] text-cyan-200/80 whitespace-nowrap leading-none">
              {style.subtitle}
            </span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-linear-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-[10px] font-semibold text-white shadow-sm flex items-center gap-0.5 whitespace-nowrap">
            Masuk ›
          </div>
        </div>
      </Html>
      )}
    </group>
  );
}