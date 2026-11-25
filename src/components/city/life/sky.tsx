import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { REDUCED_MOTION, rnd } from "@/components/city/life/shared";

/* ============================================================
 * BURUNG
 * Kawanan kecil terbang melingkar di atas kota, sayapnya mengepak.
 * ============================================================ */
const BIRDS = Array.from({ length: 6 }, (_, i) => ({
  radius: 26 + rnd(i, 5) * 18,
  height: 15 + rnd(i, 6) * 6,
  speed: 0.07 + rnd(i, 7) * 0.05,
  phase: rnd(i, 8) * Math.PI * 2,
  flap: 7 + rnd(i, 9) * 3,
}));

export function Birds() {
  const groups = useRef<(THREE.Group | null)[]>([]);
  // Dua sayap per burung: [kiri, kanan]
  const wings = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ clock }) => {
    if (REDUCED_MOTION) return;
    const t = clock.elapsedTime;

    BIRDS.forEach((b, i) => {
      const a = t * b.speed + b.phase;

      const g = groups.current[i];
      if (g) {
        // Lintasan elips di atas pusat kota
        g.position.set(
          Math.cos(a) * b.radius,
          b.height + Math.sin(t * 0.7 + i) * 0.5,
          Math.sin(a) * b.radius * 0.6 - 6,
        );
        // Menghadap arah terbang (turunan lintasan)
        g.rotation.y = Math.atan2(-Math.sin(a), 0.6 * Math.cos(a));
      }

      const flapAngle = Math.sin(t * b.flap + i) * 0.7;
      const wl = wings.current[i * 2];
      const wr = wings.current[i * 2 + 1];
      if (wl) wl.rotation.z = flapAngle;
      if (wr) wr.rotation.z = -flapAngle;
    });
  });

  return (
    <group>
      {BIRDS.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
        >
          <mesh>
            <boxGeometry args={[0.08, 0.06, 0.3]} />
            <meshBasicMaterial color="#334155" />
          </mesh>
          <group
            ref={(el) => {
              wings.current[i * 2] = el;
            }}
          >
            <mesh position={[-0.22, 0, 0]}>
              <boxGeometry args={[0.44, 0.03, 0.14]} />
              <meshBasicMaterial color="#334155" />
            </mesh>
          </group>
          <group
            ref={(el) => {
              wings.current[i * 2 + 1] = el;
            }}
          >
            <mesh position={[0.22, 0, 0]}>
              <boxGeometry args={[0.44, 0.03, 0.14]} />
              <meshBasicMaterial color="#334155" />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

/* ============================================================
 * AWAN
 * Bergerak pelan dari kiri ke kanan di cakrawala, lalu muncul lagi di sisi lain.
 * ============================================================ */
const CLOUDS = Array.from({ length: 6 }, (_, i) => ({
  x: -90 + rnd(i, 14) * 180,
  y: 18 + rnd(i, 15) * 5,
  z: -48 - rnd(i, 16) * 14,
  speed: 0.5 + rnd(i, 17) * 0.4,
  scale: 1.1 + rnd(i, 18) * 1.1,
}));

/** Gumpalan awan: [x, y, z, radius] */
const CLOUD_PUFFS: [number, number, number, number][] = [
  [0, 0, 0, 1.2],
  [1.1, -0.2, 0.2, 0.9],
  [-1.1, -0.15, -0.1, 0.95],
  [0.4, 0.6, 0, 0.8],
];

export function Clouds() {
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ clock }) => {
    if (REDUCED_MOTION) return;
    const t = clock.elapsedTime;
    const span = 180;

    CLOUDS.forEach((c, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.position.x = ((((c.x + t * c.speed + 90) % span) + span) % span) - 90;
    });
  });

  return (
    <group>
      {CLOUDS.map((c, i) => (
        <group
          key={i}
          position={[c.x, c.y, c.z]}
          scale={c.scale}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          {CLOUD_PUFFS.map(([px, py, pz, r], k) => (
            <mesh key={k} position={[px, py, pz]}>
              <sphereGeometry args={[r, 12, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ============================================================
 * CAHAYA LAMPU JALAN
 * Lingkaran cahaya lembut di kepala lampu, berdenyut pelan.
 * Posisi kepala lampu mengikuti StreetLamp di CityEnvironment.
 * ============================================================ */
const LAMP_HEADS: [number, number][] = [
  [-18, 10],
  [-2, 10],
  [14, 10],
  [-18, -18],
  [-2, -18],
  [14, -18],
];

export function LampGlow() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    if (REDUCED_MOTION) return;
    const t = clock.elapsedTime;

    LAMP_HEADS.forEach((_, i) => {
      const m = refs.current[i];
      if (!m) return;
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.28 + 0.12 * Math.sin(t * 1.6 + i * 0.9);
    });
  });

  return (
    <group>
      {LAMP_HEADS.map(([x, z], i) => (
        <mesh
          key={i}
          position={[x + 0.8, 4.0, z]}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.32, 12, 12]} />
          <meshBasicMaterial
            color="#fef3c7"
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
 * BALON UDARA & DRONE DI LANGIT
 * ============================================================ */
export function SkyLife() {
  const balloon1Ref = useRef<THREE.Group>(null);
  const balloon2Ref = useRef<THREE.Group>(null);
  const droneRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (REDUCED_MOTION) return;
    const t = clock.elapsedTime;
    if (balloon1Ref.current) {
      balloon1Ref.current.position.set(
        Math.cos(t * 0.03) * 32,
        27 + Math.sin(t * 0.6) * 0.9,
        -18 + Math.sin(t * 0.03) * 14,
      );
    }
    if (balloon2Ref.current) {
      balloon2Ref.current.position.set(
        Math.cos(t * 0.025 + 2.5) * 36,
        30 + Math.cos(t * 0.5) * 0.8,
        12 + Math.sin(t * 0.025 + 2.5) * 12,
      );
    }
    if (droneRef.current) {
      const a = t * 0.28;
      droneRef.current.position.set(
        Math.cos(a) * 20,
        11.5 + Math.sin(t * 2) * 0.3,
        -2 + Math.sin(a) * 10,
      );
      droneRef.current.rotation.y = -a;
    }
  });

  const balloons = [
    { ref: balloon1Ref, color: "#ef4444", stripe: "#facc15" },
    { ref: balloon2Ref, color: "#0ea5e9", stripe: "#f8fafc" },
  ];

  return (
    <group>
      {balloons.map((b, i) => (
        <group key={i} ref={b.ref}>
          <mesh position={[0, 1.8, 0]}>
            <sphereGeometry args={[2.1, 16, 12]} />
            <meshStandardMaterial color={b.color} roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.8, 0]}>
            <torusGeometry args={[2.08, 0.12, 8, 20]} />
            <meshStandardMaterial color={b.stripe} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.8, 0]}>
            <boxGeometry args={[0.9, 0.7, 0.9]} />
            <meshStandardMaterial color="#92400e" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Drone pengantar kecil */}
      <group ref={droneRef}>
        <mesh>
          <boxGeometry args={[0.55, 0.14, 0.38]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, -0.14, 0]}>
          <boxGeometry args={[0.28, 0.16, 0.24]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.5}
          />
        </mesh>
        {[
          [-0.36, 0.08, -0.26],
          [0.36, 0.08, -0.26],
          [-0.36, 0.08, 0.26],
          [0.36, 0.08, 0.26],
        ].map(([x, y, z], idx) => (
          <mesh key={idx} position={[x, y, z]}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 10]} />
            <meshStandardMaterial color="#94a3b8" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
