import { useMemo } from "react";

/** Lapangan basket mini + food truck + lampu gantung + vending machine di sisi timur kota */
export function EastPlaza({ isNight = false }: { isNight?: boolean }) {
  const stringBulbs = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const t = i / 6 - 0.5;
        return {
          x: t * 5.2,
          y: 2.95 - Math.cos(t * Math.PI) * 0.28,
        };
      }),
    [],
  );

  return (
    <group>
      {/* ============ MINI LAPANGAN BASKET (x: 23, z: 33.5) ============ */}
      <group position={[23, 0, 33.5]}>
        {/* Alas lapangan */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]} receiveShadow>
          <planeGeometry args={[12, 7.6]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.85} />
        </mesh>
        {/* Area key / cat tengah */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
          <circleGeometry args={[1.25, 24]} />
          <meshStandardMaterial color="#ea580c" roughness={0.85} />
        </mesh>
        {/* Garis keliling putih */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, 3.65]}>
          <planeGeometry args={[11.6, 0.08]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, -3.65]}>
          <planeGeometry args={[11.6, 0.08]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, 0]}>
          <planeGeometry args={[0.08, 7.3]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>

        {/* Dua tiang & ring basket */}
        {[-5.6, 5.6].map((hx, idx) => {
          const dir = idx === 0 ? 1 : -1;
          return (
            <group key={hx} position={[hx, 0, 0]}>
              <mesh position={[0, 1.7, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.1, 3.4, 8]} />
                <meshStandardMaterial color="#334155" metalness={0.5} />
              </mesh>
              <mesh position={[dir * 0.45, 3.25, 0]} castShadow>
                <boxGeometry args={[0.9, 0.08, 0.08]} />
                <meshStandardMaterial color="#334155" />
              </mesh>
              {/* Papan pantul */}
              <mesh position={[dir * 0.88, 3.3, 0]}>
                <boxGeometry args={[0.06, 0.9, 1.35]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.75} />
              </mesh>
              {/* Ring oranye */}
              <mesh position={[dir * 1.15, 3.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.24, 0.03, 8, 16]} />
                <meshStandardMaterial color="#f97316" />
              </mesh>
            </group>
          );
        })}

        {/* Lampu sorot lapangan saat malam */}
        {[-5.8, 5.8].map((lx) => (
          <group key={`court-lamp-${lx}`} position={[lx, 0, -4.1]}>
            <mesh position={[0, 2.4, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, 4.8, 8]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, 4.8, 0.2]} rotation={[0.4, 0, 0]}>
              <boxGeometry args={[0.5, 0.18, 0.25]} />
              <meshStandardMaterial
                color={isNight ? "#fef9c3" : "#cbd5e1"}
                emissive={isNight ? "#fef08a" : "#000000"}
                emissiveIntensity={isNight ? 1.1 : 0}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* ============ FOOD TRUCK & AREA MAKAN OUTDOOR (x: 11.5, z: 31) ============ */}
      <group position={[11.5, 0, 31]}>
        {/* Paving area food truck */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.017, 0]} receiveShadow>
          <planeGeometry args={[8.5, 7]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.85} />
        </mesh>

        {/* Bodi Food Truck */}
        <group position={[0, 0, -1.6]}>
          {/* Roda */}
          {[
            [-1.3, 0.35, 0.95],
            [1.3, 0.35, 0.95],
            [-1.3, 0.35, -0.95],
            [1.3, 0.35, -0.95],
          ].map((pos, idx) => (
            <mesh
              key={idx}
              position={pos as [number, number, number]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.35, 0.35, 0.22, 12]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          ))}
          {/* Kabin & box utama */}
          <mesh position={[-0.35, 1.35, 0]} castShadow>
            <boxGeometry args={[3.5, 1.9, 1.9]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.6} />
          </mesh>
          <mesh position={[1.85, 1.05, 0]} castShadow>
            <boxGeometry args={[1.0, 1.3, 1.84]} />
            <meshStandardMaterial color="#0284c7" roughness={0.5} />
          </mesh>
          {/* Kaca depan */}
          <mesh position={[2.36, 1.25, 0]}>
            <boxGeometry args={[0.04, 0.65, 1.5]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.75} />
          </mesh>
          {/* Kanopi jendela sajian */}
          <mesh position={[-0.35, 2.05, 1.2]} rotation={[0.35, 0, 0]} castShadow>
            <boxGeometry args={[2.6, 0.06, 0.7]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          {/* Papan menu menyala */}
          <mesh position={[-0.35, 2.55, 0.96]}>
            <boxGeometry args={[1.8, 0.45, 0.08]} />
            <meshStandardMaterial
              color="#1e293b"
              emissive={isNight ? "#f59e0b" : "#000000"}
              emissiveIntensity={isNight ? 0.5 : 0}
            />
          </mesh>
        </group>

        {/* Lampu gantung (string lights) */}
        <group position={[0, 0, 1.2]}>
          {[-2.8, 2.8].map((px) => (
            <mesh key={px} position={[px, 1.5, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.06, 3.0, 8]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
          ))}
          {stringBulbs.map((b, i) => (
            <mesh key={i} position={[b.x, b.y, 0]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial
                color={isNight ? "#fef08a" : "#ffffff"}
                emissive={isNight ? "#fbbf24" : "#000000"}
                emissiveIntensity={isNight ? 1.2 : 0}
              />
            </mesh>
          ))}
        </group>

        {/* Meja piknik kayu */}
        {[-1.8, 1.8].map((tx) => (
          <group key={tx} position={[tx, 0, 1.6]}>
            <mesh position={[0, 0.62, 0]} castShadow>
              <boxGeometry args={[1.4, 0.08, 0.7]} />
              <meshStandardMaterial color="#b45309" roughness={0.8} />
            </mesh>
            {[-0.5, 0.5].map((lx) => (
              <mesh key={lx} position={[lx, 0.31, 0]} castShadow>
                <boxGeometry args={[0.08, 0.62, 0.6]} />
                <meshStandardMaterial color="#78350f" />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* ============ VENDING MACHINE & PHOTO BOOTH DEKAT STASIUN (x: 6.5, z: 42.5) ============ */}
      <group position={[6.5, 0, 42.5]}>
        {/* Vending Machine 1 */}
        <group position={[-0.75, 0, 0]}>
          <mesh position={[0, 0.95, 0]} castShadow>
            <boxGeometry args={[0.95, 1.9, 0.7]} />
            <meshStandardMaterial color="#2563eb" roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.1, 0.36]}>
            <planeGeometry args={[0.68, 0.95]} />
            <meshStandardMaterial
              color="#e0f2fe"
              emissive="#38bdf8"
              emissiveIntensity={isNight ? 0.8 : 0.35}
            />
          </mesh>
        </group>
        {/* Vending Machine 2 */}
        <group position={[0.45, 0, 0]}>
          <mesh position={[0, 0.95, 0]} castShadow>
            <boxGeometry args={[0.95, 1.9, 0.7]} />
            <meshStandardMaterial color="#dc2626" roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.1, 0.36]}>
            <planeGeometry args={[0.68, 0.95]} />
            <meshStandardMaterial
              color="#fef2f2"
              emissive="#f87171"
              emissiveIntensity={isNight ? 0.7 : 0.3}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
