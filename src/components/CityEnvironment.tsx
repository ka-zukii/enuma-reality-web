import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  BUILDINGS,
  type BuildingConfig,
  type BuildingInfo,
  type BuildingKey,
} from "@/config/buildings";
import { CityModelBuilding } from "@/components/city/CityModelBuilding";
import {
  LowPolyTree,
  LowPolyCar,
  StreetLamp,
  ParkBench,
} from "@/components/CityProps";
import { CityLife, Sway } from "@/components/city/CityLife";
import { CityDecorations } from "@/components/city/CityDecorations";
import type { TimeMode } from "@/components/WorldLighting";
import {
  makeAsphaltTexture,
  makeGrassTexture,
  makePavingTexture,
} from "@/lib/cityTextures";
import { Tram } from "./railway/Tram";
import { TrainStation } from "@/components/railway/TrainStation";
import { RailTrack } from "@/components/railway/RailTrack";

/* ============================================================
   TATA LETAK KOTA (satu tempat untuk semua koordinat jalan)
   Jalan keliling: barat x = -44, timur x = 44, utara z = -30, selatan z = 22.
   Lebar jalan 7 m. Gedung di tengah, pusat z = -4.
   ============================================================ */
const ROAD = { west: -44, east: 44, north: -30, south: 22, width: 7 };

const cityConfig = (key: BuildingKey): BuildingConfig => {
  const found = BUILDINGS.find((b) => b.key === key);
  if (!found) throw new Error(`Gedung tidak ditemukan: ${key}`);
  return found;
};

/**
 * Pusat bounding box setiap model (sebelum diputar) dan tinggi atapnya.
 * Diukur dari file .glb. Interior tidak memakai nilai ini.
 */
const CITY_MODEL: Record<
  string,
  {
    center: [number, number];
    top: number;
    position: [number, number];
    /** Rotasi khusus kota: pintu depan menghadap +Z (jalan selatan) */
    rotationY: number;
  }
> = {
  "warung-madura": {
    center: [0.33, -5.54],
    top: 3.0,
    position: [-30.85, -4],
    rotationY: 0,
  },
  indomart: {
    center: [-5.14, -0.04],
    top: 5.05,
    position: [-12.65, -4],
    rotationY: Math.PI / 2,
  },
  "enuma-hq": {
    center: [-1.46, 1.86],
    top: 4.06,
    position: [8.7, -4],
    rotationY: -Math.PI / 2,
  },
  "lunara-cafe": {
    center: [-12.5, -0.5],
    top: 8.13,
    position: [27.5, -4],
    rotationY: -Math.PI / 2,
  },
};

/** Teks info gedung untuk panel detail */
const CITY_INFO: Record<string, BuildingInfo> = {
  "warung-madura": {
    buildingKey: "warung-madura",
    name: "Warung Madura",
    category: "Warung & Makanan Cepat",
    desc: "Warung kecil dengan jajanan, minuman dingin, dan makanan siap saji untuk rekan kerja yang sedang lapar.",
    status: "Buka · Jajanan & Minuman",
  },
  indomart: {
    buildingKey: "indomart",
    name: "Indomart",
    category: "Minimarket",
    desc: "Minimarket untuk kebutuhan harian, minuman dingin, dan camilan selama bekerja.",
    status: "Buka · Kebutuhan Harian",
  },
  "enuma-hq": {
    buildingKey: "enuma-hq",
    name: "Kantor Enuma Technology",
    category: "Pusat Virtual Workspace",
    desc: "Gedung pusat virtual office 3 lantai lengkap dengan ruang kerja kolaboratif, auditorium meeting 3D, dan private booth.",
    status: "Aktif · Server Utama",
  },
  "lunara-cafe": {
    buildingKey: "lunara-cafe",
    name: "Lunara Cafe",
    category: "Cafe & Kopi",
    desc: "Kafe hangat untuk ngopi, makan ringan, dan mengobrol santai bersama rekan kerja.",
    status: "Buka · Menu Kopi & Pastry",
  },
};

interface CityEnvironmentProps {
  onBuildingSelect: (building: BuildingInfo) => void;
  /** false = sembunyikan label gedung (mode orang pertama) */
  showLabels?: boolean;
  timeMode?: TimeMode;
}

function isNightTime(mode: TimeMode): boolean {
  if (mode === "malam" || mode === "sore") return true;
  if (mode === "pagi" || mode === "istirahat") return false;
  const h = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Jakarta",
    }).format(new Date()),
  );
  return h >= 17 || h < 6;
}

const H = ROAD.width / 2; // setengah lebar jalan

function roundedRectPath(
  path: THREE.Path,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  r: number,
) {
  path.moveTo(minX + r, minY);
  path.lineTo(maxX - r, minY);
  path.quadraticCurveTo(maxX, minY, maxX, minY + r);
  path.lineTo(maxX, maxY - r);
  path.quadraticCurveTo(maxX, maxY, maxX - r, maxY);
  path.lineTo(minX + r, maxY);
  path.quadraticCurveTo(minX, maxY, minX, maxY - r);
  path.lineTo(minX, minY + r);
  path.quadraticCurveTo(minX, minY, minX + r, minY);
}

function makeCurvedRoadGeo(): THREE.ShapeGeometry {
  const { west, east, north, south } = ROAD;
  // Shape di bidang XY diputar -PI/2 pada sumbu X, sehingga Y = -Z
  const outer = new THREE.Shape();
  roundedRectPath(outer, west - H, -(south + H), east + H, -(north - H), 9.5);

  const inner = new THREE.Path();
  roundedRectPath(inner, west + H, -(south - H), east - H, -(north + H), 3.5);
  outer.holes.push(inner);

  return new THREE.ShapeGeometry(outer, 16);
}

function makeCurbGeo(): THREE.ShapeGeometry {
  const { west, east, north, south } = ROAD;
  const outer = new THREE.Shape();
  roundedRectPath(
    outer,
    west - H - 0.35,
    -(south + H + 0.35),
    east + H + 0.35,
    -(north - H - 0.35),
    9.85,
  );
  const inner = new THREE.Path();
  roundedRectPath(
    inner,
    west - H,
    -(south + H),
    east + H,
    -(north - H),
    9.5,
  );
  outer.holes.push(inner);
  return new THREE.ShapeGeometry(outer, 16);
}

export function CityEnvironment({
  onBuildingSelect,
  showLabels = true,
  timeMode = "live",
}: CityEnvironmentProps) {
  const { north, south, west, east } = ROAD;
  const roadGeo = useMemo(() => makeCurvedRoadGeo(), []);
  const curbGeo = useMemo(() => makeCurbGeo(), []);
  const grassTex = useMemo(() => makeGrassTexture(), []);
  const pavingTex = useMemo(() => makePavingTexture(), []);
  const asphaltTex = useMemo(() => makeAsphaltTexture(), []);
  const isNight = isNightTime(timeMode);

  useEffect(
    () => () => {
      roadGeo.dispose();
      curbGeo.dispose();
      grassTex.dispose();
      pavingTex.dispose();
      asphaltTex.dispose();
    },
    [roadGeo, curbGeo, grassTex, pavingTex, asphaltTex],
  );

  return (
    <group>
      {/* ========================================================
          LANTAI & GROUND DASAR KOTA
          ======================================================== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial map={grassTex} roughness={0.92} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial map={pavingTex} roughness={0.82} />
      </mesh>

      {/* ========================================================
          JALAN KELILING KOTA (sudut melengkung, satu mesh tanpa z-fighting)
          ======================================================== */}
      <mesh
        geometry={roadGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        receiveShadow
      >
        <meshStandardMaterial map={asphaltTex} roughness={0.75} />
      </mesh>
      <mesh
        geometry={curbGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.028, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>

      {/* Marka putus-putus jalan selatan & utara */}
      {[-36, -28, -20, -12, -4, 4, 12, 20, 28, 36].map((x) => (
        <group key={`hz-${x}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, south]}>
            <planeGeometry args={[4, 0.3]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, north]}>
            <planeGeometry args={[4, 0.3]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Marka putus-putus jalan barat & timur */}
      {[-20, -14, -8, -2, 4, 10, 16].map((z) => (
        <group key={`vert-${z}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[west, 0.025, z]}>
            <planeGeometry args={[0.3, 3.5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[east, 0.025, z]}>
            <planeGeometry args={[0.3, 3.5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Zebra cross di selatan dan utara (sejajar lebar jalur penyeberangan) */}
      {[-2.2, -1.1, 0, 1.1, 2.2].map((offset) => (
        <group key={`zebra-${offset}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, south + offset]}>
            <planeGeometry args={[3.2, 0.55]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, north + offset]}>
            <planeGeometry args={[3.2, 0.55]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Area parkir di selatan jalan */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[20, 0.022, 30]} receiveShadow>
        <planeGeometry args={[26, 7.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      {[10, 14, 18, 22, 26, 30].map((x) => (
        <mesh key={`park-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.026, 30]}>
          <planeGeometry args={[0.2, 5.5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* ========================================================
          EMPAT GEDUNG UTAMA: model .glb yang sama dengan interiornya
          ======================================================== */}
      {(["warung-madura", "indomart", "enuma-hq", "lunara-cafe"] as const).map(
        (key) => (
          <CityModelBuilding
            key={key}
            config={cityConfig(key)}
            info={CITY_INFO[key]}
            onSelect={onBuildingSelect}
            position={[cityConfig(key).footprint.x, cityConfig(key).footprint.z]}
            center={CITY_MODEL[key].center}
            top={CITY_MODEL[key].top}
            showLabel={showLabels}
            isNight={isNight}
          />
        ),
      )}

      {/* Gedung pendukung di belakang jalan utara */}
      {[-30, -12, 12, 30].map((x) => (
        <group key={`back-${x}`} position={[x, 0, -40]}>
          <mesh position={[0, 5, 0]} castShadow receiveShadow>
            <boxGeometry args={[10, 10, 9]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
          </mesh>
          <mesh position={[0, 10.2, 0]} castShadow>
            <boxGeometry args={[10.4, 0.4, 9.4]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          {/* Jendela fasad depan */}
          {[2.5, 5, 7.5].map((y) =>
            [-2.8, 0, 2.8].map((wx) => (
              <mesh key={`w-${y}-${wx}`} position={[wx, y, 4.52]}>
                <planeGeometry args={[1.6, 1.4]} />
                <meshStandardMaterial
                  color={isNight ? "#fde68a" : "#7dd3fc"}
                  emissive={isNight ? "#f59e0b" : "#000000"}
                  emissiveIntensity={isNight ? 0.9 : 0}
                  roughness={0.2}
                  metalness={0.3}
                />
              </mesh>
            )),
          )}
        </group>
      ))}

      {/* ========================================================
          POHON, BANGKU, DAN SEMAK
          ======================================================== */}
      {/* Pohon di sudut kota, di luar gedung */}
      <Sway position={[-39, 0, -14]} phase={0.8}>
        <LowPolyTree position={[0, 0, 0]} scale={2.2} />
      </Sway>
      <Sway position={[-39, 0, 8]} phase={2.4}>
        <LowPolyTree position={[0, 0, 0]} scale={2.0} />
      </Sway>
      <Sway position={[39, 0, -12]} phase={3.9}>
        <LowPolyTree position={[0, 0, 0]} scale={2.3} />
      </Sway>
      <Sway position={[39, 0, 8]} phase={5.2}>
        <LowPolyTree position={[0, 0, 0]} scale={2.1} />
      </Sway>
      {/* Pohon di area utara, di depan gedung belakang */}
      <Sway position={[-8, 0, -21]} phase={1.1}>
        <LowPolyTree position={[0, 0, 0]} scale={2.0} />
      </Sway>
      <Sway position={[6, 0, -21]} phase={2.9}>
        <LowPolyTree position={[0, 0, 0]} scale={1.8} />
      </Sway>
      <Sway position={[24, 0, -21]} phase={4.2}>
        <LowPolyTree position={[0, 0, 0]} scale={2.1} />
      </Sway>

      {/* Bangku di trotoar selatan dan utara */}
      <ParkBench position={[-8, 0, 13.5]} rotation={[0, Math.PI, 0]} />
      <ParkBench position={[6, 0, 13.5]} rotation={[0, Math.PI, 0]} />
      <ParkBench position={[14, 0, 13.5]} rotation={[0, Math.PI, 0]} />
      <ParkBench position={[28, 0, 13.5]} rotation={[0, Math.PI, 0]} />
      <ParkBench position={[6, 0, -23]} rotation={[0, 0, 0]} />

      {/* Semak hias di trotoar selatan */}
      {[-16, -4, 12, 20].map((x) => (
        <mesh key={`bush-${x}`} position={[x, 0.45, 16.5]} castShadow>
          <sphereGeometry args={[0.65, 8, 8]} />
          <meshStandardMaterial color="#16a34a" roughness={0.8} />
        </mesh>
      ))}

      {/* ========================================================
          MOBIL PARKIR (mobil yang melaju dikelola CityLife)
          ======================================================== */}
      <LowPolyCar position={[14, 0, 30]} rotation={[0, 0, 0]} color="#f8fafc" />
      <LowPolyCar position={[22, 0, 30]} rotation={[0, 0, 0]} color="#2563eb" />
      <LowPolyCar position={[28, 0, 30]} rotation={[0, 0, 0]} color="#0f172a" />

      {/* ========================================================
          LAMPU JALAN
          ======================================================== */}
      <StreetLamp position={[-32, 0, 13.5]} isNight={isNight} />
      <StreetLamp position={[-4, 0, 13.5]} isNight={isNight} />
      <StreetLamp position={[24, 0, 13.5]} isNight={isNight} />
      <StreetLamp position={[-32, 0, -23.5]} isNight={isNight} />
      <StreetLamp position={[-4, 0, -23.5]} isNight={isNight} />
      <StreetLamp position={[24, 0, -23.5]} isNight={isNight} />

      {/* ========================================================
          CITY LIGHTS (pencahayaan titik ringan khusus malam/sore)
          ======================================================== */}
      {isNight && (
        <group>
          <pointLight
            position={[-24, 4.2, 15]}
            color="#fde68a"
            intensity={18}
            distance={24}
            decay={2}
          />
          <pointLight
            position={[4, 4.2, 15]}
            color="#fde68a"
            intensity={18}
            distance={24}
            decay={2}
          />
          <pointLight
            position={[28, 4.2, 15]}
            color="#fde68a"
            intensity={18}
            distance={24}
            decay={2}
          />
          <pointLight
            position={[-16, 2.5, 32.5]}
            color="#38bdf8"
            intensity={14}
            distance={18}
            decay={2}
          />
          <pointLight
            position={[0, 4.0, -23]}
            color="#fef08a"
            intensity={14}
            distance={26}
            decay={2}
          />
        </group>
      )}

      {/* ========================================================
          KEHIDUPAN & DEKORASI KOTA
          ======================================================== */}
      <CityDecorations isNight={isNight} />
      <CityLife isNight={isNight} />
      <RailTrack />
      <TrainStation position={[0, 0, 46.6]} />
      <Tram />
    </group>
  );
}