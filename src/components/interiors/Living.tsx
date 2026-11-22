import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Box, BuildingKey, InteriorConfig, StairsConfig } from "@/config/buildings";

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
) {
  for (let i = 0; i < 40; i++) {
    const x = THREE.MathUtils.lerp(bounds.minX + 0.8, bounds.maxX - 0.8, Math.random());
    const z = THREE.MathUtils.lerp(bounds.minZ + 0.8, bounds.maxZ - 0.8, Math.random());
    if (isFree(x, z, obstacles, stairs, NPC_MARGIN)) return new THREE.Vector3(x, 0, z);
  }
  return fallback.clone();
}

function PersonFigure({ shirt, pants, skin, hair }: { shirt: string; pants: string; skin: string; hair: string }) {
  return (
    <group>
      <mesh position={[-0.1, 0.4, 0]} castShadow>
        <boxGeometry args={[0.13, 0.8, 0.14]} />
        <meshStandardMaterial color={pants} roughness={0.8} />
      </mesh>
      <mesh position={[0.1, 0.4, 0]} castShadow>
        <boxGeometry args={[0.13, 0.8, 0.14]} />
        <meshStandardMaterial color={pants} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.12, 0]} castShadow>
        <boxGeometry args={[0.38, 0.6, 0.22]} />
        <meshStandardMaterial color={shirt} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.56, 0]} castShadow>
        <sphereGeometry args={[0.16, 14, 12]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.6, -0.02]}>
        <sphereGeometry args={[0.168, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hair} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Npc({
  bounds,
  obstacles,
  stairs,
  shirt,
  pants,
  skin,
  hair,
  speed = 0.6,
}: {
  bounds: InteriorConfig["bounds"];
  obstacles: Box[];
  stairs?: StairsConfig;
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
  speed?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const start = useMemo(
    () => pickFreePoint(bounds, obstacles, stairs, new THREE.Vector3(0, 0, 0)),
    [bounds, obstacles, stairs],
  );
  const st = useRef({
    pos: start.clone(),
    target: null as THREE.Vector3 | null,
    wait: Math.random() * 3,
    yaw: Math.random() * Math.PI * 2,
  });

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const s = st.current;
    const t = state.clock.elapsedTime;

    if (s.wait > 0) {
      // Diam: berdiri sebentar, sedikit bergoyang
      s.wait -= delta;
      g.position.set(s.pos.x, Math.sin(t * 1.5) * 0.005, s.pos.z);
      g.rotation.y = s.yaw;
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
      // Jalan terhalang: cari tujuan lain
      s.target = null;
      s.wait = 0.5;
      return;
    }
    s.pos.set(nx, 0, nz);
    s.yaw = Math.atan2(dx, dz);
    g.position.set(nx, Math.abs(Math.sin(t * 6)) * 0.03, nz);
    g.rotation.y = s.yaw;
  });

  return (
    <group ref={group} position={[start.x, 0, start.z]}>
      <PersonFigure shirt={shirt} pants={pants} skin={skin} hair={hair} />
    </group>
  );
}

const NPC_LOOKS: Record<BuildingKey, { shirt: string; pants: string; skin: string; hair: string }[]> = {
  "warung-madura": [
    { shirt: "#f59e0b", pants: "#334155", skin: "#c68642", hair: "#111827" },
    { shirt: "#e5e7eb", pants: "#1f2937", skin: "#8d5524", hair: "#0f172a" },
  ],
  indomart: [
    { shirt: "#dc2626", pants: "#1e3a8a", skin: "#e0ac69", hair: "#1f2937" },
    { shirt: "#16a34a", pants: "#334155", skin: "#c68642", hair: "#111827" },
    { shirt: "#f8fafc", pants: "#1e293b", skin: "#8d5524", hair: "#0f172a" },
  ],
  "enuma-hq": [
    { shirt: "#2563eb", pants: "#0f172a", skin: "#e0ac69", hair: "#1f2937" },
    { shirt: "#64748b", pants: "#1e293b", skin: "#c68642", hair: "#111827" },
    { shirt: "#f1f5f9", pants: "#334155", skin: "#8d5524", hair: "#0f172a" },
  ],
  "lunara-cafe": [
    { shirt: "#f472b6", pants: "#1e293b", skin: "#e0ac69", hair: "#7c2d12" },
    { shirt: "#a78bfa", pants: "#334155", skin: "#c68642", hair: "#111827" },
    { shirt: "#fef3c7", pants: "#0f172a", skin: "#8d5524", hair: "#1f2937" },
  ],
};

export function Npcs({ config }: { config: InteriorConfig }) {
  const looks = NPC_LOOKS[config.buildingKey];
  return (
    <group>
      {looks.map((l, i) => (
        <Npc
          key={`${config.buildingKey}-${i}`}
          bounds={config.bounds}
          obstacles={config.obstacles}
          stairs={config.stairs}
          shirt={l.shirt}
          pants={l.pants}
          skin={l.skin}
          hair={l.hair}
          speed={0.5 + (i % 3) * 0.1}
        />
      ))}
    </group>
  );
}

/* ---------- Suara ambient (dibuat dari Web Audio, tanpa file audio) ---------- */

const SOUND_PROFILE: Record<BuildingKey, { cutoff: number; volume: number; blips: boolean }> = {
  "warung-madura": { cutoff: 450, volume: 0.035, blips: true },
  indomart: { cutoff: 600, volume: 0.03, blips: true },
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
