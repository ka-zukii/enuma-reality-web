import { Html } from "@react-three/drei";
import { Coffee, Gamepad2, Building2, Store } from "lucide-react";

interface BuildingProps {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
  roofColor?: string;
  name: string;
  subtitle?: string;
  tag?: string;
  onClick?: () => void;
  badgeAction?: string;
  badgeIcon?: "game" | "cafe" | "office" | "shop";
  badgePosition?: [number, number, number];
}

export function ModernBuilding({
  position,
  size = [8, 9, 8],
  color = "#ffffff",
  roofColor = "#1e293b",
  name,
  subtitle,
  tag,
  onClick,
  badgeAction = "Info & main ›",
  badgeIcon = "office",
  badgePosition,
}: BuildingProps) {
  const [w, h, d] = size;

  return (
    <group position={position}>
      {/* Dasar pondasi beton / trotoar bawah */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[w + 0.8, 0.2, d + 0.8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>

      {/* Badan Bangunan Utama */}
      <mesh position={[0, h / 2 + 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>

      {/* Lis Pembatas Lantai 2 & Lantai 3 */}
      <mesh position={[0, h * 0.35 + 0.2, 0]}>
        <boxGeometry args={[w + 0.2, 0.25, d + 0.2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, h * 0.68 + 0.2, 0]}>
        <boxGeometry args={[w + 0.2, 0.25, d + 0.2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Atap & Lis Atap Modern */}
      <mesh position={[0, h + 0.3, 0]}>
        <boxGeometry args={[w + 0.4, 0.35, d + 0.4]} />
        <meshStandardMaterial color={roofColor} roughness={0.5} />
      </mesh>

      {/* Kanopi Depan Lantai 1 (Tinggi 2.8m, pas di atas avatar 1.70m) */}
      <mesh position={[0, 2.9, d / 2 + 0.6]} castShadow>
        <boxGeometry args={[w * 0.85, 0.15, 1.2]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Pintu Kaca & Showcase Lantai 1 (Tinggi 2.5m, lebar lapang) */}
      <mesh position={[0, 1.35, d / 2 + 0.02]}>
        <planeGeometry args={[w * 0.82, 2.5]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.7}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Jendela Kaca Lantai 2 */}
      <mesh position={[0, h * 0.52 + 0.2, d / 2 + 0.02]}>
        <planeGeometry args={[w * 0.82, 2.2]} />
        <meshStandardMaterial
          color="#bae6fd"
          roughness={0.2}
          metalness={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Jendela Kaca Lantai 3 */}
      <mesh position={[0, h * 0.83 + 0.2, d / 2 + 0.02]}>
        <planeGeometry args={[w * 0.82, 2.0]} />
        <meshStandardMaterial
          color="#bae6fd"
          roughness={0.2}
          metalness={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Kusen Jendela Vertikal Lantai 2 & 3 */}
      {[-w * 0.25, 0, w * 0.25].map((x) => (
        <mesh key={x} position={[x, h * 0.65, d / 2 + 0.04]}>
          <boxGeometry args={[0.08, h * 0.6, 0.03]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      ))}

      {/* Papan Plang / Spanduk Sewa */}
      {tag && (
        <group position={[0, 3.8, d / 2 + 0.06]}>
          <mesh>
            <planeGeometry args={[w * 0.65, 0.7]} />
            <meshStandardMaterial
              color={tag.includes("DISEWAKAN") ? "#dc2626" : "#0284c7"}
            />
          </mesh>
          <Html position={[0, 0, 0.02]} center transform distanceFactor={18} zIndexRange={[5, 0]}>
            <div className="font-extrabold text-[10px] uppercase tracking-wider text-white px-2 whitespace-nowrap drop-shadow">
              {tag}
            </div>
          </Html>
        </group>
      )}

      {/* Unit AC & Antena di Atap */}
      <mesh position={[w * 0.25, h + 0.75, -d * 0.2]} castShadow>
        <boxGeometry args={[1.2, 0.9, 0.8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      {/* Floating Location Pill vOffice Style */}
      <Html
        position={badgePosition || [0, h + 1.8, 0]}
        center
        distanceFactor={22}
        zIndexRange={[10, 0]}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="group cursor-pointer flex items-center gap-1.5 p-1.5 pl-3 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white border border-cyan-400/80 shadow-[0_4px_20px_rgba(56,189,248,0.35)] backdrop-blur-md transition-all duration-200 hover:scale-105 select-none"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-inner">
            {badgeIcon === "game" && <Gamepad2 className="w-3.5 h-3.5" />}
            {badgeIcon === "cafe" && <Coffee className="w-3.5 h-3.5" />}
            {badgeIcon === "office" && <Building2 className="w-3.5 h-3.5" />}
            {badgeIcon === "shop" && <Store className="w-3.5 h-3.5" />}
          </div>

          <div className="flex flex-col pr-1">
            <span className="text-xs font-bold tracking-tight text-white whitespace-nowrap leading-tight">
              {name}
            </span>
            {subtitle && (
              <span className="text-[10px] text-cyan-200/80 whitespace-nowrap leading-none">
                {subtitle}
              </span>
            )}
          </div>

          <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-[10px] font-semibold text-white shadow-sm flex items-center gap-0.5 whitespace-nowrap">
            {badgeAction}
          </div>
        </div>
      </Html>
    </group>
  );
}

// Pohon Kartun Low Poly (Rescaled: Tinggi 4.5m - 6.5m manusiawi)
export function LowPolyTree({ position, scale = 1.6 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {/* Batang Pohon */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 2.4, 6]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      {/* Daun Tingkat Bawah */}
      <mesh position={[0, 2.6, 0]} castShadow>
        <coneGeometry args={[1.5, 1.8, 7]} />
        <meshStandardMaterial color="#15803d" roughness={0.6} flatShading />
      </mesh>
      {/* Daun Tingkat Tengah */}
      <mesh position={[0, 3.6, 0]} castShadow>
        <coneGeometry args={[1.2, 1.6, 7]} />
        <meshStandardMaterial color="#16a34a" roughness={0.6} flatShading />
      </mesh>
      {/* Daun Tingkat Atas */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <coneGeometry args={[0.8, 1.3, 7]} />
        <meshStandardMaterial color="#22c55e" roughness={0.6} flatShading />
      </mesh>
    </group>
  );
}

// Mobil Realistis Ukuran Manusia (Panjang ~4.2m, Lebar ~1.8m, Tinggi ~1.45m)
export function LowPolyCar({
  position,
  rotation = [0, 0, 0],
  color = "#dc2626",
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Body Bawah Mobil */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.85, 0.52, 4.2]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Kabin / Kaca Atas */}
      <mesh position={[0, 0.88, -0.2]} castShadow>
        <boxGeometry args={[1.6, 0.5, 2.3]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} />
      </mesh>
      {/* Roda 4 Buah (Diameter 0.58m) */}
      {[-0.95, 0.95].map((x) =>
        [-1.25, 1.25].map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, 0.28, z]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.28, 0.28, 0.2, 16]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        )),
      )}
    </group>
  );
}

// Lampu Jalan Miniatur (Tinggi 4.2m)
export function StreetLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.1, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 4.2, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.6} />
      </mesh>
      {/* Tiang lengkung atas */}
      <mesh position={[0.4, 4.15, 0]}>
        <boxGeometry args={[0.8, 0.08, 0.08]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {/* Kap Lampu */}
      <mesh position={[0.75, 4.05, 0]}>
        <coneGeometry args={[0.2, 0.24, 8]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#fef08a"
          emissiveIntensity={1.0}
        />
      </mesh>
    </group>
  );
}

// Bangku Taman (Park Bench)
export function ParkBench({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Dudukan kayu */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.5, 0.08, 0.45]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* Sandaran punggung */}
      <mesh position={[0, 0.72, -0.2]} castShadow>
        <boxGeometry args={[1.5, 0.45, 0.06]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* Kaki besi hitam */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.22, 0]}>
          <boxGeometry args={[0.06, 0.44, 0.42]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      ))}
    </group>
  );
}
