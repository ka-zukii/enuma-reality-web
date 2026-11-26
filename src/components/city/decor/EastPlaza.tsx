import { useMemo } from "react";
import { Text } from "@react-three/drei";

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
      {/* ============ MINI LAPANGAN BASKET (x: 30.5, z: 38) ============ */}
      <group position={[30.5, 0, 38]}>
        {/* Border luar lapangan */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]} receiveShadow>
          <planeGeometry args={[12.8, 8.4]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
        {/* Alas lapangan utama */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]} receiveShadow>
          <planeGeometry args={[12, 7.6]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.85} />
        </mesh>

        {/* Cat lingkaran tengah + ring putih */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
          <circleGeometry args={[1.15, 28]} />
          <meshStandardMaterial color="#ea580c" roughness={0.85} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]}>
          <ringGeometry args={[1.12, 1.2, 32]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>

        {/* Garis keliling & garis tengah putih */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 3.65]}>
          <planeGeometry args={[11.68, 0.08]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, -3.65]}>
          <planeGeometry args={[11.68, 0.08]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {[-5.8, 0, 5.8].map((lx) => (
          <mesh key={`vline-${lx}`} rotation={[-Math.PI / 2, 0, 0]} position={[lx, 0.022, 0]}>
            <planeGeometry args={[0.08, 7.38]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))}

        {/* Area Key (Paint), garis free-throw & busur 3-poin di kedua sisi */}
        {[-1, 1].map((side) => {
          const arcRot = side === -1 ? -Math.PI / 2 : Math.PI / 2;
          return (
            <group key={`court-side-${side}`}>
              {/* Paint oranye */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[side * 4.5, 0.02, 0]} receiveShadow>
                <planeGeometry args={[2.6, 2.5]} />
                <meshStandardMaterial color="#ea580c" roughness={0.85} />
              </mesh>
              {/* Garis kotak key */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[side * 3.2, 0.022, 0]}>
                <planeGeometry args={[0.07, 2.56]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              {[-1.25, 1.25].map((kz) => (
                <mesh key={kz} rotation={[-Math.PI / 2, 0, 0]} position={[side * 4.5, 0.022, kz]}>
                  <planeGeometry args={[2.6, 0.07]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
              ))}
              {/* Lingkaran free-throw */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[side * 3.2, 0.022, 0]}>
                <ringGeometry args={[0.85, 0.92, 28]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              {/* Busur 3-poin */}
              <mesh
                rotation={[-Math.PI / 2, 0, arcRot]}
                position={[side * 5.1, 0.022, 0]}
              >
                <ringGeometry args={[2.95, 3.03, 32, 1, 0, Math.PI]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
            </group>
          );
        })}

        {/* Dua tiang, padding, papan pantul kaca berbingkai, ring & jaring */}
        {[-5.6, 5.6].map((hx, idx) => {
          const dir = idx === 0 ? 1 : -1;
          return (
            <group key={hx} position={[hx, 0, 0]}>
              {/* Pelat dasar baut */}
              <mesh position={[0, 0.03, 0]} receiveShadow>
                <boxGeometry args={[0.4, 0.06, 0.4]} />
                <meshStandardMaterial color="#1e293b" metalness={0.6} />
              </mesh>
              {/* Bantalan busa tiang (padding) */}
              <mesh position={[0, 0.85, 0]} castShadow>
                <cylinderGeometry args={[0.13, 0.14, 1.5, 10]} />
                <meshStandardMaterial color="#1e40af" roughness={0.7} />
              </mesh>
              {/* Tiang utama & lengan atas */}
              <mesh position={[0, 1.75, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.1, 3.5, 10]} />
                <meshStandardMaterial color="#334155" metalness={0.5} />
              </mesh>
              <mesh position={[dir * 0.45, 3.3, 0]} castShadow>
                <boxGeometry args={[0.92, 0.09, 0.09]} />
                <meshStandardMaterial color="#334155" metalness={0.4} />
              </mesh>
              {/* Papan pantul akrilik + bingkai putih + kotak target */}
              <mesh position={[dir * 0.88, 3.32, 0]}>
                <boxGeometry args={[0.05, 0.92, 1.38]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.68} roughness={0.1} />
              </mesh>
              {/* Bingkai atas/bawah/samping papan pantul */}
              {[0.46, -0.46].map((by) => (
                <mesh key={by} position={[dir * 0.88, 3.32 + by, 0]}>
                  <boxGeometry args={[0.07, 0.04, 1.42]} />
                  <meshStandardMaterial color="#f8fafc" />
                </mesh>
              ))}
              {[-0.69, 0.69].map((bz) => (
                <mesh key={bz} position={[dir * 0.88, 3.32, bz]}>
                  <boxGeometry args={[0.07, 0.96, 0.04]} />
                  <meshStandardMaterial color="#f8fafc" />
                </mesh>
              ))}
              {/* Kotak target oranye di belakang ring */}
              <mesh position={[dir * 0.91, 3.24, 0]}>
                <boxGeometry args={[0.02, 0.36, 0.48]} />
                <meshStandardMaterial color="#f97316" />
              </mesh>
              <mesh position={[dir * 0.915, 3.24, 0]}>
                <boxGeometry args={[0.02, 0.28, 0.4]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.8} />
              </mesh>
              {/* Ring oranye + penyangga */}
              <mesh position={[dir * 0.98, 3.05, 0]}>
                <boxGeometry args={[0.16, 0.04, 0.1]} />
                <meshStandardMaterial color="#ea580c" />
              </mesh>
              <mesh position={[dir * 1.18, 3.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.23, 0.028, 8, 18]} />
                <meshStandardMaterial color="#f97316" metalness={0.3} />
              </mesh>
              {/* Jaring ring basket */}
              <mesh position={[dir * 1.18, 2.86, 0]}>
                <cylinderGeometry args={[0.21, 0.12, 0.36, 12, 1, true]} />
                <meshStandardMaterial color="#f8fafc" transparent opacity={0.7} wireframe />
              </mesh>
            </group>
          );
        })}

        {/* Pagar pembatas rendah di belakang kedua ring */}
        {[-6.25, 6.25].map((fx) => (
          <group key={`fence-${fx}`} position={[fx, 0, 0]}>
            {[-2.8, 0, 2.8].map((fz) => (
              <mesh key={fz} position={[0, 0.65, fz]} castShadow>
                <cylinderGeometry args={[0.035, 0.04, 1.3, 8]} />
                <meshStandardMaterial color="#334155" />
              </mesh>
            ))}
            <mesh position={[0, 1.25, 0]}>
              <boxGeometry args={[0.05, 0.05, 5.7]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            <mesh position={[0, 0.68, 0]}>
              <boxGeometry args={[0.02, 1.05, 5.6]} />
              <meshStandardMaterial color="#94a3b8" transparent opacity={0.35} wireframe />
            </mesh>
          </group>
        ))}

        {/* Bangku pemain & papan skor mini di sisi utara */}
        <group position={[0, 0, -4.25]}>
          {[-2.2, 2.2].map((bx) => (
            <group key={bx} position={[bx, 0, 0]}>
              <mesh position={[0, 0.42, 0]} castShadow>
                <boxGeometry args={[1.8, 0.07, 0.42]} />
                <meshStandardMaterial color="#ea580c" roughness={0.6} />
              </mesh>
              {[-0.7, 0.7].map((lx) => (
                <mesh key={lx} position={[lx, 0.21, 0]} castShadow>
                  <boxGeometry args={[0.06, 0.42, 0.36]} />
                  <meshStandardMaterial color="#1e293b" />
                </mesh>
              ))}
            </group>
          ))}
          {/* Papan skor mini */}
          <mesh position={[0, 1.0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 2.0, 8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 1.95, 0.05]} castShadow>
            <boxGeometry args={[1.25, 0.65, 0.1]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <Text position={[0, 2.04, 0.11]} fontSize={0.11} color="#94a3b8" anchorX="center" anchorY="middle">
            HOME  :  AWAY
          </Text>
          <Text position={[0, 1.84, 0.11]} fontSize={0.22} color="#f97316" anchorX="center" anchorY="middle">
            12  -  10
          </Text>
        </group>

        {/* Bola basket di lapangan & dekat bangku */}
        {[
          [0.35, 0.14, 0.2],
          [-2.6, 0.14, -3.7],
        ].map(([bx, by, bz], i) => (
          <group key={i} position={[bx, by, bz]}>
            <mesh castShadow>
              <sphereGeometry args={[0.14, 14, 12]} />
              <meshStandardMaterial color="#ea580c" roughness={0.65} />
            </mesh>
            <mesh rotation={[0, Math.PI / 4, 0]}>
              <torusGeometry args={[0.14, 0.006, 6, 18]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.14, 0.006, 6, 18]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          </group>
        ))}

        {/* Lampu sorot lapangan saat malam */}
        {[-5.8, 5.8].map((lx) => (
          <group key={`court-lamp-${lx}`} position={[lx, 0, -4.2]}>
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

      {/* ============ FOOD TRUCK & AREA MAKAN OUTDOOR (x: 19, z: 38) ============ */}
      <group position={[19, 0, 38]}>
        {/* Paving area food truck */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.017, 0]} receiveShadow>
          <planeGeometry args={[8.5, 7]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.85} />
        </mesh>

        {/* Bodi Food Truck */}
        <group position={[0, 0, -1.6]}>
          {/* Sasis & bumper depan/belakang */}
          <mesh position={[0.15, 0.34, 0]} castShadow>
            <boxGeometry args={[4.45, 0.14, 1.75]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
          <mesh position={[2.4, 0.36, 0]} castShadow>
            <boxGeometry args={[0.14, 0.2, 1.88]} />
            <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[-2.14, 0.36, 0]} castShadow>
            <boxGeometry args={[0.12, 0.2, 1.92]} />
            <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
          </mesh>

          {/* Roda + velg */}
          {[
            [-1.3, 0.35, 0.94],
            [1.35, 0.35, 0.94],
            [-1.3, 0.35, -0.94],
            [1.35, 0.35, -0.94],
          ].map((pos, idx) => (
            <group key={idx} position={pos as [number, number, number]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.35, 0.35, 0.22, 16]} />
                <meshStandardMaterial color="#0f172a" roughness={0.8} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.19, 0.19, 0.24, 12]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 0.25, 10]} />
                <meshStandardMaterial color="#334155" metalness={0.6} />
              </mesh>
            </group>
          ))}

          {/* Box utama + aksen strip bawah */}
          <mesh position={[-0.35, 1.38, 0]} castShadow>
            <boxGeometry args={[3.5, 1.92, 1.9]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.55} />
          </mesh>
          <mesh position={[-0.35, 0.62, 0]}>
            <boxGeometry args={[3.52, 0.38, 1.92]} />
            <meshStandardMaterial color="#0284c7" roughness={0.45} />
          </mesh>
          {/* List atap & cerobong exhaust dapur */}
          <mesh position={[-0.35, 2.38, 0]} castShadow>
            <boxGeometry args={[3.58, 0.1, 1.96]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.5} />
          </mesh>
          <mesh position={[-1.1, 2.55, -0.25]} castShadow>
            <boxGeometry args={[0.65, 0.24, 0.65]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0.4, 2.52, -0.35]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 0.28, 10]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.35} />
          </mesh>

          {/* Kabin depan */}
          <mesh position={[1.85, 1.08, 0]} castShadow>
            <boxGeometry args={[1.0, 1.32, 1.84]} />
            <meshStandardMaterial color="#0284c7" roughness={0.45} />
          </mesh>
          {/* Kaca depan & kaca pintu samping */}
          <mesh position={[2.36, 1.3, 0]}>
            <boxGeometry args={[0.04, 0.62, 1.52]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.78} roughness={0.1} />
          </mesh>
          {[-0.93, 0.93].map((sz) => (
            <mesh key={sz} position={[1.82, 1.3, sz]}>
              <boxGeometry args={[0.62, 0.52, 0.03]} />
              <meshStandardMaterial color="#38bdf8" transparent opacity={0.75} roughness={0.1} />
            </mesh>
          ))}
          {/* Spion kiri & kanan */}
          {[-1.02, 1.02].map((mz) => (
            <mesh key={mz} position={[2.22, 1.25, mz]} castShadow>
              <boxGeometry args={[0.08, 0.18, 0.12]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          ))}
          {/* Grille & lampu depan */}
          <mesh position={[2.36, 0.72, 0]}>
            <boxGeometry args={[0.04, 0.24, 0.92]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {[-0.68, 0.68].map((lz) => (
            <mesh key={lz} position={[2.36, 0.72, lz]}>
              <boxGeometry args={[0.05, 0.14, 0.22]} />
              <meshStandardMaterial
                color="#fef9c3"
                emissive={isNight ? "#fef08a" : "#fde047"}
                emissiveIntensity={isNight ? 1.4 : 0.2}
              />
            </mesh>
          ))}
          {/* Lampu rem belakang */}
          {[-0.72, 0.72].map((lz) => (
            <mesh key={lz} position={[-2.11, 0.66, lz]}>
              <boxGeometry args={[0.04, 0.14, 0.22]} />
              <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={isNight ? 0.9 : 0.2} />
            </mesh>
          ))}

          {/* Jendela sajian terbuka (interior gelap + bingkai + meja counter) */}
          <mesh position={[-0.35, 1.46, 0.955]}>
            <boxGeometry args={[2.35, 0.86, 0.04]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
          {/* Meja counter saji menjorok keluar */}
          <mesh position={[-0.35, 1.02, 1.09]} castShadow>
            <boxGeometry args={[2.5, 0.07, 0.34]} />
            <meshStandardMaterial color="#d97706" roughness={0.65} />
          </mesh>
          {/* Perlengkapan di atas counter: toples, botol saus, cup minuman, kasir */}
          <mesh position={[-1.2, 1.17, 1.08]} castShadow>
            <cylinderGeometry args={[0.09, 0.1, 0.22, 10]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[-0.75, 1.15, 1.12]}>
            <cylinderGeometry args={[0.035, 0.04, 0.18, 8]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <mesh position={[-0.63, 1.15, 1.12]}>
            <cylinderGeometry args={[0.035, 0.04, 0.18, 8]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
          {[-0.15, -0.02, 0.11].map((cx) => (
            <mesh key={cx} position={[cx, 1.12, 1.1]}>
              <cylinderGeometry args={[0.04, 0.03, 0.13, 8]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
          <mesh position={[0.55, 1.13, 1.06]} castShadow>
            <boxGeometry args={[0.26, 0.16, 0.2]} />
            <meshStandardMaterial color="#334155" />
          </mesh>

          {/* Kanopi bergaris merah-putih */}
          <group position={[-0.35, 2.02, 1.24]} rotation={[0.32, 0, 0]}>
            {Array.from({ length: 9 }, (_, i) => {
              const x = (i - 4) * 0.29;
              return (
                <mesh key={i} position={[x, 0, 0]} castShadow>
                  <boxGeometry args={[0.29, 0.05, 0.72]} />
                  <meshStandardMaterial color={i % 2 === 0 ? "#ef4444" : "#f8fafc"} roughness={0.6} />
                </mesh>
              );
            })}
          </group>

          {/* Papan menu menyala + tulisan */}
          <group position={[-0.35, 2.66, 0.96]}>
            <mesh castShadow>
              <boxGeometry args={[2.1, 0.5, 0.08]} />
              <meshStandardMaterial
                color="#0f172a"
                emissive={isNight ? "#78350f" : "#000000"}
                emissiveIntensity={isNight ? 0.35 : 0}
              />
            </mesh>
            <Text position={[0, 0.09, 0.05]} fontSize={0.14} color="#fbbf24" anchorX="center" anchorY="middle">
              ENUMA STREET FOOD
            </Text>
            <Text position={[0, -0.1, 0.05]} fontSize={0.09} color="#f8fafc" anchorX="center" anchorY="middle">
              Kopi • Burger • Snack • Es Teh
            </Text>
          </group>

          {/* Papan menu A-frame di samping gerobak */}
          <group position={[-2.65, 0, 0.8]} rotation={[0, 0.35, 0]}>
            <mesh position={[0, 0.48, 0.1]} rotation={[-0.18, 0, 0]} castShadow>
              <boxGeometry args={[0.55, 0.92, 0.04]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.48, -0.1]} rotation={[0.18, 0, 0]} castShadow>
              <boxGeometry args={[0.55, 0.92, 0.04]} />
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </mesh>
            <Text
              position={[0, 0.56, 0.13]}
              rotation={[-0.18, 0, 0]}
              fontSize={0.08}
              color="#fde047"
              anchorX="center"
              anchorY="middle"
            >
              OPEN!
            </Text>
          </group>
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

        {/* Meja piknik kayu + bangku panjang + gelas */}
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
            {[-0.55, 0.55].map((bz) => (
              <mesh key={bz} position={[0, 0.36, bz]} castShadow>
                <boxGeometry args={[1.3, 0.06, 0.24]} />
                <meshStandardMaterial color="#b45309" roughness={0.8} />
              </mesh>
            ))}
            <mesh position={[-0.25, 0.71, 0.1]}>
              <cylinderGeometry args={[0.04, 0.032, 0.1, 8]} />
              <meshStandardMaterial color="#38bdf8" />
            </mesh>
            <mesh position={[0.2, 0.69, -0.08]}>
              <cylinderGeometry args={[0.14, 0.12, 0.03, 12]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
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
