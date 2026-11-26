import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { createNpcPose, interactNpc, readNpcPose, useNpcTalk, type NpcPose } from "@/lib/npcRuntime";

const pose: NpcPose = createNpcPose();

/* ============================================================
 * KUCING KOTA INTERAKTIF
 * Berjalan antar-waypoint yang aman (tidak menembus air mancur/gedung),
 * kaki bergerak saat melangkah, dan sesekali berhenti santai.
 * ============================================================ */
const CAT_SPECS: {
  name: string;
  color: string;
  speed: number;
  waypoints: [number, number][];
}[] = [
  {
    name: "Oyen",
    color: "#f97316",
    speed: 0.95,
    waypoints: [
      [-34.0, 11.2],
      [-28.0, 11.2],
      [-28.5, 13.0],
      [-33.5, 12.8],
    ],
  },
  {
    name: "Milo",
    color: "#334155",
    speed: 0.9,
    // Mengelilingi luar kolam air mancur (-16, 32.5, r=2.45) tanpa pernah masuk ke air
    waypoints: [
      [-20.2, 28.8],
      [-11.8, 28.8],
      [-11.8, 36.2],
      [-20.2, 36.2],
    ],
  },
  {
    name: "Snowy",
    color: "#f8fafc",
    speed: 0.9,
    waypoints: [
      [25.0, 11.2],
      [33.2, 11.2],
      [33.2, 13.0],
      [25.0, 13.0],
    ],
  },
];

function CityCat({ cat }: { cat: (typeof CAT_SPECS)[number] }) {
  const ref = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const legRefs = useRef<(THREE.Mesh | null)[]>([]);
  const id = `cat-${cat.name.toLowerCase()}`;
  // Mengeong = bubble aktif dari server (dipicu pemain dekat atau klik)
  const meow = useNpcTalk(id) >= 0;

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g || !readNpcPose(id, pose)) return;
    const t = clock.elapsedTime;
    if (tailRef.current) tailRef.current.rotation.z = Math.sin(t * 5.5) * 0.35;
    g.position.set(pose.x, pose.y, pose.z);
    g.rotation.y = pose.yaw;
    const legs = legRefs.current;
    if (pose.anim === 1) {
      // Gerak kaki diagonal (depan kiri + belakang kanan seirama)
      const swing = Math.sin(t * 9) * 0.45;
      if (legs[0]) legs[0].rotation.x = swing;
      if (legs[1]) legs[1].rotation.x = -swing;
      if (legs[2]) legs[2].rotation.x = -swing;
      if (legs[3]) legs[3].rotation.x = swing;
    } else {
      for (const l of legs) if (l) l.rotation.x *= 0.8;
    }
  });
  return (
    <group
      ref={ref}
      position={[cat.waypoints[0][0], 0, cat.waypoints[0][1]]}
      onClick={(e) => {
        e.stopPropagation();
        interactNpc(id);
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      {/* Badan kucing */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.18, 0.16, 0.36]} />
        <meshStandardMaterial color={cat.color} roughness={0.7} />
      </mesh>
      {/* Kepala & telinga */}
      <mesh position={[0, 0.3, 0.18]} castShadow>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial color={cat.color} roughness={0.7} />
      </mesh>
      {[-0.055, 0.055].map((x) => (
        <mesh key={x} position={[x, 0.4, 0.18]}>
          <coneGeometry args={[0.035, 0.08, 4]} />
          <meshStandardMaterial color={cat.color} roughness={0.7} />
        </mesh>
      ))}
      {/* Kaki 4: [BL, BR, FL, FR] */}
      {[
        [-0.06, -0.12],
        [0.06, -0.12],
        [-0.06, 0.12],
        [0.06, 0.12],
      ].map(([x, z], idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            legRefs.current[idx] = el;
          }}
          position={[x, 0.07, z]}
        >
          <cylinderGeometry args={[0.025, 0.02, 0.14, 8]} />
          <meshStandardMaterial color={cat.color} />
        </mesh>
      ))}
      {/* Ekor */}
      <mesh ref={tailRef} position={[0, 0.28, -0.22]} rotation={[0.6, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.24, 8]} />
        <meshStandardMaterial color={cat.color} />
      </mesh>
      {meow && (
        <Html
          position={[0, 0.72, 0]}
          center
          zIndexRange={[30, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="w-max rounded-full border border-rose-200 bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-rose-500 shadow">
            {cat.name}: Meong~ ♥
          </div>
        </Html>
      )}
    </group>
  );
}

export function CityCats() {
  return (
    <group>
      {CAT_SPECS.map((cat) => (
        <CityCat key={cat.name} cat={cat} />
      ))}
    </group>
  );
}
