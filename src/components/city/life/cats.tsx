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
  accent: string;
  belly: string;
  eye: string;
  collar: string;
  speed: number;
  waypoints: [number, number][];
}[] = [
  {
    name: "Oyen",
    color: "#f97316",
    accent: "#c2410c",
    belly: "#fff7ed",
    eye: "#84cc16",
    collar: "#ef4444",
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
    accent: "#1e293b",
    belly: "#f8fafc",
    eye: "#eab308",
    collar: "#06b6d4",
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
    accent: "#cbd5e1",
    belly: "#ffffff",
    eye: "#38bdf8",
    collar: "#ec4899",
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
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const legRefs = useRef<(THREE.Group | null)[]>([]);
  const id = `cat-${cat.name.toLowerCase()}`;
  // Mengeong = bubble aktif dari server (dipicu pemain dekat atau klik)
  const meow = useNpcTalk(id) >= 0;

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g || !readNpcPose(id, pose)) return;
    const t = clock.elapsedTime;
    const walking = pose.anim === 1;

    g.position.set(pose.x, pose.y, pose.z);
    g.rotation.y = pose.yaw;

    // Ayunan ekor melengkung (lebih lincah saat berjalan/mengeong)
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * (walking || meow ? 5.2 : 2.6)) * 0.32;
      tailRef.current.rotation.x = (walking || meow ? 0.25 : -0.1) + Math.sin(t * 2.1) * 0.08;
    }

    // Gerak badan & kepala halus
    if (bodyRef.current) {
      bodyRef.current.position.y = walking
        ? Math.abs(Math.sin(t * 9)) * 0.012
        : Math.sin(t * 2.2) * 0.004;
      bodyRef.current.rotation.z = walking ? Math.sin(t * 9) * 0.03 : 0;
    }
    if (headRef.current) {
      headRef.current.rotation.x = meow
        ? -0.18 + Math.sin(t * 8) * 0.06
        : walking
          ? Math.sin(t * 9) * 0.04
          : Math.sin(t * 1.4) * 0.05;
      headRef.current.rotation.y = walking ? 0 : Math.sin(t * 0.9) * 0.14;
    }

    // Ayunan 4 kaki dari poros bahu/pinggul: [BL, BR, FL, FR]
    const legs = legRefs.current;
    if (walking) {
      const swing = Math.sin(t * 9) * 0.48;
      if (legs[0]) legs[0].rotation.x = swing;
      if (legs[1]) legs[1].rotation.x = -swing;
      if (legs[2]) legs[2].rotation.x = -swing;
      if (legs[3]) legs[3].rotation.x = swing;
    } else {
      for (const l of legs) if (l) l.rotation.x *= 0.82;
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
      <group ref={bodyRef}>
        {/* Badan kapsul organik + dada & pinggul membulat */}
        <mesh position={[0, 0.2, -0.01]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.088, 0.22, 8, 14]} />
          <meshStandardMaterial color={cat.color} roughness={0.78} />
        </mesh>
        {/* Perut / dada cerah */}
        <mesh position={[0, 0.165, 0.03]} rotation={[Math.PI / 2 - 0.12, 0, 0]}>
          <capsuleGeometry args={[0.062, 0.18, 6, 12]} />
          <meshStandardMaterial color={cat.belly} roughness={0.85} />
        </mesh>
        {/* Corak punggung (belang/sadel halus) */}
        {[-0.08, 0.0, 0.07].map((sz, i) => (
          <mesh key={i} position={[0, 0.275, sz]} scale={[1.1, 0.35, 0.55]}>
            <sphereGeometry args={[0.062, 10, 8]} />
            <meshStandardMaterial color={cat.accent} roughness={0.8} />
          </mesh>
        ))}

        {/* Leher & kalung + lonceng */}
        <mesh position={[0, 0.255, 0.125]} rotation={[0.45, 0, 0]} castShadow>
          <cylinderGeometry args={[0.056, 0.068, 0.09, 12]} />
          <meshStandardMaterial color={cat.color} roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.245, 0.125]} rotation={[Math.PI / 2 - 0.45, 0, 0]}>
          <torusGeometry args={[0.064, 0.011, 8, 16]} />
          <meshStandardMaterial color={cat.collar} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.21, 0.185]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.25} />
        </mesh>

        {/* Kepala detail: pipi, moncong, hidung, mata, kumis, telinga */}
        <group ref={headRef} position={[0, 0.315, 0.175]}>
          {/* Tempurung kepala */}
          <mesh scale={[1.08, 0.96, 1.0]} castShadow>
            <sphereGeometry args={[0.095, 16, 14]} />
            <meshStandardMaterial color={cat.color} roughness={0.75} />
          </mesh>
          {/* Pipi kiri & kanan */}
          {[-0.034, 0.034].map((cx) => (
            <mesh key={cx} position={[cx, -0.025, 0.072]} scale={[1.05, 0.85, 0.9]}>
              <sphereGeometry args={[0.032, 10, 8]} />
              <meshStandardMaterial color={cat.belly} roughness={0.85} />
            </mesh>
          ))}
          {/* Dagu */}
          <mesh position={[0, -0.048, 0.065]} scale={[0.9, 0.65, 0.85]}>
            <sphereGeometry args={[0.028, 8, 8]} />
            <meshStandardMaterial color={cat.belly} roughness={0.85} />
          </mesh>
          {/* Hidung pink */}
          <mesh position={[0, -0.012, 0.098]} rotation={[Math.PI / 2, 0, Math.PI]}>
            <coneGeometry args={[0.014, 0.016, 3]} />
            <meshStandardMaterial color="#f472b6" roughness={0.4} />
          </mesh>

          {/* Mata kiri & kanan (iris + pupil + kilau putih) */}
          {[-0.036, 0.036].map((ex) => (
            <group key={ex} position={[ex, 0.016, 0.08]}>
              <mesh scale={[1, 1.15, 0.6]}>
                <sphereGeometry args={[0.018, 10, 10]} />
                <meshStandardMaterial color={cat.eye} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0, 0.008]} scale={[0.45, 0.95, 0.5]}>
                <sphereGeometry args={[0.013, 8, 8]} />
                <meshStandardMaterial color="#0f172a" roughness={0.1} />
              </mesh>
              <mesh position={[0.005, 0.006, 0.012]}>
                <sphereGeometry args={[0.004, 6, 6]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          ))}

          {/* Kumis kiri & kanan (3 helai per sisi) */}
          {[-1, 1].map((side) =>
            [-0.015, -0.024, -0.033].map((wy, wi) => (
              <mesh
                key={`${side}-${wi}`}
                position={[side * 0.068, wy, 0.072]}
                rotation={[0, side * -0.18, side * (wi - 1) * 0.14]}
              >
                <boxGeometry args={[0.075, 0.003, 0.003]} />
                <meshBasicMaterial color="#e2e8f0" />
              </mesh>
            )),
          )}

          {/* Telinga luar + telinga dalam pink */}
          {[-1, 1].map((side) => (
            <group
              key={side}
              position={[side * 0.056, 0.088, 0.0]}
              rotation={[0.08, side * 0.25, side * -0.22]}
            >
              <mesh castShadow>
                <coneGeometry args={[0.036, 0.078, 4]} />
                <meshStandardMaterial color={cat.color} roughness={0.75} />
              </mesh>
              <mesh position={[0, -0.006, 0.012]}>
                <coneGeometry args={[0.02, 0.05, 4]} />
                <meshStandardMaterial color="#fbcfe8" roughness={0.6} />
              </mesh>
            </group>
          ))}
        </group>

        {/* 4 Kaki berporos bahu/pinggul + telapak kaki: [BL, BR, FL, FR] */}
        {[
          { x: -0.058, z: -0.115, rTop: 0.032, rBot: 0.02 },
          { x: 0.058, z: -0.115, rTop: 0.032, rBot: 0.02 },
          { x: -0.056, z: 0.095, rTop: 0.026, rBot: 0.019 },
          { x: 0.056, z: 0.095, rTop: 0.026, rBot: 0.019 },
        ].map((leg, idx) => (
          <group
            key={idx}
            ref={(el) => {
              legRefs.current[idx] = el;
            }}
            position={[leg.x, 0.155, leg.z]}
          >
            <mesh position={[0, -0.07, 0]} castShadow>
              <cylinderGeometry args={[leg.rTop, leg.rBot, 0.14, 10]} />
              <meshStandardMaterial color={cat.color} roughness={0.78} />
            </mesh>
            {/* Telapak kaki membulat */}
            <mesh position={[0, -0.14, 0.012]} scale={[1.05, 0.65, 1.35]} castShadow>
              <sphereGeometry args={[0.023, 10, 8]} />
              <meshStandardMaterial color={cat.belly} roughness={0.85} />
            </mesh>
          </group>
        ))}

        {/* Ekor melengkung 2 segmen */}
        <group ref={tailRef} position={[0, 0.22, -0.17]}>
          <mesh position={[0, 0.075, -0.055]} rotation={[-0.65, 0, 0]} castShadow>
            <capsuleGeometry args={[0.019, 0.13, 6, 8]} />
            <meshStandardMaterial color={cat.color} roughness={0.78} />
          </mesh>
          <mesh position={[0, 0.175, -0.095]} rotation={[0.35, 0, 0]} castShadow>
            <capsuleGeometry args={[0.016, 0.11, 6, 8]} />
            <meshStandardMaterial color={cat.belly} roughness={0.78} />
          </mesh>
        </group>
      </group>

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
