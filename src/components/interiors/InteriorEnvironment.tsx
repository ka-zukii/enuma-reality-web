import { Html } from "@react-three/drei";
import { DESK_POSITIONS, type InteriorConfig } from "@/config/buildings";

const WALL_H = 3.2;
const WALL_T = 0.3;
const DOOR_HALF = 0.8;

function Wall({
  position,
  size,
  color = "#e2e8f0",
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function Desk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.37, 0]} castShadow>
        <boxGeometry args={[2.2, 0.08, 0.9]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>
      <mesh position={[-0.95, 0.18, 0]} castShadow>
        <boxGeometry args={[0.1, 0.36, 0.8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0.95, 0.18, 0]} castShadow>
        <boxGeometry args={[0.1, 0.36, 0.8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

/**
 * Interior satu gedung. Dinding mengelilingi area `bounds` dengan margin,
 * dan ada celah pintu di dinding depan (sisi kamera awal).
 */
export function InteriorEnvironment({ config }: { config: InteriorConfig }) {
  const { bounds, exit, accent, name } = config;

  const x0 = bounds.minX - 0.5;
  const x1 = bounds.maxX + 0.5;
  const z0 = bounds.minZ - 0.5;
  const z1 = bounds.maxZ + 0.75;

  const width = x1 - x0;
  const depth = z1 - z0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;

  const frontLeftLen = -DOOR_HALF - x0;
  const frontLeftCx = (x0 + -DOOR_HALF) / 2;
  const frontRightLen = x1 - DOOR_HALF;
  const frontRightCx = (DOOR_HALF + x1) / 2;

  return (
    <group>
      {/* Lantai */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[cx, 0, cz]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.8} />
      </mesh>

      {/* Karpet aksen di tengah ruangan */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[4, depth - 2]} />
        <meshStandardMaterial color={accent} transparent opacity={0.12} />
      </mesh>

      {/* Dinding belakang */}
      <Wall position={[cx, WALL_H / 2, z0]} size={[width, WALL_H, WALL_T]} />

      {/* Dinding samping kiri & kanan */}
      <Wall position={[x0, WALL_H / 2, cz]} size={[WALL_T, WALL_H, depth]} />
      <Wall position={[x1, WALL_H / 2, cz]} size={[WALL_T, WALL_H, depth]} />

      {/* Dinding depan dengan celah pintu */}
      <Wall
        position={[frontLeftCx, WALL_H / 2, z1]}
        size={[frontLeftLen, WALL_H, WALL_T]}
      />
      <Wall
        position={[frontRightCx, WALL_H / 2, z1]}
        size={[frontRightLen, WALL_H, WALL_T]}
      />

      {/* Papan nama di dinding belakang */}
      <Html position={[0, WALL_H - 0.5, z0 + 0.25]} center>
        <div className="px-3 py-1 rounded-lg bg-white/90 text-xs font-bold text-slate-700 shadow whitespace-nowrap">
          {name}
        </div>
      </Html>

      {/* Penanda pintu keluar */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[exit.position[0], 0.02, exit.position[2]]}
      >
        <planeGeometry args={[1.6, 1.0]} />
        <meshStandardMaterial color={accent} transparent opacity={0.5} />
      </mesh>
      <Html position={[exit.position[0], 0.8, exit.position[2]]} center>
        <div className="px-2 py-0.5 rounded-md bg-white/90 text-[10px] font-semibold text-slate-600 shadow whitespace-nowrap">
          Keluar
        </div>
      </Html>

      {/* Meja kerja (sama dengan collision di config) */}
      {DESK_POSITIONS.map((p, i) => (
        <Desk key={i} position={p} />
      ))}
    </group>
  );
}
