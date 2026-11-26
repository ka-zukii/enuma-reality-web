import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { NpcFigure } from "@/components/NpcFigure";
import { createNpcPose, interactNpc, readNpcPose, useNpcTalk, type NpcPose } from "@/lib/npcRuntime";
import { swingBiped } from "@/lib/npcLimbs";

/* ============================================================
 * NPC OTONOM (jadwal di client hanya untuk dialog; posisi dari server)
 * ============================================================ */
const pose: NpcPose = createNpcPose();

type ActivityStep =
  | {
      kind: "sit";
      x: number;
      z: number;
      rotY: number;
      duration: number;
      line: string;
    }
  | {
      kind: "visit";
      x: number;
      z: number;
      rotY: number;
      duration: number;
      line: string;
    }
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
      {
        kind: "tram",
        waitX: -5.5,
        waitZ: 47.2,
        rx: -0.35,
        rz: -4.2,
        duration: 14,
        line: "Lagi nunggu trem di peron nih, sebentar lagi datang!",
      },
      {
        kind: "sit",
        x: -8,
        z: 13.4,
        rotY: Math.PI,
        duration: 7,
        line: "Duduk santai di pinggir jalan kota dulu ah.",
      },
      {
        kind: "sit",
        x: -20.0,
        z: 32.5,
        rotY: Math.PI / 2,
        duration: 8,
        line: "Sekarang pindah duduk di taman air mancur!",
      },
      {
        kind: "visit",
        x: 27.5,
        z: 11.5,
        rotY: Math.PI,
        duration: 5,
        line: "Habis jalan-jalan, mampir lihat Lunara Cafe.",
      },
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
      {
        kind: "tram",
        waitX: -2.5,
        waitZ: 47.2,
        rx: 0.35,
        rz: -2.0,
        duration: 14,
        line: "Berdiri di peron sambil nunggu kereta datang!",
      },
      {
        kind: "sit",
        x: -16,
        z: 36.5,
        rotY: Math.PI,
        duration: 8,
        line: "Suka banget duduk di bangku taman ini.",
      },
      {
        kind: "sit",
        x: 6,
        z: 13.4,
        rotY: Math.PI,
        duration: 7,
        line: "Istirahat sebentar di bangku trotoar.",
      },
      {
        kind: "visit",
        x: -12.65,
        z: 11.5,
        rotY: Math.PI,
        duration: 5,
        line: "Mau belanja camilan di Indomaret!",
      },
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
      {
        kind: "tram",
        waitX: 0.5,
        waitZ: 47.2,
        rx: -0.35,
        rz: 0.4,
        duration: 14,
        line: "Ikut naik trem bareng teman-teman keliling kota!",
      },
      {
        kind: "sit",
        x: 28,
        z: 13.4,
        rotY: Math.PI,
        duration: 7,
        line: "Duduk di pinggir kota sambil lihat mobil lewat.",
      },
      {
        kind: "visit",
        x: -30.85,
        z: 11.5,
        rotY: Math.PI,
        duration: 5,
        line: "Cek jajanan di Warung Madura dulu!",
      },
      {
        kind: "sit",
        x: -12.0,
        z: 32.5,
        rotY: -Math.PI / 2,
        duration: 7,
        line: "Air mancurnya bikin suasana taman jadi sejuk.",
      },
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
      {
        kind: "tram",
        waitX: 3.5,
        waitZ: 47.2,
        rx: 0.35,
        rz: 2.6,
        duration: 14,
        line: "Keretanya bentar lagi berhenti di peron ini!",
      },
      {
        kind: "sit",
        x: -16,
        z: 28.5,
        rotY: 0,
        duration: 7,
        line: "Taman kota ini nyaman banget buat santai.",
      },
      {
        kind: "visit",
        x: 8.7,
        z: 11.5,
        rotY: Math.PI,
        duration: 5,
        line: "Mau mampir ke kantor Enuma HQ sebentar.",
      },
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
      {
        kind: "tram",
        waitX: 6.5,
        waitZ: 47.2,
        rx: -0.35,
        rz: -6.5,
        duration: 14,
        line: "Siap-siap naik trem dari peron Stasiun Enuma!",
      },
      {
        kind: "sit",
        x: 6,
        z: -22.9,
        rotY: 0,
        duration: 7,
        line: "Duduk di sisi utara kota juga tenang banget.",
      },
      {
        kind: "visit",
        x: 0,
        z: 32.5,
        rotY: -Math.PI / 2,
        duration: 5,
        line: "Jalan santai di jalur taman.",
      },
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
  const id = spec.name.toLowerCase();
  // Bubble = indeks langkah jadwal dari server; teks diambil dari jadwal lokal
  const talk = useNpcTalk(id);
  const talkLine = talk >= 0 ? spec.schedule[talk]?.line ?? null : null;

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g || !readNpcPose(id, pose)) return;
    const isSit = pose.anim === 2;
    if (isSit !== sitting) setSitting(isSit);
    g.position.set(pose.x, pose.y, pose.z);
    g.rotation.y = pose.yaw;
    if (pose.ride === 1 || isSit) return;
    swingBiped(
      pose.anim === 1,
      clock.elapsedTime * 7,
      leftLegRef.current,
      rightLegRef.current,
      leftArmRef.current,
      rightArmRef.current,
    );
  });
  return (
    <group
      ref={groupRef}
      position={[spec.start[0], 0, spec.start[1]]}
      onClick={(e) => {
        e.stopPropagation();
        interactNpc(id);
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

export function AutonomousNpcs() {
  return (
    <group>
      {AUTONOMOUS_NPCS.map((spec) => (
        <AutonomousNpc key={spec.name} spec={spec} />
      ))}
    </group>
  );
}
