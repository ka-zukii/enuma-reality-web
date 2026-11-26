import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { NpcFigure } from "@/components/NpcFigure";
import { createNpcPose, interactNpc, readNpcPose, useNpcTalk, type NpcPose } from "@/lib/npcRuntime";
import { swingBiped } from "@/lib/npcLimbs";

const pose: NpcPose = createNpcPose();

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

function InteractiveNpc({ npc }: { npc: (typeof CHATTING_NPCS)[number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const id = npc.name.toLowerCase();
  const talkIndex = useNpcTalk(id);

  useFrame(() => {
    const g = groupRef.current;
    if (!g || !readNpcPose(id, pose)) return;
    // Posisi tetap; yang dikirim server hanya arah hadap (menoleh ke pemain)
    g.rotation.y = pose.yaw;
  });
  return (
    <group
      ref={groupRef}
      position={npc.pos}
      rotation={[0, npc.rotY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        interactNpc(id);
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
      {talkIndex >= 0 && (
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

export function SocialNpcs() {
  const parkWalkerRef = useRef<THREE.Group>(null);
  const parkLimbs = useRef<(THREE.Group | null)[]>([]);
  const parkTalk = useNpcTalk("maya");

  useFrame(({ clock }) => {
    const g = parkWalkerRef.current;
    if (!g || !readNpcPose("maya", pose)) return;
    g.position.set(pose.x, pose.y, pose.z);
    g.rotation.y = pose.yaw;
    swingBiped(
      pose.anim === 1,
      clock.elapsedTime * 5.2,
      parkLimbs.current[0] ?? null,
      parkLimbs.current[1] ?? null,
      parkLimbs.current[2] ?? null,
      parkLimbs.current[3] ?? null,
    );
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
          interactNpc("maya");
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
        {parkTalk >= 0 && (
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
