import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { NpcFigure } from "@/components/NpcFigure";
import { playerPos } from "@/lib/playerPosition";
import {
  HAIR_COLORS,
  PANTS,
  REDUCED_MOTION,
  SHIRTS,
  SKINS,
  rnd,
} from "@/components/city/life/shared";

/* ============================================================
 * PEJALAN KAKI INTERAKTIF
 * Berjalan di trotoar dengan jeda natural, spawn merata, dan bisa diajak bicara.
 * ============================================================ */
const WALK_LANES = [
  { z: 14.8, minX: -35, maxX: 35 }, // trotoar depan gedung (aman dari bangku z=13.4)
  { z: -21.2, minX: -35, maxX: 35 }, // trotoar belakang gedung
];

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
  [
    "Halo! Cuaca di kota enak banget buat jalan santai.",
    "Jangan lupa mampir ke Lunara Cafe ya!",
  ],
  [
    "Hai! Lagi jalan-jalan keliling kota nih.",
    "Udah lihat menara jam di taman selatan?",
  ],
  [
    "Permisi, mau ke Indomaret sebentar!",
    "Katanya ada musik baru di aplikasi Spotify ponselmu.",
  ],
  [
    "Halo! Senang ketemu di sini.",
    "Kalau capek jalan, duduk aja di bangku taman!",
  ],
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
      const diff = ((targetYaw - s.yaw + Math.PI) % (Math.PI * 2)) - Math.PI;
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

export function Pedestrians() {
  return (
    <group>
      {WALKERS.map((w) => (
        <InteractiveWalker key={w.name} w={w} />
      ))}
    </group>
  );
}
