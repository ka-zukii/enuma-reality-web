import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { NpcFigure } from "@/components/NpcFigure";
import { createNpcPose, interactNpc, readNpcPose, useNpcTalk, type NpcPose } from "@/lib/npcRuntime";
import { swingBiped } from "@/lib/npcLimbs";

const pose: NpcPose = createNpcPose();
import {
  HAIR_COLORS,
  PANTS,
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
    id: `walker-${i}`,
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
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const talkIndex = useNpcTalk(w.id);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g || !readNpcPose(w.id, pose)) return;
    g.position.set(pose.x, pose.y, pose.z);
    g.rotation.y = pose.yaw;
    swingBiped(
      pose.anim === 1,
      clock.elapsedTime * w.speed * 5.5,
      leftLegRef.current,
      rightLegRef.current,
      leftArmRef.current,
      rightArmRef.current,
    );
  });
  return (
    <group
      ref={groupRef}
      position={[w.startX, 0, w.startZ]}
      onClick={(e) => {
        e.stopPropagation();
        interactNpc(w.id);
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
      {talkIndex >= 0 && (
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
