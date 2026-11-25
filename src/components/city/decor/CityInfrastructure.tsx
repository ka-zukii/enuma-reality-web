import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Rak parkir sepeda dengan beberapa sepeda terparkir */
function BikeParking({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Alas beton tipis */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]} receiveShadow>
        <planeGeometry args={[3.2, 1.6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      {/* 3 lengkungan besi rak */}
      {[-1.0, 0, 1.0].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.35, -0.35]} castShadow>
            <boxGeometry args={[0.06, 0.7, 0.06]} />
            <meshStandardMaterial color="#334155" metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.35, 0.35]} castShadow>
            <boxGeometry args={[0.06, 0.7, 0.06]} />
            <meshStandardMaterial color="#334155" metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[0.06, 0.06, 0.76]} />
            <meshStandardMaterial color="#334155" metalness={0.5} />
          </mesh>
        </group>
      ))}
      {/* 2 sepeda sederhana */}
      {[-0.5, 0.5].map((bx, i) => (
        <group key={bx} position={[bx, 0, 0.05]}>
          <mesh position={[0, 0.28, -0.32]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.26, 0.035, 6, 12]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 0.28, 0.32]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.26, 0.035, 6, 12]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[0.05, 0.06, 0.65]} />
            <meshStandardMaterial color={i === 0 ? "#2563eb" : "#ef4444"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const HOLO_BUILDINGS: { x: number; z: number; w: number; d: number; h: number }[] = [
  { x: 0, z: 0, w: 0.26, d: 0.26, h: 0.72 },
  { x: -0.34, z: -0.1, w: 0.2, d: 0.2, h: 0.45 },
  { x: 0.34, z: -0.08, w: 0.22, d: 0.18, h: 0.54 },
  { x: -0.18, z: 0.32, w: 0.18, d: 0.22, h: 0.38 },
  { x: 0.24, z: 0.3, w: 0.2, d: 0.18, h: 0.48 },
  { x: -0.52, z: 0.22, w: 0.16, d: 0.16, h: 0.3 },
  { x: 0.52, z: 0.18, w: 0.16, d: 0.16, h: 0.34 },
  { x: -0.1, z: -0.38, w: 0.22, d: 0.16, h: 0.42 },
  { x: 0.22, z: -0.36, w: 0.16, d: 0.18, h: 0.32 },
];

/** Monumen proyektor hologram kota mini 3D yang berputar & memiliki scan ring */
function CityHologram({
  position,
  isNight,
}: {
  position: [number, number, number];
  isNight: boolean;
}) {
  const holoRef = useRef<THREE.Group>(null);
  const scanRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    if (holoRef.current) {
      holoRef.current.rotation.y += delta * 0.4;
      holoRef.current.position.y = 0.92 + Math.sin(t * 1.6) * 0.035;
    }
    if (scanRef.current) {
      scanRef.current.position.y = ((t * 0.45) % 0.78) + 0.04;
    }
  });

  const glow = isNight ? 1.15 : 0.65;

  return (
    <group position={position}>
      {/* Alas proyektor bertingkat */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.45, 1.6, 0.3, 24]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[1.0, 1.15, 0.24, 24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* Lensa proyektor menyala di atas alas */}
      <mesh position={[0, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.85, 24]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={glow}
        />
      </mesh>
      {/* Kerucut cahaya proyeksi */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[1.05, 0.65, 0.9, 24, 1, true]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={isNight ? 0.12 : 0.07}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Hologram kota mini mengambang */}
      <group ref={holoRef} position={[0, 0.92, 0]}>
        {/* Piringan dasar & cincin jalur rel mini */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.92, 24]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#38bdf8"
            emissiveIntensity={glow * 0.5}
            transparent
            opacity={0.22}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.78, 0.84, 32]} />
          <meshStandardMaterial
            color="#7dd3fc"
            emissive="#38bdf8"
            emissiveIntensity={glow}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Miniatur gedung-gedung kota */}
        {HOLO_BUILDINGS.map((b, i) => (
          <mesh key={i} position={[b.x, b.h / 2, b.z]}>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              color="#7dd3fc"
              emissive="#0284c7"
              emissiveIntensity={glow}
              transparent
              opacity={0.68}
              roughness={0.2}
            />
          </mesh>
        ))}

        {/* Cincin pemindai (scan ring) naik turun */}
        <mesh ref={scanRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
          <ringGeometry args={[0.84, 0.92, 32]} />
          <meshBasicMaterial
            color="#e0f2fe"
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

/** Siluet gedung bertingkat di kejauhan luar rel sebagai cakrawala kota */
function BackgroundSkyline({ isNight }: { isNight: boolean }) {
  const towers = useMemo(() => {
    const list: { x: number; z: number; w: number; d: number; h: number; color: string }[] = [];
    const colors = ["#94a3b8", "#64748b", "#475569", "#cbd5e1"];
    // Sisi utara (z = -68)
    for (let i = -5; i <= 5; i++) {
      const seed = Math.abs(Math.sin(i * 19.3) * 43758.5) % 1;
      list.push({
        x: i * 14 + (seed - 0.5) * 3,
        z: -68 - seed * 8,
        w: 8 + seed * 4,
        d: 8 + seed * 4,
        h: 16 + seed * 24,
        color: colors[Math.abs(i) % colors.length],
      });
    }
    // Sisi barat & timur (x = ±72)
    for (let i = -3; i <= 3; i++) {
      const seed = Math.abs(Math.cos(i * 23.7) * 19283.1) % 1;
      list.push({
        x: -72 - seed * 8,
        z: i * 16,
        w: 8 + seed * 4,
        d: 8 + seed * 4,
        h: 14 + seed * 22,
        color: colors[(Math.abs(i) + 1) % colors.length],
      });
      list.push({
        x: 72 + seed * 8,
        z: i * 16,
        w: 8 + seed * 4,
        d: 8 + seed * 4,
        h: 14 + seed * 22,
        color: colors[(Math.abs(i) + 2) % colors.length],
      });
    }
    return list;
  }, []);

  return (
    <group>
      {towers.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.h / 2, 0]}>
            <boxGeometry args={[t.w, t.h, t.d]} />
            <meshStandardMaterial color={t.color} roughness={0.85} />
          </mesh>
          {/* Aksen atap / jendela malam */}
          {isNight && (
            <mesh position={[0, t.h - 1.2, 0]}>
              <boxGeometry args={[t.w + 0.1, 0.5, t.d + 0.1]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#38bdf8"
                emissiveIntensity={0.75}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export function CityInfrastructure({ isNight = false }: { isNight?: boolean }) {
  return (
    <group>
      {/* Kanopi jalur pejalan kaki menuju stasiun */}
      <group position={[0, 0, 40.5]}>
        {[-1.55, 1.55].map((px) => (
          <group key={px}>
            <mesh position={[px, 1.5, -2.2]} castShadow>
              <cylinderGeometry args={[0.05, 0.06, 3.0, 8]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[px, 1.5, 2.2]} castShadow>
              <cylinderGeometry args={[0.05, 0.06, 3.0, 8]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 3.05, 0]} castShadow>
          <boxGeometry args={[3.5, 0.1, 5.4]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.42} />
        </mesh>
      </group>

      {/* Parkiran sepeda di depan Indomart & Kantor Enuma */}
      <BikeParking position={[-19.5, 0, 13.5]} />
      <BikeParking position={[14.5, 0, 13.5]} />

      {/* Hologram kota mini 3D di area terbuka antara jalur tengah dan plaza timur */}
      <CityHologram position={[4.6, 0, 31.0]} isNight={isNight} />

      {/* Gedung cakrawala latar belakang */}
      <BackgroundSkyline isNight={isNight} />
    </group>
  );
}
