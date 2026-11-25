import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { playerPos } from "@/lib/playerPosition";
import { REDUCED_MOTION, rnd } from "@/components/city/life/shared";

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
  const nearRef = useRef(false);
  const [meow, setMeow] = useState(false);

  const st = useRef({
    x: cat.waypoints[0][0],
    z: cat.waypoints[0][1],
    yaw: 0,
    wpIdx: 1,
    wait: 0,
  });

  useEffect(() => {
    if (!meow) return;
    const t = window.setTimeout(() => setMeow(false), 3000);
    return () => window.clearTimeout(t);
  }, [meow]);

  useFrame(({ clock }, rawDelta) => {
    if (REDUCED_MOTION) return;
    const dt = Math.min(rawDelta, 0.05);
    const t = clock.elapsedTime;
    const g = ref.current;
    if (!g) return;

    const s = st.current;
    const dxP = playerPos.x - s.x;
    const dzP = playerPos.z - s.z;
    const isNear = Math.hypot(dxP, dzP) < 2.2;

    if (isNear && !nearRef.current) setMeow(true);
    nearRef.current = isNear;

    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 5.5) * 0.35;
    }

    const relaxLegs = () => {
      for (const l of legRefs.current) {
        if (l) l.rotation.x *= 0.8;
      }
    };

    if (isNear || meow) {
      const targetYaw = Math.atan2(dxP, dzP);
      const diff = ((targetYaw - s.yaw + Math.PI) % (Math.PI * 2)) - Math.PI;
      s.yaw += (diff < -Math.PI ? diff + Math.PI * 2 : diff) * 0.14;
      g.position.set(s.x, 0, s.z);
      g.rotation.y = s.yaw;
      relaxLegs();
      return;
    }

    if (s.wait > 0) {
      s.wait -= dt;
      g.position.set(s.x, 0, s.z);
      g.rotation.y = s.yaw;
      relaxLegs();
      return;
    }

    const [tx, tz] = cat.waypoints[s.wpIdx];
    const dx = tx - s.x;
    const dz = tz - s.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.15) {
      s.x = tx;
      s.z = tz;
      s.wpIdx = (s.wpIdx + 1) % cat.waypoints.length;
      s.wait = 1.5 + rnd(s.wpIdx, 4) * 2.0;
      return;
    }

    const step = Math.min(dist, cat.speed * dt);
    s.x += (dx / dist) * step;
    s.z += (dz / dist) * step;

    const targetYaw = Math.atan2(dx, dz);
    const diff = ((targetYaw - s.yaw + Math.PI) % (Math.PI * 2)) - Math.PI;
    s.yaw += (diff < -Math.PI ? diff + Math.PI * 2 : diff) * 0.16;

    g.position.set(s.x, Math.abs(Math.sin(t * 9)) * 0.014, s.z);
    g.rotation.y = s.yaw;

    // Gerak kaki diagonal (depan kiri + belakang kanan seirama)
    const swing = Math.sin(t * 9) * 0.45;
    if (legRefs.current[0]) legRefs.current[0].rotation.x = swing;
    if (legRefs.current[1]) legRefs.current[1].rotation.x = -swing;
    if (legRefs.current[2]) legRefs.current[2].rotation.x = -swing;
    if (legRefs.current[3]) legRefs.current[3].rotation.x = swing;
  });

  return (
    <group
      ref={ref}
      position={[cat.waypoints[0][0], 0, cat.waypoints[0][1]]}
      onClick={(e) => {
        e.stopPropagation();
        setMeow(true);
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
