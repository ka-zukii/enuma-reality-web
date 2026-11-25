import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { LowPolyCar } from "@/components/CityProps";
import { NpcFigure } from "@/components/NpcFigure";
import { playerPos } from "@/lib/playerPosition";
import { platformY } from "@/config/railway";
import {
  isTramStopped,
  riderWorldPos,
  stepTramView,
  TRAM,
} from "@/lib/tramRuntime";

const REDUCED_MOTION =
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Angka semu yang stabil per index, dipakai untuk variasi tanpa Math.random saat render */
function rnd(i: number, salt = 0): number {
  const x = Math.sin((i + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ============================================================
 * PEJALAN KAKI INTERAKTIF
 * Berjalan di trotoar dengan jeda natural, spawn merata, dan bisa diajak bicara.
 * ============================================================ */
const WALK_LANES = [
  { z: 14.8, minX: -35, maxX: 35 }, // trotoar depan gedung (aman dari bangku z=13.4)
  { z: -21.2, minX: -35, maxX: 35 }, // trotoar belakang gedung
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
const HAIR_COLORS = ["#1e1b18", "#3b2314", "#0f172a", "#5b21b6", "#7c2d12"];
const WALKER_NAMES = [
  "Adi",
  "Bella",
  "Candra",
  "Dewi",
  "Eko",
  "Fani",
  "Gilang",
  "Hana",
];
const WALKER_LINES = [
  ["Halo! Cuaca di kota enak banget buat jalan santai.", "Jangan lupa mampir ke Lunara Cafe ya!"],
  ["Hai! Lagi jalan-jalan keliling kota nih.", "Udah lihat menara jam di taman selatan?"],
  ["Permisi, mau ke Indomaret sebentar!", "Katanya ada musik baru di aplikasi Spotify ponselmu."],
  ["Halo! Senang ketemu di sini.", "Kalau capek jalan, duduk aja di bangku taman!"],
];

const WALKERS = Array.from({ length: 8 }, (_, i) => {
  const laneIdx = i % 2;
  const lane = WALK_LANES[laneIdx];
  const slot = Math.floor(i / 2);
  // Spawn merata di 4 titik per trotoar agar tidak bertumpuk
  const startX = lane.minX + ((slot + 0.5) / 4) * (lane.maxX - lane.minX);
  return {
    name: WALKER_NAMES[i % WALKER_NAMES.length],
    lines: WALKER_LINES[i % WALKER_LINES.length],
    lane: laneIdx,
    startX,
    startZ: lane.z + (slot % 2 === 0 ? 0.35 : -0.35),
    dir: (slot % 2 === 0 ? 1 : -1) as 1 | -1,
    speed: 1.05 + rnd(i, 1) * 0.55,
    shirt: SHIRTS[i % SHIRTS.length],
    pants: PANTS[i % PANTS.length],
    skin: SKINS[i % SKINS.length],
    hair: HAIR_COLORS[i % HAIR_COLORS.length],
    hairStyle: (i % 3) as 0 | 1 | 2,
  };
});

function InteractiveWalker({ w }: { w: (typeof WALKERS)[number] }) {
  const lane = WALK_LANES[w.lane];
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const st = useRef({
    x: w.startX,
    dir: w.dir,
    yaw: w.dir > 0 ? Math.PI / 2 : -Math.PI / 2,
    pauseTimer: 0,
    nextPauseIn: 4 + rnd(w.startX, 3) * 6,
  });
  const nearRef = useRef(false);
  const [talkIndex, setTalkIndex] = useState<number | null>(null);

  useEffect(() => {
    if (talkIndex === null) return;
    const t = window.setTimeout(() => setTalkIndex(null), 4000);
    return () => window.clearTimeout(t);
  }, [talkIndex]);

  useFrame(({ clock }, rawDelta) => {
    if (REDUCED_MOTION) return;
    const delta = Math.min(rawDelta, 0.05);
    const g = groupRef.current;
    if (!g) return;
    const s = st.current;
    const t = clock.elapsedTime;

    const dxP = playerPos.x - s.x;
    const dzP = playerPos.z - w.startZ;
    const isNear = Math.hypot(dxP, dzP) < 2.4;

    if (isNear && !nearRef.current) {
      setTalkIndex((prev) => (prev === null ? 0 : prev));
    }
    nearRef.current = isNear;

    // Berhenti sejenak saat diajak bicara atau sedang istirahat natural
    const talking = isNear || talkIndex !== null;
    if (!talking) {
      s.nextPauseIn -= delta;
      if (s.nextPauseIn <= 0) {
        s.pauseTimer = 1.5 + rnd(Math.floor(t), 7) * 1.5;
        s.nextPauseIn = 6 + rnd(Math.floor(t), 9) * 6;
      }
    }

    if (talking || s.pauseTimer > 0) {
      if (!talking) s.pauseTimer -= delta;
      const targetYaw = talking
        ? Math.atan2(dxP, dzP)
        : s.dir > 0
          ? Math.PI / 2
          : -Math.PI / 2;
      const diff =
        ((targetYaw - s.yaw + Math.PI) % (Math.PI * 2)) - Math.PI;
      const shortest = diff < -Math.PI ? diff + Math.PI * 2 : diff;
      s.yaw += shortest * 0.14;

      g.position.set(s.x, Math.sin(t * 2) * 0.006, w.startZ);
      g.rotation.y = s.yaw;
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.8;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.8;
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.8;
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.8;
      return;
    }

    s.x += s.dir * w.speed * delta;
    if (s.x >= lane.maxX) {
      s.x = lane.maxX;
      s.dir = -1;
    } else if (s.x <= lane.minX) {
      s.x = lane.minX;
      s.dir = 1;
    }
    const targetYaw = s.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    const diff = ((targetYaw - s.yaw + Math.PI) % (Math.PI * 2)) - Math.PI;
    const shortest = diff < -Math.PI ? diff + Math.PI * 2 : diff;
    s.yaw += shortest * 0.18;

    g.position.set(s.x, Math.abs(Math.sin(t * w.speed * 6)) * 0.025, w.startZ);
    g.rotation.y = s.yaw;

    const swing = Math.sin(t * w.speed * 5.5) * 0.48;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.65;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.65;
  });

  return (
    <group
      ref={groupRef}
      position={[w.startX, 0, w.startZ]}
      onClick={(e) => {
        e.stopPropagation();
        setTalkIndex((prev) =>
          prev === null ? 0 : (prev + 1) % w.lines.length,
        );
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <NpcFigure
        look={{
          shirt: w.shirt,
          pants: w.pants,
          skin: w.skin,
          hair: w.hair,
          hairStyle: w.hairStyle,
        }}
        leftLegRef={leftLegRef}
        rightLegRef={rightLegRef}
        leftArmRef={leftArmRef}
        rightArmRef={rightArmRef}
      />
      {talkIndex !== null && (
        <Html
          position={[0, 2.15, 0]}
          center
          zIndexRange={[30, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="relative w-max max-w-[210px] rounded-2xl border border-slate-200 bg-white/95 px-3 py-1.5 text-center shadow-lg select-none">
            <p className="text-[10px] font-bold text-blue-600">{w.name}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-800 leading-snug">
              {w.lines[talkIndex]}
            </p>
            <div className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />
          </div>
        </Html>
      )}
    </group>
  );
}

function Pedestrians() {
  return (
    <group>
      {WALKERS.map((w) => (
        <InteractiveWalker key={w.name} w={w} />
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

interface LaneSpec {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  r: number;
  dir: 1 | -1; // 1 = searah jarum jam, -1 = berlawanan
}

const LANES: Record<"outer" | "inner", LaneSpec> = {
  // Jalur luar searah jarum jam
  outer: { minX: -45.75, maxX: 45.75, minZ: -31.75, maxZ: 23.75, r: 7.75, dir: 1 },
  // Jalur dalam berlawanan arah jarum jam
  inner: { minX: -42.25, maxX: 42.25, minZ: -28.25, maxZ: 20.25, r: 5.25, dir: -1 },
};

function laneLength(l: LaneSpec): number {
  const straightX = Math.max(0, l.maxX - l.minX - 2 * l.r);
  const straightZ = Math.max(0, l.maxZ - l.minZ - 2 * l.r);
  return 2 * (straightX + straightZ) + 2 * Math.PI * l.r;
}

/** Posisi (x, z) dan arah gerak (tx, tz) pada lintasan persegi-lengkung tertutup */
function sampleLane(
  l: LaneSpec,
  dist: number,
): { x: number; z: number; tx: number; tz: number } {
  const sx = Math.max(0, l.maxX - l.minX - 2 * l.r);
  const sz = Math.max(0, l.maxZ - l.minZ - 2 * l.r);
  const arc = (Math.PI / 2) * l.r;
  const total = 2 * (sx + sz) + 4 * arc;
  let d = ((dist % total) + total) % total;

  // 1. Sisi utara (+X)
  if (d < sx) {
    return { x: l.minX + l.r + d, z: l.minZ, tx: 1, tz: 0 };
  }
  d -= sx;
  // 2. Sudut timur laut
  if (d < arc) {
    const a = -Math.PI / 2 + (d / arc) * (Math.PI / 2);
    return {
      x: l.maxX - l.r + Math.cos(a) * l.r,
      z: l.minZ + l.r + Math.sin(a) * l.r,
      tx: -Math.sin(a),
      tz: Math.cos(a),
    };
  }
  d -= arc;
  // 3. Sisi timur (+Z)
  if (d < sz) {
    return { x: l.maxX, z: l.minZ + l.r + d, tx: 0, tz: 1 };
  }
  d -= sz;
  // 4. Sudut tenggara
  if (d < arc) {
    const a = (d / arc) * (Math.PI / 2);
    return {
      x: l.maxX - l.r + Math.cos(a) * l.r,
      z: l.maxZ - l.r + Math.sin(a) * l.r,
      tx: -Math.sin(a),
      tz: Math.cos(a),
    };
  }
  d -= arc;
  // 5. Sisi selatan (-X)
  if (d < sx) {
    return { x: l.maxX - l.r - d, z: l.maxZ, tx: -1, tz: 0 };
  }
  d -= sx;
  // 6. Sudut barat daya
  if (d < arc) {
    const a = Math.PI / 2 + (d / arc) * (Math.PI / 2);
    return {
      x: l.minX + l.r + Math.cos(a) * l.r,
      z: l.maxZ - l.r + Math.sin(a) * l.r,
      tx: -Math.sin(a),
      tz: Math.cos(a),
    };
  }
  d -= arc;
  // 7. Sisi barat (-Z)
  if (d < sz) {
    return { x: l.minX, z: l.maxZ - l.r - d, tx: 0, tz: -1 };
  }
  d -= sz;
  // 8. Sudut barat laut
  const a = Math.PI + (d / arc) * (Math.PI / 2);
  return {
    x: l.minX + l.r + Math.cos(a) * l.r,
    z: l.minZ + l.r + Math.sin(a) * l.r,
    tx: -Math.sin(a),
    tz: Math.cos(a),
  };
}

interface CarSpec {
  lane: "outer" | "inner";
  speed: number;
  /** Posisi awal 0..1 sepanjang lintasan */
  offset: number;
  color: string;
}

const CARS: CarSpec[] = [
  { lane: "outer", speed: 4.2, offset: 0.05, color: CAR_COLORS[0] },
  { lane: "outer", speed: 3.8, offset: 0.30, color: CAR_COLORS[1] },
  { lane: "outer", speed: 4.0, offset: 0.56, color: CAR_COLORS[3] },
  { lane: "outer", speed: 3.9, offset: 0.82, color: CAR_COLORS[5] },
  { lane: "inner", speed: 4.1, offset: 0.12, color: CAR_COLORS[2] },
  { lane: "inner", speed: 3.7, offset: 0.46, color: CAR_COLORS[4] },
  { lane: "inner", speed: 4.0, offset: 0.78, color: CAR_COLORS[0] },
];

const SAFE_FOLLOW_DIST = 10.0;

/** Siklus lampu lalu lintas 18 detik: 0-9s hijau, 9-11s kuning, 11-18s merah */
function getTrafficSignal(elapsed: number): "green" | "yellow" | "red" {
  const m = elapsed % 18;
  if (m < 9) return "green";
  if (m < 11) return "yellow";
  return "red";
}

function Traffic({ isNight = false }: { isNight?: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const distRef = useRef<number[]>(
    CARS.map((c) => c.offset * laneLength(LANES[c.lane])),
  );

  useFrame(({ clock }, delta) => {
    if (REDUCED_MOTION) return;
    const dt = Math.min(delta, 0.05);
    const dists = distRef.current;
    const signal = getTrafficSignal(clock.elapsedTime);

    for (let i = 0; i < CARS.length; i++) {
      const c = CARS[i];
      const lane = LANES[c.lane];
      const total = laneLength(lane);
      const cur = dists[i];
      const curSample = sampleLane(lane, cur);
      const curTx = curSample.tx * lane.dir;

      let blocked = false;
      for (let j = 0; j < CARS.length; j++) {
        if (i === j || CARS[j].lane !== c.lane) continue;
        const other = dists[j];
        const forwardDist =
          lane.dir > 0
            ? (other - cur + total) % total
            : (cur - other + total) % total;
        if (forwardDist > 0 && forwardDist < SAFE_FOLLOW_DIST) {
          blocked = true;
          break;
        }
      }

      // Berhenti di belakang zebra cross (x = 0) saat lampu merah/kuning
      if (!blocked && signal !== "green" && Math.abs(curTx) > 0.7) {
        if (curTx > 0 && curSample.x >= -5.5 && curSample.x <= -2.6) {
          blocked = true;
        } else if (curTx < 0 && curSample.x <= 5.5 && curSample.x >= 2.6) {
          blocked = true;
        }
      }

      if (!blocked) {
        dists[i] = (((cur + lane.dir * c.speed * dt) % total) + total) % total;
      }

      const g = refs.current[i];
      if (!g) continue;
      const sample = sampleLane(lane, dists[i]);
      const tx = sample.tx * lane.dir;
      const tz = sample.tz * lane.dir;
      g.position.set(sample.x, 0, sample.z);
      g.rotation.y = Math.atan2(-tx, -tz);
    }
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
          <LowPolyCar
            position={[0, 0, 0]}
            color={c.color}
            isNight={isNight}
            spinning
          />
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

/* ============================================================
 * BALON UDARA & DRONE DI LANGIT
 * ============================================================ */
function SkyLife() {
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
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.14, 0]}>
          <boxGeometry args={[0.28, 0.16, 0.24]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.5} />
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

/* ============================================================
 * NPC BERSOSIALISASI & BERJALAN DI TAMAN
 * ============================================================ */
const CHATTING_NPCS: {
  name: string;
  lines: string[];
  pos: [number, number, number];
  rotY: number;
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
  hairStyle: 0 | 1 | 2;
  sitting?: boolean;
}[] = [
  // Duduk di meja kafe depan Lunara Cafe
  {
    name: "Rina",
    lines: [
      "Halo! Kopi di Lunara Cafe lagi harum banget nih.",
      "Coba masuk ke Lunara Cafe, suasananya nyaman!",
    ],
    pos: [34.72, 0, 12.2],
    rotY: Math.PI / 2,
    shirt: "#f43f5e",
    pants: "#1e293b",
    skin: "#fcd9b6",
    hair: "#271c19",
    hairStyle: 1,
    sitting: true,
  },
  {
    name: "Budi",
    lines: [
      "Selamat datang di Enuma City! Sudah coba naik trem?",
      "Kamu bisa tekan E di bangku buat duduk santai lho.",
    ],
    pos: [36.28, 0, 12.2],
    rotY: -Math.PI / 2,
    shirt: "#0ea5e9",
    pants: "#334155",
    skin: "#e2ab82",
    hair: "#111827",
    hairStyle: 0,
    sitting: true,
  },
  // Duduk di bangku taman air mancur
  {
    name: "Siti",
    lines: [
      "Air mancurnya adem banget, apalagi kalau malam!",
      "Di taman ini ada kunang-kunang juga saat malam hari.",
    ],
    pos: [-16, 0, 28.5],
    rotY: 0,
    shirt: "#10b981",
    pants: "#1e293b",
    skin: "#f5c28b",
    hair: "#3b2314",
    hairStyle: 2,
    sitting: true,
  },
  // Duduk di bangku trotoar depan Enuma HQ
  {
    name: "Dito",
    lines: [
      "Lagi istirahat sebentar sebelum balik kerja di Enuma HQ.",
      "Kalau mau ganti avatar atau dengar musik, buka ikon ponsel ya!",
    ],
    pos: [14, 0, 13.4],
    rotY: Math.PI,
    shirt: "#f59e0b",
    pants: "#1f2937",
    skin: "#f1c29b",
    hair: "#1c1917",
    hairStyle: 0,
    sitting: true,
  },
  // Menunggu di halte bus
  {
    name: "Andi",
    lines: [
      "Lagi nunggu bus kota lewat nih!",
      "Stasiun trem ada di ujung selatan taman, tinggal jalan lurus.",
    ],
    pos: [-22.6, 0, 17.1],
    rotY: 0,
    shirt: "#8b5cf6",
    pants: "#1f2937",
    skin: "#d9a273",
    hair: "#0f172a",
    hairStyle: 0,
  },
];

function InteractiveNpc({
  npc,
}: {
  npc: (typeof CHATTING_NPCS)[number];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [talkIndex, setTalkIndex] = useState<number | null>(null);
  const nearRef = useRef(false);

  useEffect(() => {
    if (talkIndex === null) return;
    const t = window.setTimeout(() => setTalkIndex(null), 4500);
    return () => window.clearTimeout(t);
  }, [talkIndex]);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const dx = playerPos.x - npc.pos[0];
    const dz = playerPos.z - npc.pos[2];
    const dist = Math.hypot(dx, dz);
    const isNear = dist < 2.8;

    // Jika pemain baru mendekat, NPC menyapa otomatis
    if (isNear && !nearRef.current) {
      setTalkIndex((prev) => (prev === null ? 0 : prev));
    }
    nearRef.current = isNear;

    // Menoleh ke arah pemain saat diajak bicara (kecuali NPC yang sedang duduk di bangku)
    if (!npc.sitting) {
      const targetYaw =
        isNear || talkIndex !== null ? Math.atan2(dx, dz) : npc.rotY;
      const diff =
        ((targetYaw - g.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      const shortest = diff < -Math.PI ? diff + Math.PI * 2 : diff;
      g.rotation.y += shortest * 0.12;
    }
  });

  return (
    <group
      ref={groupRef}
      position={npc.pos}
      rotation={[0, npc.rotY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        setTalkIndex((prev) =>
          prev === null ? 0 : (prev + 1) % npc.lines.length,
        );
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <NpcFigure
        sitting={npc.sitting}
        look={{
          shirt: npc.shirt,
          pants: npc.pants,
          skin: npc.skin,
          hair: npc.hair,
          hairStyle: npc.hairStyle,
        }}
      />
      {talkIndex !== null && (
        <Html
          position={[0, 2.15, 0]}
          center
          zIndexRange={[30, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="relative w-max max-w-[210px] rounded-2xl border border-slate-200 bg-white/95 px-3 py-1.5 text-center shadow-lg select-none">
            <p className="text-[10px] font-bold text-blue-600">{npc.name}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-800 leading-snug">
              {npc.lines[talkIndex]}
            </p>
            <div className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />
          </div>
        </Html>
      )}
    </group>
  );
}

const PARK_LINES = [
  "Taman ini paling asyik buat jalan sore!",
  "Coba klik aku atau tekan E di bangku taman buat santai.",
];

function SocialNpcs() {
  const parkWalkerRef = useRef<THREE.Group>(null);
  const parkLimbs = useRef<(THREE.Group | null)[]>([]);
  const parkAngleRef = useRef(0);
  const parkNearRef = useRef(false);
  const [parkTalk, setParkTalk] = useState<number | null>(null);

  useEffect(() => {
    if (parkTalk === null) return;
    const t = window.setTimeout(() => setParkTalk(null), 4000);
    return () => window.clearTimeout(t);
  }, [parkTalk]);

  useFrame(({ clock }, rawDelta) => {
    if (REDUCED_MOTION) return;
    const delta = Math.min(rawDelta, 0.05);
    const t = clock.elapsedTime;
    const g = parkWalkerRef.current;
    if (!g) return;

    const px = -16 + Math.cos(parkAngleRef.current) * 3.5;
    const pz = 32.5 + Math.sin(parkAngleRef.current) * 3.5;
    const dx = playerPos.x - px;
    const dz = playerPos.z - pz;
    const isNear = Math.hypot(dx, dz) < 2.5;

    if (isNear && !parkNearRef.current) {
      setParkTalk((prev) => (prev === null ? 0 : prev));
    }
    parkNearRef.current = isNear;

    if (isNear || parkTalk !== null) {
      g.position.set(px, Math.sin(t * 2) * 0.005, pz);
      g.rotation.y = Math.atan2(dx, dz);
      for (const l of parkLimbs.current) {
        if (l) l.rotation.x *= 0.8;
      }
      return;
    }

    parkAngleRef.current += delta * 0.35;
    const a = parkAngleRef.current;
    g.position.set(-16 + Math.cos(a) * 3.5, 0, 32.5 + Math.sin(a) * 3.5);
    g.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
    const swing = Math.sin(t * 5.2) * 0.45;
    if (parkLimbs.current[0]) parkLimbs.current[0].rotation.x = swing;
    if (parkLimbs.current[1]) parkLimbs.current[1].rotation.x = -swing;
    if (parkLimbs.current[2]) parkLimbs.current[2].rotation.x = -swing * 0.65;
    if (parkLimbs.current[3]) parkLimbs.current[3].rotation.x = swing * 0.65;
  });

  return (
    <group>
      {CHATTING_NPCS.map((n) => (
        <InteractiveNpc key={n.name} npc={n} />
      ))}
      <group
        ref={parkWalkerRef}
        position={[-12.5, 0, 32.5]}
        onClick={(e) => {
          e.stopPropagation();
          setParkTalk((prev) =>
            prev === null ? 0 : (prev + 1) % PARK_LINES.length,
          );
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <NpcFigure
          look={{
            shirt: "#f59e0b",
            pants: "#1e293b",
            skin: "#fcd9b6",
            hair: "#5b21b6",
            hairStyle: 1,
          }}
          leftLegRef={(el) => {
            parkLimbs.current[0] = el;
          }}
          rightLegRef={(el) => {
            parkLimbs.current[1] = el;
          }}
          leftArmRef={(el) => {
            parkLimbs.current[2] = el;
          }}
          rightArmRef={(el) => {
            parkLimbs.current[3] = el;
          }}
        />
        {parkTalk !== null && (
          <Html
            position={[0, 2.15, 0]}
            center
            zIndexRange={[30, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div className="relative w-max max-w-[210px] rounded-2xl border border-slate-200 bg-white/95 px-3 py-1.5 text-center shadow-lg select-none">
              <p className="text-[10px] font-bold text-blue-600">Maya</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-800 leading-snug">
                {PARK_LINES[parkTalk]}
              </p>
              <div className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

/** Suara ambient kota ringan (angin lembut & suasana luar ruangan) */
function CityAmbientSound() {
  useEffect(() => {
    let ctx: AudioContext | null = null;
    let src: AudioBufferSourceNode | null = null;
    let started = false;

    const start = () => {
      if (started) return;
      started = true;
      try {
        ctx = new AudioContext();
        const len = ctx.sampleRate * 2;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) {
          last = (last + 0.015 * (Math.random() * 2 - 1)) / 1.015;
          data[i] = last * 3.0;
        }
        src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 380;
        const gain = ctx.createGain();
        gain.gain.value = 0.02;
        src.connect(lp).connect(gain).connect(ctx.destination);
        src.start();
      } catch {
        /* Abaikan jika browser memblokir AudioContext */
      }
    };

    const events = ["pointerdown", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, start, { once: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, start));
      try {
        src?.stop();
      } catch {
        /* sudah berhenti */
      }
      void ctx?.close();
    };
  }, []);

  return null;
}

/* ============================================================
 * NPC OTONOM MULTI-AKTIVITAS (Duduk di Taman, Pinggir Kota, & Naik Trem)
 * ============================================================ */
type ActivityStep =
  | { kind: "sit"; x: number; z: number; rotY: number; duration: number; line: string }
  | { kind: "visit"; x: number; z: number; rotY: number; duration: number; line: string }
  | {
      kind: "tram";
      waitX: number;
      waitZ: number;
      rx: number;
      rz: number;
      duration: number;
      line: string;
    };

interface AutonomousSpec {
  name: string;
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
  hairStyle: 0 | 1 | 2;
  start: [number, number];
  schedule: ActivityStep[];
}

const AUTONOMOUS_NPCS: AutonomousSpec[] = [
  {
    name: "Rama",
    shirt: "#2563eb",
    pants: "#1e293b",
    skin: "#f1c29b",
    hair: "#1e1b18",
    hairStyle: 0,
    start: [-5.5, 45.8],
    schedule: [
      { kind: "tram", waitX: -5.5, waitZ: 47.2, rx: -0.35, rz: -4.2, duration: 14, line: "Lagi nunggu trem di peron nih, sebentar lagi datang!" },
      { kind: "sit", x: -8, z: 13.4, rotY: Math.PI, duration: 7, line: "Duduk santai di pinggir jalan kota dulu ah." },
      { kind: "sit", x: -20.0, z: 32.5, rotY: Math.PI / 2, duration: 8, line: "Sekarang pindah duduk di taman air mancur!" },
      { kind: "visit", x: 27.5, z: 11.5, rotY: Math.PI, duration: 5, line: "Habis jalan-jalan, mampir lihat Lunara Cafe." },
    ],
  },
  {
    name: "Tara",
    shirt: "#ec4899",
    pants: "#334155",
    skin: "#fcd9b6",
    hair: "#5b21b6",
    hairStyle: 1,
    start: [-2.5, 46.2],
    schedule: [
      { kind: "tram", waitX: -2.5, waitZ: 47.2, rx: 0.35, rz: -2.0, duration: 14, line: "Berdiri di peron sambil nunggu kereta datang!" },
      { kind: "sit", x: -16, z: 36.5, rotY: Math.PI, duration: 8, line: "Suka banget duduk di bangku taman ini." },
      { kind: "sit", x: 6, z: 13.4, rotY: Math.PI, duration: 7, line: "Istirahat sebentar di bangku trotoar." },
      { kind: "visit", x: -12.65, z: 11.5, rotY: Math.PI, duration: 5, line: "Mau belanja camilan di Indomaret!" },
    ],
  },
  {
    name: "Nando",
    shirt: "#16a34a",
    pants: "#1f2937",
    skin: "#d9a273",
    hair: "#0f172a",
    hairStyle: 0,
    start: [0.5, 45.5],
    schedule: [
      { kind: "tram", waitX: 0.5, waitZ: 47.2, rx: -0.35, rz: 0.4, duration: 14, line: "Ikut naik trem bareng teman-teman keliling kota!" },
      { kind: "sit", x: 28, z: 13.4, rotY: Math.PI, duration: 7, line: "Duduk di pinggir kota sambil lihat mobil lewat." },
      { kind: "visit", x: -30.85, z: 11.5, rotY: Math.PI, duration: 5, line: "Cek jajanan di Warung Madura dulu!" },
      { kind: "sit", x: -12.0, z: 32.5, rotY: -Math.PI / 2, duration: 7, line: "Air mancurnya bikin suasana taman jadi sejuk." },
    ],
  },
  {
    name: "Salsa",
    shirt: "#f59e0b",
    pants: "#1e293b",
    skin: "#f5c28b",
    hair: "#7c2d12",
    hairStyle: 2,
    start: [3.5, 46.0],
    schedule: [
      { kind: "tram", waitX: 3.5, waitZ: 47.2, rx: 0.35, rz: 2.6, duration: 14, line: "Keretanya bentar lagi berhenti di peron ini!" },
      { kind: "sit", x: -16, z: 28.5, rotY: 0, duration: 7, line: "Taman kota ini nyaman banget buat santai." },
      { kind: "visit", x: 8.7, z: 11.5, rotY: Math.PI, duration: 5, line: "Mau mampir ke kantor Enuma HQ sebentar." },
    ],
  },
  {
    name: "Yoga",
    shirt: "#0ea5e9",
    pants: "#312e81",
    skin: "#e2ab82",
    hair: "#3b2314",
    hairStyle: 0,
    start: [6.5, 45.8],
    schedule: [
      { kind: "tram", waitX: 6.5, waitZ: 47.2, rx: -0.35, rz: -6.5, duration: 14, line: "Siap-siap naik trem dari peron Stasiun Enuma!" },
      { kind: "sit", x: 6, z: -22.9, rotY: 0, duration: 7, line: "Duduk di sisi utara kota juga tenang banget." },
      { kind: "visit", x: 0, z: 32.5, rotY: -Math.PI / 2, duration: 5, line: "Jalan santai di jalur taman." },
    ],
  },
];

function AutonomousNpc({ spec }: { spec: AutonomousSpec }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const [sitting, setSitting] = useState(false);
  const [talkLine, setTalkLine] = useState<string | null>(null);
  const nearRef = useRef(false);

  const st = useRef({
    x: spec.start[0],
    z: spec.start[1],
    yaw: 0,
    stepIdx: 0,
    phase: "walk" as "walk" | "act" | "wait_tram" | "ride_tram",
    timer: 0,
    rideTimer: 0,
    sittingState: false,
  });

  useEffect(() => {
    if (!talkLine) return;
    const t = window.setTimeout(() => setTalkLine(null), 4000);
    return () => window.clearTimeout(t);
  }, [talkLine]);

  useFrame(({ clock }, rawDelta) => {
    if (REDUCED_MOTION) return;
    const delta = Math.min(rawDelta, 0.05);
    const t = clock.elapsedTime;
    const g = groupRef.current;
    if (!g) return;

    const s = st.current;
    const step = spec.schedule[s.stepIdx];

    const dxP = playerPos.x - s.x;
    const dzP = playerPos.z - s.z;
    const isNear = Math.hypot(dxP, dzP) < 2.5;
    if (isNear && !nearRef.current) {
      setTalkLine(step.line);
    }
    nearRef.current = isNear;

    const setSitPose = (val: boolean) => {
      if (s.sittingState !== val) {
        s.sittingState = val;
        setSitting(val);
      }
    };

    // Jika sedang naik trem
    if (s.phase === "ride_tram") {
      setSitPose(false);
      if (step.kind === "tram") {
        stepTramView(t);
        const [tx, tz] = riderWorldPos(step.rx, step.rz);
        s.x = tx;
        s.z = tz;
        s.rideTimer += delta;
        g.position.set(tx, TRAM.floorY, tz);
        g.rotation.y = Math.PI / 2;
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
        if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
        if (rightArmRef.current) rightArmRef.current.rotation.x = 0;

        if (s.rideTimer >= step.duration && isTramStopped()) {
          // Turun kembali ke peron stasiun
          s.x = step.waitX;
          s.z = step.waitZ;
          s.phase = "walk";
          s.stepIdx = (s.stepIdx + 1) % spec.schedule.length;
        }
      }
      return;
    }

    // Jika menunggu trem di peron, menghadap ke rel kereta (+Z => rotation.y = 0)
    if (s.phase === "wait_tram") {
      setSitPose(false);
      g.position.set(s.x, platformY(s.x, s.z), s.z);
      g.rotation.y = isNear ? Math.atan2(dxP, dzP) : 0;
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.8;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.8;
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.8;
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.8;

      if (isTramStopped()) {
        s.phase = "ride_tram";
        s.rideTimer = 0;
      }
      return;
    }

    // Jika sedang duduk atau berkunjung di tempat tujuan
    if (s.phase === "act" && step.kind !== "tram") {
      s.timer -= delta;
      const isSitStep = step.kind === "sit";
      setSitPose(isSitStep);
      const y = platformY(s.x, s.z) + (isSitStep ? 0 : Math.sin(t * 2) * 0.005);
      g.position.set(s.x, y, s.z);
      if (isSitStep) {
        g.rotation.y = step.rotY;
      } else {
        g.rotation.y = isNear ? Math.atan2(dxP, dzP) : step.rotY;
        if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.8;
        if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.8;
        if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.8;
        if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.8;
      }

      if (s.timer <= 0 && !isNear) {
        setSitPose(false);
        s.phase = "walk";
        s.stepIdx = (s.stepIdx + 1) % spec.schedule.length;
      }
      return;
    }

    // Fase berjalan menuju target aktivitas berikutnya (lewat zebra cross x = 0 jika menyeberang jalan)
    setSitPose(false);
    const destX = step.kind === "tram" ? step.waitX : step.x;
    const destZ = step.kind === "tram" ? step.waitZ : step.z;

    let targetX = destX;
    let targetZ = destZ;

    // Cek apakah harus menyeberangi jalan selatan (z 18.5..25.5) -> wajib lewat zebra cross x = 0
    const crossesSouthFromNorth = s.z < 18.2 && destZ > 25.8;
    const crossesSouthFromSouth = s.z > 25.8 && destZ < 18.2;
    const signal = getTrafficSignal(t);

    if (crossesSouthFromNorth) {
      if (Math.abs(s.x) > 0.7 && s.z < 18.0) {
        targetX = 0;
        targetZ = 17.6;
      } else {
        // Sudah di mulut zebra cross: tunggu sampai lampu kendaraan kuning/merah
        if (s.z >= 17.2 && s.z < 18.5 && signal === "green") {
          g.position.set(s.x, platformY(s.x, s.z), s.z);
          g.rotation.y = 0;
          if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.8;
          if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.8;
          if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.8;
          if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.8;
          return;
        }
        targetX = 0;
        targetZ = 26.4;
      }
    } else if (crossesSouthFromSouth) {
      if (Math.abs(s.x) > 0.7 && s.z > 26.0) {
        targetX = 0;
        targetZ = 26.4;
      } else {
        if (s.z <= 26.8 && s.z > 25.5 && signal === "green") {
          g.position.set(s.x, platformY(s.x, s.z), s.z);
          g.rotation.y = Math.PI;
          if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.8;
          if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.8;
          if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.8;
          if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.8;
          return;
        }
        targetX = 0;
        targetZ = 17.6;
      }
    }

    if (isNear && talkLine !== null) {
      g.position.set(s.x, platformY(s.x, s.z), s.z);
      g.rotation.y = Math.atan2(dxP, dzP);
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.8;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.8;
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.8;
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.8;
      return;
    }

    const dx = targetX - s.x;
    const dz = targetZ - s.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.25) {
      s.x = targetX;
      s.z = targetZ;
      if (targetX === destX && targetZ === destZ) {
        if (step.kind === "tram") {
          s.phase = "wait_tram";
        } else {
          s.phase = "act";
          s.timer = step.duration;
        }
      }
      return;
    }

    const speed = 1.65;
    const move = Math.min(dist, speed * delta);
    s.x += (dx / dist) * move;
    s.z += (dz / dist) * move;
    s.yaw = Math.atan2(dx, dz);

    g.position.set(
      s.x,
      platformY(s.x, s.z) + Math.abs(Math.sin(t * 7)) * 0.025,
      s.z,
    );
    g.rotation.y = s.yaw;

    const swing = Math.sin(t * 7) * 0.48;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.65;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.65;
  });

  return (
    <group
      ref={groupRef}
      position={[spec.start[0], 0, spec.start[1]]}
      onClick={(e) => {
        e.stopPropagation();
        const step = spec.schedule[st.current.stepIdx];
        setTalkLine(step.line);
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <NpcFigure
        sitting={sitting}
        look={{
          shirt: spec.shirt,
          pants: spec.pants,
          skin: spec.skin,
          hair: spec.hair,
          hairStyle: spec.hairStyle,
        }}
        leftLegRef={sitting ? undefined : leftLegRef}
        rightLegRef={sitting ? undefined : rightLegRef}
        leftArmRef={sitting ? undefined : leftArmRef}
        rightArmRef={sitting ? undefined : rightArmRef}
      />
      {talkLine && (
        <Html
          position={[0, sitting ? 1.95 : 2.15, 0]}
          center
          zIndexRange={[30, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="relative w-max max-w-[210px] rounded-2xl border border-slate-200 bg-white/95 px-3 py-1.5 text-center shadow-lg select-none">
            <p className="text-[10px] font-bold text-blue-600">{spec.name}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-800 leading-snug">
              {talkLine}
            </p>
            <div className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />
          </div>
        </Html>
      )}
    </group>
  );
}

function AutonomousNpcs() {
  return (
    <group>
      {AUTONOMOUS_NPCS.map((spec) => (
        <AutonomousNpc key={spec.name} spec={spec} />
      ))}
    </group>
  );
}

/* ============================================================
 * LAMPU LALU LINTAS AKTIF DI ZEBRA CROSS
 * ============================================================ */
const SIGNAL_POLES: { pos: [number, number, number]; rotY: number }[] = [
  { pos: [-3.8, 0, 26.2], rotY: 0 },
  { pos: [3.8, 0, 17.8], rotY: Math.PI },
  { pos: [-3.8, 0, -25.8], rotY: 0 },
  { pos: [3.8, 0, -34.2], rotY: Math.PI },
];

const OFF_COLOR = new THREE.Color("#1f2937");
const SIGNAL_COLORS = {
  red: new THREE.Color("#ff2e2e"),
  yellow: new THREE.Color("#ffd60a"),
  green: new THREE.Color("#22ff55"),
};

function TrafficLights() {
  const redRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const yellowRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const greenRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useFrame(({ clock }) => {
    const sig = getTrafficSignal(clock.elapsedTime);
    for (let i = 0; i < SIGNAL_POLES.length; i++) {
      for (let side = 0; side < 2; side++) {
        const idx = i * 2 + side;
        const r = redRefs.current[idx];
        const y = yellowRefs.current[idx];
        const g = greenRefs.current[idx];
        if (r) {
          const on = sig === "red";
          r.color.copy(on ? SIGNAL_COLORS.red : OFF_COLOR);
          r.emissiveIntensity = on ? 3.5 : 0;
        }
        if (y) {
          const on = sig === "yellow";
          y.color.copy(on ? SIGNAL_COLORS.yellow : OFF_COLOR);
          y.emissiveIntensity = on ? 3.5 : 0;
        }
        if (g) {
          const on = sig === "green";
          g.color.copy(on ? SIGNAL_COLORS.green : OFF_COLOR);
          g.emissiveIntensity = on ? 3.5 : 0;
        }
      }
    }
  });

  return (
    <group>
      {SIGNAL_POLES.map((p, i) => (
        <group key={i} position={p.pos} rotation={[0, p.rotY, 0]}>
          {/* Tiang utama & lengan kantilever menjorok ke arah jalan */}
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 4.4, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 4.25, -0.85]}>
            <boxGeometry args={[0.12, 0.12, 1.8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Kotak lampu menghadap arah datang mobil (+X & -X) */}
          <group position={[0, 4.05, -1.55]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <boxGeometry args={[0.52, 1.48, 0.42]} />
              <meshStandardMaterial color="#090d16" roughness={0.5} />
            </mesh>
            {[0.21, -0.21].map((zFace, side) => {
              const idx = i * 2 + side;
              const rotY = side === 0 ? 0 : Math.PI;
              return (
                <group key={side} position={[0, 0, zFace]} rotation={[0, rotY, 0]}>
                  <mesh position={[0, 0.44, 0.04]} scale={[1, 1, 0.55]}>
                    <sphereGeometry args={[0.16, 14, 12]} />
                    <meshStandardMaterial
                      ref={(el) => {
                        redRefs.current[idx] = el;
                      }}
                      color="#1f2937"
                      emissive="#ff2e2e"
                      emissiveIntensity={0}
                      roughness={0.2}
                    />
                  </mesh>
                  <mesh position={[0, 0, 0.04]} scale={[1, 1, 0.55]}>
                    <sphereGeometry args={[0.16, 14, 12]} />
                    <meshStandardMaterial
                      ref={(el) => {
                        yellowRefs.current[idx] = el;
                      }}
                      color="#1f2937"
                      emissive="#ffd60a"
                      emissiveIntensity={0}
                      roughness={0.2}
                    />
                  </mesh>
                  <mesh position={[0, -0.44, 0.04]} scale={[1, 1, 0.55]}>
                    <sphereGeometry args={[0.16, 14, 12]} />
                    <meshStandardMaterial
                      ref={(el) => {
                        greenRefs.current[idx] = el;
                      }}
                      color="#22ff55"
                      emissive="#22ff55"
                      emissiveIntensity={3.5}
                      roughness={0.2}
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        </group>
      ))}
    </group>
  );
}

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
        <Html position={[0, 0.72, 0]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
          <div className="w-max rounded-full border border-rose-200 bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-rose-500 shadow">
            {cat.name}: Meong~ ♥
          </div>
        </Html>
      )}
    </group>
  );
}

function CityCats() {
  return (
    <group>
      {CAT_SPECS.map((cat) => (
        <CityCat key={cat.name} cat={cat} />
      ))}
    </group>
  );
}

/* ============================================================
 * PESEPEDA KOTA
 * ============================================================ */
const CYCLIST_LANE: LaneSpec = {
  minX: -37.5,
  maxX: 37.5,
  minZ: -23.5,
  maxZ: 15.8,
  r: 3.0,
  dir: 1,
};

function CityCyclists() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const wheels = useRef<(THREE.Group | null)[]>([]);
  const total = laneLength(CYCLIST_LANE);

  useFrame(({ clock }) => {
    if (REDUCED_MOTION) return;
    const t = clock.elapsedTime;

    [0, 0.5].forEach((offset, i) => {
      const g = refs.current[i];
      if (!g) return;
      const dist = t * 3.4 + offset * total;
      const s = sampleLane(CYCLIST_LANE, dist);
      g.position.set(s.x, 0, s.z);
      g.rotation.y = Math.atan2(s.tx, s.tz);
      for (let k = 0; k < 2; k++) {
        const w = wheels.current[i * 2 + k];
        if (w) w.rotation.x += 0.18;
      }
    });
  });

  return (
    <group>
      {[
        { shirt: "#0ea5e9", bike: "#ef4444" },
        { shirt: "#22c55e", bike: "#f59e0b" },
      ].map((c, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          {/* Roda depan & belakang sejajar arah laju sepeda (bidang YZ, poros X) */}
          {[0.45, -0.45].map((z, k) => (
            <group
              key={k}
              ref={(el) => {
                wheels.current[i * 2 + k] = el;
              }}
              position={[0, 0.28, z]}
            >
              <mesh rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.26, 0.04, 8, 16]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              {/* Jari-jari agar putaran roda terlihat jelas */}
              <mesh>
                <boxGeometry args={[0.02, 0.46, 0.025]} />
                <meshStandardMaterial color="#cbd5e1" />
              </mesh>
              <mesh>
                <boxGeometry args={[0.02, 0.025, 0.46]} />
                <meshStandardMaterial color="#cbd5e1" />
              </mesh>
            </group>
          ))}
          {/* Rangka sepeda & stang */}
          <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
            <meshStandardMaterial color={c.bike} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.72, 0.38]}>
            <boxGeometry args={[0.42, 0.04, 0.04]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          {/* Pengendara */}
          <group position={[0, 0.12, -0.05]}>
            <NpcFigure
              sitting
              scale={0.78}
              look={{
                shirt: c.shirt,
                pants: "#1e293b",
                skin: "#f5c28b",
                hair: "#1e1b18",
                hairStyle: 0,
              }}
            />
          </group>
        </group>
      ))}
    </group>
  );
}

/** Semua elemen hidup kota. Tidak dikirim ke server dan tidak ikut collision. */
export function CityLife({ isNight = false }: { isNight?: boolean }) {
  return (
    <group>
      <Pedestrians />
      <SocialNpcs />
      <AutonomousNpcs />
      <CityCats />
      <CityCyclists />
      <TrafficLights />
      <Traffic isNight={isNight} />
      <Birds />
      <Clouds />
      <LampGlow />
      <SkyLife />
      <CityAmbientSound />
    </group>
  );
}