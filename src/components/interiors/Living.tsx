import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Box, BuildingKey, InteriorConfig, StairsConfig } from "@/config/buildings";
import { NpcFigure } from "@/components/NpcFigure";
import { playerPos } from "@/lib/playerPosition";

const NPC_MARGIN = 0.45;

/* ---------- Debu / partikel melayang ---------- */

export function Dust({
  bounds,
  height = 3,
  count = 140,
}: {
  bounds: InteriorConfig["bounds"];
  height?: number;
  count?: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sp = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = THREE.MathUtils.lerp(bounds.minX, bounds.maxX, Math.random());
      pos[i * 3 + 1] = Math.random() * height;
      pos[i * 3 + 2] = THREE.MathUtils.lerp(bounds.minZ, bounds.maxZ, Math.random());
      sp[i] = 0.03 + Math.random() * 0.08;
    }
    return { positions: pos, speeds: sp };
  }, [bounds, height, count]);

  useFrame((state, delta) => {
    const geo = ref.current?.geometry;
    if (!geo) return;
    const arr = geo.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta;
      arr[i * 3] += Math.sin(t * 0.4 + i) * 0.002;
      if (arr[i * 3 + 1] > height) arr[i * 3 + 1] = 0;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#fff3d1"
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </points>
  );
}

/* ---------- NPC ---------- */

function isFree(
  x: number,
  z: number,
  obstacles: Box[],
  stairs: StairsConfig | undefined,
  margin: number,
) {
  for (const b of obstacles) {
    if (
      x > b.minX - margin &&
      x < b.maxX + margin &&
      z > b.minZ - margin &&
      z < b.maxZ + margin
    )
      return false;
  }
  if (stairs) {
    const b = stairs.box;
    if (x > b.minX - 0.6 && x < b.maxX + 0.6 && z > b.minZ - 0.6 && z < b.maxZ + 0.6)
      return false;
  }
  return true;
}

function pickFreePoint(
  bounds: InteriorConfig["bounds"],
  obstacles: Box[],
  stairs: StairsConfig | undefined,
  fallback: THREE.Vector3,
  avoid: THREE.Vector3[] = [],
  minGap = 1.6,
) {
  for (let i = 0; i < 60; i++) {
    const x = THREE.MathUtils.lerp(bounds.minX + 0.8, bounds.maxX - 0.8, Math.random());
    const z = THREE.MathUtils.lerp(bounds.minZ + 0.8, bounds.maxZ - 0.8, Math.random());
    if (!isFree(x, z, obstacles, stairs, NPC_MARGIN)) continue;
    if (avoid.some((p) => Math.hypot(x - p.x, z - p.z) < minGap)) continue;
    return new THREE.Vector3(x, 0, z);
  }
  return fallback.clone();
}

function Npc({
  name,
  lines,
  start,
  bounds,
  obstacles,
  stairs,
  shirt,
  pants,
  skin,
  hair,
  hairStyle = 0,
  speed = 0.6,
}: {
  name: string;
  lines: string[];
  start: THREE.Vector3;
  bounds: InteriorConfig["bounds"];
  obstacles: Box[];
  stairs?: StairsConfig;
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
  hairStyle?: 0 | 1 | 2;
  speed?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const st = useRef({
    pos: start.clone(),
    target: null as THREE.Vector3 | null,
    wait: 1 + Math.random() * 2.5,
    yaw: Math.random() * Math.PI * 2,
  });
  const nearRef = useRef(false);
  const [talkIndex, setTalkIndex] = useState<number | null>(null);

  useEffect(() => {
    if (talkIndex === null) return;
    const t = window.setTimeout(() => setTalkIndex(null), 4000);
    return () => window.clearTimeout(t);
  }, [talkIndex]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const s = st.current;
    const t = state.clock.elapsedTime;

    const dxP = playerPos.x - s.pos.x;
    const dzP = playerPos.z - s.pos.z;
    const isNear = Math.hypot(dxP, dzP) < 2.1;

    if (isNear && !nearRef.current) {
      setTalkIndex((prev) => (prev === null ? 0 : prev));
    }
    nearRef.current = isNear;

    // Berhenti & menoleh ke pemain saat diajak bicara
    if (isNear || talkIndex !== null) {
      const targetYaw = Math.atan2(dxP, dzP);
      const diff = ((targetYaw - s.yaw + Math.PI) % (Math.PI * 2)) - Math.PI;
      const shortest = diff < -Math.PI ? diff + Math.PI * 2 : diff;
      s.yaw += shortest * 0.14;
      g.position.set(s.pos.x, Math.sin(t * 1.5) * 0.005, s.pos.z);
      g.rotation.y = s.yaw;
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.8;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.8;
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.8;
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.8;
      return;
    }

    if (s.wait > 0) {
      // Diam: berdiri sebentar, tangan & kaki rileks
      s.wait -= delta;
      g.position.set(s.pos.x, Math.sin(t * 1.5) * 0.005, s.pos.z);
      g.rotation.y = s.yaw;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
      return;
    }

    if (!s.target) s.target = pickFreePoint(bounds, obstacles, stairs, s.pos);

    const dx = s.target.x - s.pos.x;
    const dz = s.target.z - s.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.05) {
      s.target = null;
      s.wait = 2 + Math.random() * 4;
      return;
    }

    const step = Math.min(dist, speed * delta);
    const nx = s.pos.x + (dx / dist) * step;
    const nz = s.pos.z + (dz / dist) * step;
    if (!isFree(nx, nz, obstacles, stairs, NPC_MARGIN)) {
      s.target = null;
      s.wait = 0.5;
      return;
    }
    s.pos.set(nx, 0, nz);
    s.yaw = Math.atan2(dx, dz);
    g.position.set(nx, Math.abs(Math.sin(t * 6)) * 0.025, nz);
    g.rotation.y = s.yaw;

    const swing = Math.sin(t * 6) * 0.45;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.65;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.65;
  });

  return (
    <group
      ref={group}
      position={[start.x, 0, start.z]}
      onClick={(e) => {
        e.stopPropagation();
        setTalkIndex((prev) =>
          prev === null ? 0 : (prev + 1) % lines.length,
        );
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <NpcFigure
        look={{ shirt, pants, skin, hair, hairStyle }}
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
          <div className="relative w-max max-w-[200px] rounded-2xl border border-slate-200 bg-white/95 px-3 py-1.5 text-center shadow-lg select-none">
            <p className="text-[10px] font-bold text-blue-600">{name}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-800 leading-snug">
              {lines[talkIndex]}
            </p>
            <div className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />
          </div>
        </Html>
      )}
    </group>
  );
}

const NPC_LOOKS: Record<
  BuildingKey,
  {
    name: string;
    lines: string[];
    shirt: string;
    pants: string;
    skin: string;
    hair: string;
  }[]
> = {
  "warung-madura": [
    {
      name: "Pak Hasan",
      lines: ["Selamat datang di Warung Madura!", "Jajanan, galon, dan gas lengkap 24 jam."],
      shirt: "#f59e0b",
      pants: "#334155",
      skin: "#c68642",
      hair: "#111827",
    },
    {
      name: "Mbak Sari",
      lines: ["Lagi cari camilan buat nemenin kerja nih.", "Minuman dinginnya di kulkas belakang!"],
      shirt: "#e5e7eb",
      pants: "#1f2937",
      skin: "#8d5524",
      hair: "#0f172a",
    },
  ],
  indomart: [
    {
      name: "Kasir Indomaret",
      lines: ["Selamat datang di Indomaret!", "Ada promo minuman dingin hari ini kak."],
      shirt: "#dc2626",
      pants: "#1e3a8a",
      skin: "#e0ac69",
      hair: "#1f2937",
    },
    {
      name: "Rizky",
      lines: ["Rak mie instannya rapi banget ya.", "Mau sekalian beli kopi botol?"],
      shirt: "#16a34a",
      pants: "#334155",
      skin: "#c68642",
      hair: "#111827",
    },
    {
      name: "Tania",
      lines: ["Belanja kebutuhan harian cepat di sini.", "Kasirnya ramah banget!"],
      shirt: "#f8fafc",
      pants: "#1e293b",
      skin: "#8d5524",
      hair: "#0f172a",
    },
  ],
  "enuma-hq": [
    {
      name: "Bagas (Engineer)",
      lines: ["Halo! Lagi cek sistem Virtual Office nih.", "Ruang meeting-nya ada di sebelah sana."],
      shirt: "#2563eb",
      pants: "#0f172a",
      skin: "#e0ac69",
      hair: "#1f2937",
    },
    {
      name: "Nisa (Product)",
      lines: ["Semangat kerjanya hari ini!", "Jangan lupa istirahat kalau sudah sore."],
      shirt: "#64748b",
      pants: "#1e293b",
      skin: "#c68642",
      hair: "#111827",
    },
    {
      name: "Fajar (IoT)",
      lines: ["Selamat datang di Enuma Technology HQ!", "Tim kami sedang uji coba sensor baru."],
      shirt: "#f1f5f9",
      pants: "#334155",
      skin: "#8d5524",
      hair: "#0f172a",
    },
  ],
  "lunara-cafe": [
    {
      name: "Barista Lunara",
      lines: ["Selamat datang di Lunara Cafe!", "Mau pesan kopi susu gula aren atau matcha?"],
      shirt: "#f472b6",
      pants: "#1e293b",
      skin: "#e0ac69",
      hair: "#7c2d12",
    },
    {
      name: "Kiki",
      lines: ["Lantai duanya asyik banget buat WFC.", "Naik aja lewat tangga di sisi kiri!"],
      shirt: "#a78bfa",
      pants: "#334155",
      skin: "#c68642",
      hair: "#111827",
    },
    {
      name: "Beni",
      lines: ["Pastry di sini baru keluar dari oven lho.", "Cocok banget diminum bareng latte hangat."],
      shirt: "#fef3c7",
      pants: "#0f172a",
      skin: "#8d5524",
      hair: "#1f2937",
    },
  ],
};

export function Npcs({ config }: { config: InteriorConfig }) {
  const looks = NPC_LOOKS[config.buildingKey];

  // Hitung titik spawn yang berjarak aman dari pintu masuk & antar-NPC
  const spawns = useMemo(() => {
    const taken: THREE.Vector3[] = [
      new THREE.Vector3(config.spawn[0], 0, config.spawn[2]),
    ];
    return looks.map(() => {
      const pt = pickFreePoint(
        config.bounds,
        config.obstacles,
        config.stairs,
        new THREE.Vector3(0, 0, 0),
        taken,
        1.7,
      );
      taken.push(pt);
      return pt;
    });
  }, [config, looks]);

  return (
    <group>
      {looks.map((l, i) => (
        <Npc
          key={`${config.buildingKey}-${i}`}
          name={l.name}
          lines={l.lines}
          start={spawns[i]}
          bounds={config.bounds}
          obstacles={config.obstacles}
          stairs={config.stairs}
          shirt={l.shirt}
          pants={l.pants}
          skin={l.skin}
          hair={l.hair}
          hairStyle={(i % 3) as 0 | 1 | 2}
          speed={0.5 + (i % 3) * 0.1}
        />
      ))}
    </group>
  );
}

/* ---------- Suara ambient (dibuat dari Web Audio, tanpa file audio) ---------- */

const SOUND_PROFILE: Record<BuildingKey, { cutoff: number; volume: number; blips: boolean }> = {
  "warung-madura": { cutoff: 450, volume: 0.035, blips: true },
  "indomart": { cutoff: 600, volume: 0.03, blips: true },
  "enuma-hq": { cutoff: 300, volume: 0.02, blips: false },
  "lunara-cafe": { cutoff: 700, volume: 0.04, blips: true },
};

export function AmbientSound({ config }: { config: InteriorConfig }) {
  useEffect(() => {
    const profile = SOUND_PROFILE[config.buildingKey];
    const handle: { ctx: AudioContext | null } = { ctx: null };
    let timer: number | undefined;
    let started = false;
    const sources: AudioNode[] = [];

    const start = () => {
      if (started) return;
      started = true;
      const c = new AudioContext();
      handle.ctx = c;

      // Noise coklat yang dilembutkan, jadi terdengar seperti dengung ruangan
      const len = c.sampleRate * 2;
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        data[i] = last * 3.5;
      }
      const src = c.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = profile.cutoff;
      const gain = c.createGain();
      gain.gain.value = profile.volume;
      src.connect(lp).connect(gain).connect(c.destination);
      src.start();
      sources.push(src, lp, gain);

      if (profile.blips) {
        // Bunyi kecil acak (gelas, obrolan singkat), dibuat dari nada sinus yang meluruh
        const blip = () => {
          const now = c.currentTime;
          const o = c.createOscillator();
          const g = c.createGain();
          o.type = "sine";
          o.frequency.value = 900 + Math.random() * 1500;
          g.gain.setValueAtTime(0.0001, now);
          g.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
          o.connect(g).connect(c.destination);
          o.start(now);
          o.stop(now + 0.4);
        };
        const schedule = () => {
          blip();
          timer = window.setTimeout(schedule, 3000 + Math.random() * 6000);
        };
        timer = window.setTimeout(schedule, 2000);
      }
    };

    // Browser hanya mengizinkan audio setelah interaksi pengguna
    const events = ["pointerdown", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, start, { once: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, start));
      if (timer) window.clearTimeout(timer);
      sources.forEach((n) => {
        try {
          (n as AudioScheduledSourceNode).stop?.();
        } catch {
          /* sudah berhenti */
        }
        n.disconnect();
      });
      void handle.ctx?.close();
    };
  }, [config.buildingKey]);

  return null;
}

/** Gabungan semua elemen hidup di dalam ruangan */
export function Living({ config }: { config: InteriorConfig }) {
  return (
    <group>
      <Dust bounds={config.bounds} />
      <Npcs config={config} />
      <AmbientSound config={config} />
    </group>
  );
}
