import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LowPolyCar } from "@/components/CityProps";

const REDUCED_MOTION =
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Angka semu yang stabil per index, dipakai untuk variasi tanpa Math.random saat render */
function rnd(i: number, salt = 0): number {
  const x = Math.sin((i + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Gelombang segitiga 0 → 1 → 0 */
function tri(t: number): number {
  const f = t - Math.floor(t);
  return f < 0.5 ? f * 2 : (1 - f) * 2;
}

/* ============================================================
 * PEJALAN KAKI
 * Berjalan bolak-balik di trotoar, sejajar dengan bangunan.
 * ============================================================ */
const WALK_LANES = [
  { z: 14.5, minX: -36, maxX: 36 }, // trotoar depan gedung
  { z: -21.5, minX: -36, maxX: 36 }, // trotoar belakang gedung
];
const SHIRTS = [
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#0ea5e9",
  "#ec4899",
];
const PANTS = ["#1e293b", "#475569", "#312e81", "#44403c"];
const SKINS = ["#fcd9b6", "#f5c28b", "#d9a273", "#a86f45"];

const WALKERS = Array.from({ length: 9 }, (_, i) => ({
  lane: i % 2,
  speed: 1.1 + rnd(i, 1) * 0.9,
  phase: rnd(i, 2),
  shirt: SHIRTS[i % SHIRTS.length],
  pants: PANTS[i % PANTS.length],
  skin: SKINS[i % SKINS.length],
}));

function Pedestrians() {
  const bodies = useRef<(THREE.Group | null)[]>([]);
  // Empat pivot per pejalan: [kaki kiri, kaki kanan, lengan kiri, lengan kanan]
  const limbs = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ clock }) => {
    if (REDUCED_MOTION) return;
    const time = clock.elapsedTime;

    WALKERS.forEach((w, i) => {
      const lane = WALK_LANES[w.lane];
      const span = lane.maxX - lane.minX;
      const t = time * (w.speed / (2 * span)) + w.phase;
      const f = t - Math.floor(t);

      const body = bodies.current[i];
      if (body) {
        body.position.set(lane.minX + span * tri(t), 0, lane.z);
        // Maju ke +X saat gelombang naik, kembali saat turun
        body.rotation.y = f < 0.5 ? Math.PI / 2 : -Math.PI / 2;
      }

      const swing = Math.sin(time * w.speed * 6 + w.phase * 6) * 0.55;
      const setLimb = (k: number, v: number) => {
        const g = limbs.current[i * 4 + k];
        if (g) g.rotation.x = v;
      };
      setLimb(0, swing);
      setLimb(1, -swing);
      setLimb(2, -swing * 0.7);
      setLimb(3, swing * 0.7);
    });
  });

  return (
    <group>
      {WALKERS.map((w, i) => (
        <group
          key={i}
          ref={(el) => {
            bodies.current[i] = el;
          }}
        >
          {/* Kaki */}
          <group
            position={[-0.1, 0.5, 0]}
            ref={(el) => {
              limbs.current[i * 4] = el;
            }}
          >
            <mesh position={[0, -0.25, 0]}>
              <boxGeometry args={[0.14, 0.5, 0.16]} />
              <meshStandardMaterial color={w.pants} />
            </mesh>
          </group>
          <group
            position={[0.1, 0.5, 0]}
            ref={(el) => {
              limbs.current[i * 4 + 1] = el;
            }}
          >
            <mesh position={[0, -0.25, 0]}>
              <boxGeometry args={[0.14, 0.5, 0.16]} />
              <meshStandardMaterial color={w.pants} />
            </mesh>
          </group>

          {/* Badan */}
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[0.42, 0.6, 0.24]} />
            <meshStandardMaterial color={w.shirt} roughness={0.6} />
          </mesh>

          {/* Lengan */}
          <group
            position={[-0.27, 1.05, 0]}
            ref={(el) => {
              limbs.current[i * 4 + 2] = el;
            }}
          >
            <mesh position={[0, -0.25, 0]}>
              <boxGeometry args={[0.1, 0.5, 0.1]} />
              <meshStandardMaterial color={w.shirt} roughness={0.6} />
            </mesh>
          </group>
          <group
            position={[0.27, 1.05, 0]}
            ref={(el) => {
              limbs.current[i * 4 + 3] = el;
            }}
          >
            <mesh position={[0, -0.25, 0]}>
              <boxGeometry args={[0.1, 0.5, 0.1]} />
              <meshStandardMaterial color={w.shirt} roughness={0.6} />
            </mesh>
          </group>

          {/* Kepala */}
          <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.14, 10, 10]} />
            <meshStandardMaterial color={w.skin} roughness={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ============================================================
 * LALU LINTAS
 * Mobil melaju di jalur masing-masing lalu kembali dari ujung.
 * Jika arah mobil terbalik, tukar nilai rotasi di `traffic` (lihat catatan).
 * ============================================================ */
const CAR_COLORS = [
  "#ef4444",
  "#f8fafc",
  "#2563eb",
  "#0f172a",
  "#eab308",
  "#14b8a6",
];

interface CarSpec {
  axis: "x" | "z";
  /** Koordinat tetap di sumbu yang tegak lurus arah jalan (jalur) */
  fixed: number;
  from: number;
  to: number;
  speed: number;
  dir: 1 | -1;
  offset: number;
  color: string;
}

const CARS: CarSpec[] = [
  // Jalan selatan (z 18.5 s.d. 25.5), dua jalur
  {
    axis: "x",
    fixed: 23.8,
    from: -48,
    to: 48,
    speed: 3.6,
    dir: 1,
    offset: 0.0,
    color: CAR_COLORS[0],
  },
  {
    axis: "x",
    fixed: 23.8,
    from: -48,
    to: 48,
    speed: 3.2,
    dir: 1,
    offset: 0.5,
    color: CAR_COLORS[1],
  },
  {
    axis: "x",
    fixed: 20.2,
    from: -48,
    to: 48,
    speed: 3.8,
    dir: -1,
    offset: 0.25,
    color: CAR_COLORS[2],
  },
  // Jalan utara (z -33.5 s.d. -26.5)
  {
    axis: "x",
    fixed: -31.2,
    from: -48,
    to: 48,
    speed: 3.4,
    dir: 1,
    offset: 0.1,
    color: CAR_COLORS[3],
  },
  {
    axis: "x",
    fixed: -28.8,
    from: -48,
    to: 48,
    speed: 3.9,
    dir: -1,
    offset: 0.6,
    color: CAR_COLORS[4],
  },
  // Jalan barat dan timur, arah Z
  {
    axis: "z",
    fixed: -42.5,
    from: -30,
    to: 22,
    speed: 3.0,
    dir: 1,
    offset: 0.3,
    color: CAR_COLORS[5],
  },
  {
    axis: "z",
    fixed: 42.5,
    from: -30,
    to: 22,
    speed: 3.3,
    dir: -1,
    offset: 0.7,
    color: CAR_COLORS[0],
  },
];

function Traffic() {
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ clock }) => {
    if (REDUCED_MOTION) return;
    const time = clock.elapsedTime;

    CARS.forEach((c, i) => {
      const g = refs.current[i];
      if (!g) return;

      const span = c.to - c.from;
      const d = (((time * c.speed + c.offset * span) % span) + span) % span;
      const pos = c.dir > 0 ? c.from + d : c.to - d;

      if (c.axis === "x") {
        g.position.set(pos, 0, c.fixed);
        g.rotation.y = c.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      } else {
        g.position.set(c.fixed, 0, pos);
        g.rotation.y = c.dir > 0 ? Math.PI : 0;
      }
    });
  });

  return (
    <group>
      {CARS.map((c, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <LowPolyCar position={[0, 0, 0]} color={c.color} />
        </group>
      ))}
    </group>
  );
}

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

function Birds() {
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

function Clouds() {
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

function LampGlow() {
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
 * POHON BERGOYANG
 * Bungkus pohon dengan Sway. Pivot ada di pangkal pohon,
 * jadi batang tetap menancap di tanah dan hanya tajuk yang bergerak.
 * ============================================================ */
export function Sway({
  position,
  phase = 0,
  children,
}: {
  position: [number, number, number];
  phase?: number;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (REDUCED_MOTION || !ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.z = Math.sin(t * 0.9 + phase) * 0.02;
    ref.current.rotation.x = Math.cos(t * 0.7 + phase * 1.3) * 0.012;
  });

  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

/** Semua elemen hidup kota. Tidak dikirim ke server dan tidak ikut collision. */
export function CityLife() {
  return (
    <group>
      <Pedestrians />
      <Traffic />
      <Birds />
      <Clouds />
      <LampGlow />
    </group>
  );
}