import { Html } from "@react-three/drei";
import type { InteriorConfig, Vec3 } from "@/config/buildings";

/* ---------- Komponen dasar ---------- */

function Plant({ pos, scale = 1 }: { pos: Vec3; scale?: number }) {
  return (
    <group position={pos} scale={scale}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.16, 0.4, 12]} />
        <meshStandardMaterial color="#9a3412" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.45, 14, 12]} />
        <meshStandardMaterial color="#16a34a" roughness={0.8} />
      </mesh>
      <mesh position={[0.22, 0.95, 0.1]} castShadow>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color="#22c55e" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Box3D({
  pos,
  size,
  color,
  emissive,
}: {
  pos: Vec3;
  size: Vec3;
  color: string;
  emissive?: string;
}) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        emissive={emissive ?? "#000000"}
        emissiveIntensity={emissive ? 1.2 : 0}
        roughness={0.7}
      />
    </mesh>
  );
}

/** Lampu tali: bola-bola kecil menggantung di antara dua titik, sedikit melengkung */
function StringLights({
  from,
  to,
  sag = 0.4,
  count = 14,
  color = "#fde68a",
}: {
  from: Vec3;
  to: Vec3;
  sag?: number;
  count?: number;
  color?: string;
}) {
  const bulbs: Vec3[] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    bulbs.push([
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t - sag * 4 * t * (1 - t),
      from[2] + (to[2] - from[2]) * t,
    ]);
  }
  return (
    <group>
      {bulbs.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function Sign({
  pos,
  text,
  bg = "#1f2937",
  color = "#ffffff",
}: {
  pos: Vec3;
  text: string;
  bg?: string;
  color?: string;
}) {
  return (
    <Html position={pos} center>
      <div
        className="px-3 py-1 rounded-md text-xs font-bold shadow whitespace-nowrap"
        style={{ background: bg, color }}
      >
        {text}
      </div>
    </Html>
  );
}

/* ---------- Dekorasi per gedung ---------- */

function WarungDecor() {
  return (
    <group>
      <Plant pos={[-3.3, 0, -4.2]} />
      <Plant pos={[3.3, 0, -4.2]} />
      <Plant pos={[-3.3, 0, 4.2]} />
      {/* Karpet merah di depan sekat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -2.2]}>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial color="#fca5a5" roughness={1} />
      </mesh>
      {/* Lampu gantung hangat */}
      <StringLights
        from={[-3.4, 2.7, -2.2]}
        to={[3.4, 2.7, -2.2]}
        sag={0.25}
        count={12}
      />
      <StringLights
        from={[-3.4, 2.7, 2.5]}
        to={[3.4, 2.7, 2.5]}
        sag={0.25}
        count={12}
      />
      <Sign
        pos={[0, 2.3, 4.6]}
        text="Ayo mampir, Warung Madura"
        bg="#b91c1c"
        color="#ffffff"
      />
    </group>
  );
}

function IndomartDecor() {
  return (
    <group>
      <Plant pos={[-8.8, 0, -13.8]} />
      <Plant pos={[8.8, 0, -13.8]} />
      <Plant pos={[-8.8, 0, 13.8]} />
      <Plant pos={[8.8, 0, 13.8]} />
      {/* Tumpukan kardus di pojok */}
      <Box3D pos={[-7.5, 0.4, -12.5]} size={[1.2, 0.8, 0.8]} color="#c08457" />
      <Box3D pos={[-7.5, 1.2, -12.5]} size={[1.2, 0.8, 0.8]} color="#b07a4a" />
      <Box3D pos={[-6.1, 0.4, -12.6]} size={[1, 0.8, 0.8]} color="#c08457" />
      <Box3D pos={[7.6, 0.4, 11.5]} size={[1.2, 0.8, 0.8]} color="#c08457" />
      {/* Lampu strip di langit-langit */}
      <Box3D
        pos={[-4, 4.85, 0]}
        size={[0.2, 0.06, 20]}
        color="#ffffff"
        emissive="#ffffff"
      />
      <Box3D
        pos={[4, 4.85, 0]}
        size={[0.2, 0.06, 20]}
        color="#ffffff"
        emissive="#ffffff"
      />
      <Sign
        pos={[0, 3.6, -14.2]}
        text="PROMO HARI INI"
        bg="#dc2626"
        color="#ffffff"
      />
      <Sign
        pos={[0, 3.6, 13.8]}
        text="Selamat Datang"
        bg="#16a34a"
        color="#ffffff"
      />
    </group>
  );
}

function EnumaDecor() {
  return (
    <group>
      <Plant pos={[-4.0, 0, -8.9]} />
      <Plant pos={[4.0, 0, -8.9]} />
      <Plant pos={[-4.0, 0, 8.9]} />
      <Plant pos={[4.0, 0, 8.9]} />
      {/* Papan tulis di dinding barat (ruangan) */}
      <mesh position={[-4.36, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.2, 1.6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <mesh position={[-4.37, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.4, 1.8]} />
        <meshStandardMaterial color="#2563eb" roughness={0.6} />
      </mesh>
      <Sign
        pos={[-4.2, 1.8, 0]}
        text="Enuma Technology"
        bg="transparent"
        color="#1e3a8a"
      />
      {/* Panel lampu di langit-langit */}
      <Box3D
        pos={[0, 3.95, -4]}
        size={[1.2, 0.05, 2.4]}
        color="#ffffff"
        emissive="#ffffff"
      />
      <Box3D
        pos={[0, 3.95, 4]}
        size={[1.2, 0.05, 2.4]}
        color="#ffffff"
        emissive="#ffffff"
      />
      {/* Plint biru di kaki dinding */}
      <Box3D pos={[-4.45, 0.06, 0]} size={[0.02, 0.12, 18]} color="#2563eb" />
    </group>
  );
}

function CafeGroundDecor() {
  return (
    <group>
      <Plant pos={[6.4, 0, -11.4]} />
      <Plant pos={[6.4, 0, 8.0]} />
      <Plant pos={[-6.4, 0, -7.0]} />
      <Sign
        pos={[0, 3.4, 11.8]}
        text="Lunara Cafe"
        bg="#f472b6"
        color="#ffffff"
      />
    </group>
  );
}

/* ---------- Pemilih ---------- */

export function RoomDecor({ config }: { config: InteriorConfig }) {
  switch (config.buildingKey) {
    case "warung-madura":
      return <WarungDecor />;
    case "indomart":
      return <IndomartDecor />;
    case "enuma-hq":
      return <EnumaDecor />;
    case "lunara-cafe":
      return <CafeGroundDecor />;
    default:
      return null;
  }
}
