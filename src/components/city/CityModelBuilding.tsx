import { useEffect, useMemo, useRef } from "react";
import { Html, RoundedBox } from "@react-three/drei";
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
  position?: [number, number];
  center?: [number, number];
  top: number;
  showLabel?: boolean;
  isNight?: boolean;
}

const LABEL_STYLE: Record<
  string,
  { subtitle: string; icon: "shop" | "cafe" | "office" }
> = {
  "warung-madura": { subtitle: "Jajanan & Minuman", icon: "shop" },
  indomart: { subtitle: "Minimarket & Kebutuhan Harian", icon: "shop" },
  "enuma-hq": { subtitle: "Pusat Kantor Virtual", icon: "office" },
  "lunara-cafe": { subtitle: "Kopi & Pastry", icon: "cafe" },
};

/** Membuat tekstur papan nama gedung berbasis Canvas */
function makeSignTexture(
  title: string,
  subtitle: string,
  bg: string,
  fg: string,
  accent: string,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  if (g) {
    g.fillStyle = bg;
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = accent;
    g.fillRect(0, 0, 512, 12);
    g.fillRect(0, 116, 512, 12);
    g.fillStyle = fg;
    g.font = "bold 46px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(title, 256, 54);
    g.font = "600 20px sans-serif";
    g.globalAlpha = 0.85;
    g.fillText(subtitle, 256, 92);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function SignBoard({
  title,
  subtitle,
  bg,
  fg,
  accent,
  position,
  size = [4.2, 0.9],
  isNight = false,
}: {
  title: string;
  subtitle: string;
  bg: string;
  fg: string;
  accent: string;
  position: [number, number, number];
  size?: [number, number];
  isNight?: boolean;
}) {
  const tex = useMemo(
    () => makeSignTexture(title, subtitle, bg, fg, accent),
    [title, subtitle, bg, fg, accent],
  );
  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[size[0] + 0.14, size[1] + 0.14, 0.14]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={size} />
        <meshStandardMaterial
          map={tex}
          emissive="#ffffff"
          emissiveMap={tex}
          emissiveIntensity={isNight ? 0.85 : 0.2}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

/** Pintu geser kaca berbingkai aluminium + gagang */
function SlidingDoors({
  frontZ,
  doorCfgKey,
  entrance,
  glassColor,
  isNight,
}: {
  frontZ: number;
  doorCfgKey: string;
  entrance: [number, number, number];
  glassColor: string;
  isNight: boolean;
}) {
  const doorCfg = CITY_DOORS[doorCfgKey];
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const openRef = useRef(0);

  useFrame((_, delta) => {
    if (!doorCfg) return;
    const dx = playerPos.x - entrance[0];
    const dz = playerPos.z - entrance[2];
    const near = Math.hypot(dx, dz) <= doorCfg.openRadius;
    const target = near ? 1 : 0;
    openRef.current += (target - openRef.current) * Math.min(1, delta * 5);
    const p = openRef.current;

    if (leftRef.current) leftRef.current.position.x = -0.52 - 0.85 * p;
    if (rightRef.current) rightRef.current.position.x = 0.52 + 0.85 * p;
    doorReady[doorCfgKey] = p > 0.95;
  });

  return (
    <group position={[0, 0.2, frontZ]}>
      {/* Kusen pintu */}
      <mesh position={[0, 1.15, 0.02]}>
        <boxGeometry args={[2.38, 2.32, 0.1]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Latar dalam pintu */}
      <mesh position={[0, 1.15, 0.08]}>
        <planeGeometry args={[2.05, 2.18]} />
        <meshStandardMaterial
          color={isNight ? "#fef3c7" : "#1e293b"}
          emissive={isNight ? "#f59e0b" : "#000000"}
          emissiveIntensity={isNight ? 0.65 : 0}
        />
      </mesh>
      {/* Daun pintu kiri */}
      <group ref={leftRef} position={[-0.52, 1.12, 0.1]}>
        <mesh>
          <boxGeometry args={[0.98, 2.15, 0.05]} />
          <meshStandardMaterial
            color={glassColor}
            transparent
            opacity={0.72}
            roughness={0.1}
            metalness={0.25}
          />
        </mesh>
        <mesh position={[0.38, 0, 0.04]}>
          <boxGeometry args={[0.04, 0.55, 0.04]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
      {/* Daun pintu kanan */}
      <group ref={rightRef} position={[0.52, 1.12, 0.1]}>
        <mesh>
          <boxGeometry args={[0.98, 2.15, 0.05]} />
          <meshStandardMaterial
            color={glassColor}
            transparent
            opacity={0.72}
            roughness={0.1}
            metalness={0.25}
          />
        </mesh>
        <mesh position={[-0.38, 0, 0.04]}>
          <boxGeometry args={[0.04, 0.55, 0.04]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Gedung eksterior kota berbasis Three.js ringan dengan detail sesuai masing-masing .glb.
 */
export function CityModelBuilding({
  config,
  info,
  onSelect,
  top,
  showLabel = true,
  isNight = false,
}: CityModelBuildingProps) {
  const { x: fx, z: fz, w, d } = config.footprint;
  const frontZ = d / 2;
  const key = config.key;

  const style = LABEL_STYLE[key] ?? {
    subtitle: info.category,
    icon: "office" as const,
  };

  const winColor = isNight ? "#fef08a" : "#93c5fd";
  const winEmissive = isNight ? "#fbbf24" : "#000000";
  const winEmissiveI = isNight ? 0.78 : 0;

  const buildingHeight =
    key === "warung-madura"
      ? 3.3
      : key === "indomart"
        ? 4.9
        : key === "enuma-hq"
          ? 6.6
          : 8.0;

  const labelY = Math.max(top, buildingHeight) + 1.1;

  return (
    <group position={[fx, 0, fz]}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelect(info);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        {/* Teras / pondasi */}
        <mesh position={[0, 0.1, 0]} receiveShadow>
          <boxGeometry args={[w + 0.4, 0.2, d + 0.4]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
        </mesh>

        {/* ==================== 1. WARUNG MADURA ==================== */}
        {key === "warung-madura" && (
          <>
            <RoundedBox
              args={[w, 3.2, d]}
              radius={0.1}
              smoothness={2}
              position={[0, 1.8, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#a4b2bb" roughness={0.7} />
            </RoundedBox>
            {/* Atap miring modern */}
            <mesh position={[0, 3.6, 0.2]} rotation={[0.08, 0, 0]} castShadow>
              <boxGeometry args={[w + 0.6, 0.22, d + 0.8]} />
              <meshStandardMaterial color="#7c2d12" roughness={0.55} />
            </mesh>
            {/* Pita oranye & krem fasad */}
            <mesh position={[0, 3.1, frontZ + 0.04]}>
              <boxGeometry args={[w + 0.1, 0.55, 0.08]} />
              <meshStandardMaterial color="#ea580c" roughness={0.45} />
            </mesh>
            <SignBoard
              title="WARUNG MADURA"
              subtitle="BUKA 24 JAM · JAJANAN & GALON"
              bg="#9a3412"
              fg="#ffffff"
              accent="#facc15"
              position={[0, 3.45, frontZ + 0.16]}
              size={[4.8, 0.82]}
              isNight={isNight}
            />
            {/* Etalase kaca di kiri & kanan pintu */}
            {[-2.5, 2.5].map((x) => (
              <group key={x} position={[x, 1.45, frontZ + 0.03]}>
                <mesh>
                  <boxGeometry args={[2.1, 1.85, 0.08]} />
                  <meshStandardMaterial color="#ebebe5" roughness={0.5} />
                </mesh>
                <mesh position={[0, 0, 0.045]}>
                  <planeGeometry args={[1.9, 1.65]} />
                  <meshStandardMaterial
                    color={winColor}
                    emissive={winEmissive}
                    emissiveIntensity={winEmissiveI}
                    roughness={0.15}
                  />
                </mesh>
              </group>
            ))}
            {/* Galon biru & Tabung gas hijau khas Warung Madura di teras */}
            {[-3.4, -2.9].map((x) => (
              <mesh key={`galon-${x}`} position={[x, 0.45, frontZ + 0.55]}>
                <cylinderGeometry args={[0.16, 0.16, 0.5, 12]} />
                <meshStandardMaterial color="#2769d2" roughness={0.25} />
              </mesh>
            ))}
            {[3.0, 3.45].map((x) => (
              <mesh key={`gas-${x}`} position={[x, 0.4, frontZ + 0.55]}>
                <cylinderGeometry args={[0.15, 0.15, 0.4, 12]} />
                <meshStandardMaterial color="#22c55e" roughness={0.4} />
              </mesh>
            ))}
            <SlidingDoors
              frontZ={frontZ}
              doorCfgKey={key}
              entrance={config.entrance}
              glassColor="#99bfcc"
              isNight={isNight}
            />
          </>
        )}

        {/* ==================== 2. INDOMARET ==================== */}
        {key === "indomart" && (
          <>
            <RoundedBox
              args={[w, 4.7, d]}
              radius={0.12}
              smoothness={2}
              position={[0, 2.55, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#a4b2bb" roughness={0.65} />
            </RoundedBox>
            {/* Lis atap charcoal */}
            <mesh position={[0, 5.0, 0]} castShadow>
              <boxGeometry args={[w + 0.4, 0.3, d + 0.4]} />
              <meshStandardMaterial color="#232323" roughness={0.5} />
            </mesh>
            {/* 3 Pita warna ikonik Indomaret (Biru - Merah - Kuning) */}
            <mesh position={[0, 4.45, frontZ + 0.04]}>
              <boxGeometry args={[w + 0.08, 0.42, 0.1]} />
              <meshStandardMaterial color="#0284c7" roughness={0.35} />
            </mesh>
            <mesh position={[0, 4.12, frontZ + 0.04]}>
              <boxGeometry args={[w + 0.08, 0.2, 0.1]} />
              <meshStandardMaterial color="#dc2626" roughness={0.35} />
            </mesh>
            <mesh position={[0, 3.92, frontZ + 0.04]}>
              <boxGeometry args={[w + 0.08, 0.14, 0.1]} />
              <meshStandardMaterial color="#facc15" roughness={0.35} />
            </mesh>
            <SignBoard
              title="INDOMARET"
              subtitle="MUDAH & HEMAT"
              bg="#0369a1"
              fg="#ffffff"
              accent="#dc2626"
              position={[0, 4.25, frontZ + 0.18]}
              size={[5.4, 0.92]}
              isNight={isNight}
            />
            {/* Kanopi pintu */}
            <mesh position={[0, 2.8, frontZ + 0.7]} rotation={[0.08, 0, 0]}>
              <boxGeometry args={[6.4, 0.14, 1.4]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} />
            </mesh>
            {/* Etalase kaca lebar */}
            {[-5.6, 5.6].map((x) => (
              <group key={x} position={[x, 1.65, frontZ + 0.03]}>
                <mesh>
                  <boxGeometry args={[6.6, 2.3, 0.08]} />
                  <meshStandardMaterial color="#232323" roughness={0.4} />
                </mesh>
                <mesh position={[0, 0, 0.045]}>
                  <planeGeometry args={[6.3, 2.1]} />
                  <meshStandardMaterial
                    color={winColor}
                    emissive={winEmissive}
                    emissiveIntensity={winEmissiveI}
                    roughness={0.12}
                  />
                </mesh>
              </group>
            ))}
            {/* Unit chiller/AC di atap */}
            {[-4, 4].map((x) => (
              <mesh key={`ac-${x}`} position={[x, 5.4, -4]}>
                <boxGeometry args={[1.8, 0.65, 1.4]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.6} />
              </mesh>
            ))}
            <SlidingDoors
              frontZ={frontZ}
              doorCfgKey={key}
              entrance={config.entrance}
              glassColor="#99bfcc"
              isNight={isNight}
            />
          </>
        )}

        {/* ==================== 3. ENUMA HQ ==================== */}
        {key === "enuma-hq" && (
          <>
            <RoundedBox
              args={[w, 6.4, d]}
              radius={0.14}
              smoothness={2}
              position={[0, 3.4, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#a4b2bb" roughness={0.55} />
            </RoundedBox>
            {/* Parapet atap gelap */}
            <mesh position={[0, 6.75, 0]} castShadow>
              <boxGeometry args={[w + 0.4, 0.34, d + 0.4]} />
              <meshStandardMaterial color="#1e1e1e" roughness={0.45} />
            </mesh>
            {/* Curtain-wall kaca 2 lantai + mullion vertikal */}
            {[1.7, 4.7].map((y) =>
              [-4.2, 4.2].map((x) => (
                <group key={`hq-${y}-${x}`} position={[x, y, frontZ + 0.03]}>
                  <mesh>
                    <boxGeometry args={[4.4, 2.1, 0.08]} />
                    <meshStandardMaterial color="#1e1e1e" roughness={0.3} />
                  </mesh>
                  <mesh position={[0, 0, 0.045]}>
                    <planeGeometry args={[4.15, 1.9]} />
                    <meshStandardMaterial
                      color={isNight ? "#fde68a" : "#64748b"}
                      emissive={winEmissive}
                      emissiveIntensity={winEmissiveI}
                      roughness={0.1}
                      metalness={0.4}
                    />
                  </mesh>
                </group>
              )),
            )}
            {/* Kaca tengah lantai 2 */}
            <group position={[0, 4.7, frontZ + 0.03]}>
              <mesh>
                <boxGeometry args={[3.2, 2.1, 0.08]} />
                <meshStandardMaterial color="#1e1e1e" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0, 0.045]}>
                <planeGeometry args={[2.95, 1.9]} />
                <meshStandardMaterial
                  color={isNight ? "#fde68a" : "#64748b"}
                  emissive={winEmissive}
                  emissiveIntensity={winEmissiveI}
                  roughness={0.1}
                  metalness={0.4}
                />
              </mesh>
            </group>
            {/* Aksen kayu hangat & kanopi baja pintu masuk */}
            <mesh position={[0, 1.6, frontZ + 0.01]}>
              <boxGeometry args={[3.4, 2.8, 0.1]} />
              <meshStandardMaterial color="#8a6143" roughness={0.5} />
            </mesh>
            <mesh position={[0, 2.95, frontZ + 0.85]} castShadow>
              <boxGeometry args={[5.2, 0.16, 1.7]} />
              <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
            </mesh>
            <SignBoard
              title="ENUMA TECHNOLOGY"
              subtitle="VIRTUAL OFFICE HEADQUARTERS"
              bg="#0f172a"
              fg="#ffffff"
              accent="#38bdf8"
              position={[0, 6.25, frontZ + 0.18]}
              size={[5.8, 0.92]}
              isNight={isNight}
            />
            <SlidingDoors
              frontZ={frontZ}
              doorCfgKey={key}
              entrance={config.entrance}
              glassColor="#99bfcc"
              isNight={isNight}
            />
          </>
        )}

        {/* ==================== 4. LUNARA CAFE ==================== */}
        {key === "lunara-cafe" && (
          <>
            <RoundedBox
              args={[w, 7.8, d]}
              radius={0.14}
              smoothness={2}
              position={[0, 4.1, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#c4aa86" roughness={0.65} />
            </RoundedBox>
            {/* Lis kayu espresso & atap */}
            <mesh position={[0, 8.15, 0]} castShadow>
              <boxGeometry args={[w + 0.45, 0.34, d + 0.45]} />
              <meshStandardMaterial color="#3d150c" roughness={0.5} />
            </mesh>
            {/* Panel kayu oak lantai 1 */}
            <mesh position={[0, 1.65, frontZ + 0.01]}>
              <boxGeometry args={[w + 0.05, 3.0, 0.08]} />
              <meshStandardMaterial color="#6f411f" roughness={0.55} />
            </mesh>
            {/* Kanopi terakota kafe */}
            <mesh position={[0, 3.15, frontZ + 0.85]} rotation={[0.16, 0, 0]} castShadow>
              <boxGeometry args={[w - 1.2, 0.16, 1.7]} />
              <meshStandardMaterial color="#cc582b" roughness={0.5} />
            </mesh>
            {/* Balkon lantai 2 dengan pagar kaca */}
            <mesh position={[0, 4.2, frontZ + 0.65]}>
              <boxGeometry args={[w - 1.5, 0.14, 1.3]} />
              <meshStandardMaterial color="#3d150c" roughness={0.5} />
            </mesh>
            <mesh position={[0, 4.75, frontZ + 1.24]}>
              <boxGeometry args={[w - 1.6, 0.9, 0.06]} />
              <meshStandardMaterial
                color="#8dccc2"
                transparent
                opacity={0.55}
                roughness={0.1}
              />
            </mesh>
            {/* Jendela kaca lantai 1 & 2 */}
            {[1.6, 5.6].map((y) =>
              [-4.3, 4.3].map((x) => (
                <group key={`cafe-${y}-${x}`} position={[x, y, frontZ + 0.04]}>
                  <mesh>
                    <boxGeometry args={[4.2, 2.0, 0.08]} />
                    <meshStandardMaterial color="#3d150c" roughness={0.45} />
                  </mesh>
                  <mesh position={[0, 0, 0.045]}>
                    <planeGeometry args={[3.95, 1.8]} />
                    <meshStandardMaterial
                      color={isNight ? "#fef08a" : "#8dccc2"}
                      emissive={winEmissive}
                      emissiveIntensity={winEmissiveI}
                      roughness={0.15}
                    />
                  </mesh>
                </group>
              )),
            )}
            <SignBoard
              title="LUNARA CAFE"
              subtitle="COFFEE · PASTRY · LOUNGE"
              bg="#3d150c"
              fg="#fef3c7"
              accent="#cc582b"
              position={[0, 7.35, frontZ + 0.18]}
              size={[5.2, 0.92]}
              isNight={isNight}
            />
            {/* Unit AC di dinding samping seperti pada cafe.glb */}
            {[-4, 0, 4].map((zOff) => (
              <mesh key={`cafe-ac-${zOff}`} position={[w / 2 + 0.25, 3.2, zOff]}>
                <boxGeometry args={[0.45, 0.6, 0.95]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
              </mesh>
            ))}
            <SlidingDoors
              frontZ={frontZ}
              doorCfgKey={key}
              entrance={config.entrance}
              glassColor="#98c0cc"
              isNight={isNight}
            />
          </>
        )}

        {/* Jendela samping untuk semua gedung */}
        {[-d * 0.22, d * 0.22].map((zOff) =>
          [-w / 2 - 0.02, w / 2 + 0.02].map((xSide, idx) => (
            <mesh
              key={`side-${zOff}-${idx}`}
              position={[xSide, buildingHeight * 0.45, zOff]}
              rotation={[0, idx === 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
            >
              <planeGeometry args={[3.2, 1.45]} />
              <meshStandardMaterial
                color={winColor}
                emissive={winEmissive}
                emissiveIntensity={winEmissiveI}
                roughness={0.2}
                metalness={0.2}
              />
            </mesh>
          )),
        )}
      </group>

      {showLabel && (
        <Html
          position={[0, labelY, 0]}
          center
          distanceFactor={22}
          zIndexRange={[10, 0]}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect(info);
            }}
            className="group cursor-pointer flex items-center gap-1.5 p-1.5 pl-3 rounded-full bg-slate-900/95 hover:bg-slate-900 text-white border border-cyan-400/80 shadow-[0_4px_20px_rgba(56,189,248,0.35)] transition-all duration-200 hover:scale-105 select-none"
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
