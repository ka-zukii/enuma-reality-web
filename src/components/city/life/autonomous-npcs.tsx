import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { NpcFigure } from "@/components/NpcFigure";
import { playerPos } from "@/lib/playerPosition";
import { platformY } from "@/config/railway";
import {
  isTramStopped,
  riderWorldPos,
  stepTramView,
  TRAM,
} from "@/lib/tramRuntime";
import { REDUCED_MOTION } from "@/components/city/life/shared";
import { getTrafficSignal } from "@/components/city/life/traffic";

/* ============================================================
 * NPC OTONOM MULTI-AKTIVITAS (Duduk di Taman, Pinggir Kota, & Naik Trem)
 * ============================================================ */
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

export function AutonomousNpcs() {
  return (
    <group>
      {AUTONOMOUS_NPCS.map((spec) => (
        <AutonomousNpc key={spec.name} spec={spec} />
      ))}
    </group>
  );
}
