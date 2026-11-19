import type { BuildingInfo } from "@/config/buildings";
import { ModernBuilding, LowPolyTree, LowPolyCar, StreetLamp, ParkBench } from "@/components/CityProps";

interface CityEnvironmentProps {
  onBuildingSelect: (building: BuildingInfo) => void;
}

export function CityEnvironment({ onBuildingSelect }: CityEnvironmentProps) {
  return (
    <group>
      {/* ========================================================
          LANTAI & GROUND DASAR KOTA BESAR (KELILING KOTA)
          ======================================================== */}
      {/* Padang Rumput Hijau Luas Luar Kota */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#86efac" roughness={0.9} />
      </mesh>

      {/* Blok Utama Trotoar Paving Kota */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[84, 84]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>

      {/* ========================================================
          JARINGAN JALAN RAYA KELILING KOTA (RING ROAD)
          ======================================================== */}
      {/* 1. Jalan Depan / Selatan (Horizontal: X: -38 s.d. 38, Z: 14) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 14]} receiveShadow>
        <planeGeometry args={[76, 7]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* 2. Jalan Belakang / Utara (Horizontal: X: -38 s.d. 38, Z: -22) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -22]} receiveShadow>
        <planeGeometry args={[76, 7]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* 3. Jalan Samping Barat / Kiri (Vertikal: Z: -22 s.d. 14, X: -34.5) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-34.5, 0.02, -4]} receiveShadow>
        <planeGeometry args={[7, 43]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* 4. Jalan Samping Timur / Kanan (Vertikal: Z: -22 s.d. 14, X: 34.5) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[34.5, 0.02, -4]} receiveShadow>
        <planeGeometry args={[7, 43]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* Marka Jalan Putih Putus-putus Jalan Selatan */}
      {[-28, -20, -12, -4, 4, 12, 20, 28].map((x) => (
        <mesh key={`s-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, 14]}>
          <planeGeometry args={[4, 0.3]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Marka Jalan Putih Putus-putus Jalan Utara */}
      {[-28, -20, -12, -4, 4, 12, 20, 28].map((x) => (
        <mesh key={`n-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, -22]}>
          <planeGeometry args={[4, 0.3]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Marka Jalan Putih Putus-putus Jalan Barat & Timur */}
      {[-16, -10, -4, 2, 8].map((z) => (
        <group key={`vert-${z}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-34.5, 0.025, z]}>
            <planeGeometry args={[0.3, 3.5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[34.5, 0.025, z]}>
            <planeGeometry args={[0.3, 3.5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Zebra Cross / Penyeberangan Pejalan Kaki */}
      {[-2, 0, 2].map((offset) => (
        <group key={`zebra-${offset}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[offset, 0.026, 14]}>
            <planeGeometry args={[0.8, 5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[offset, 0.026, -22]}>
            <planeGeometry args={[0.8, 5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Area Parkir Mobil Luas di Kanan Bawah */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[20, 0.022, 23]} receiveShadow>
        <planeGeometry args={[26, 7.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      {[10, 14, 18, 22, 26, 30].map((x) => (
        <mesh key={`park-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.026, 23]}>
          <planeGeometry args={[0.2, 6.5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Jalur Paving Pejalan Kaki / Promenade Tengah */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, 0.025, -4]} receiveShadow>
        <planeGeometry args={[4.8, 28]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>

      {/* ========================================================
          BARISAN BANGUNAN PERKANTORAN MODERN (RESCALED 1:1 HUMAN)
          ======================================================== */}

      {/* 1. Board Game & Mahjong Lounge (Sebelah Kiri) */}
      <ModernBuilding
        position={[-15, 0, -4]}
        size={[11, 8.5, 10]}
        color="#f8fafc"
        roofColor="#0284c7"
        name="Board Game & Mahjong Cafe"
        subtitle="Tempat Santai & Main Bareng"
        tag="DISEWAKAN"
        badgeIcon="game"
        onClick={() =>
          onBuildingSelect({
            buildingKey: "board-game-cafe",
            name: "Board Game & Mahjong Cafe",
            category: "Cafe & Entertainment",
            desc: "Area lounge hiburan santai untuk anggota kantor bermain catur, board game, mahjong, dan mengobrol santai.",
            status: "Tersedia untuk disewa / event komunitas",
          })
        }
      />

      {/* Dadu Raksasa Dekorasi Depan Board Game Cafe */}
      <group position={[-23, 0.7, 3]}>
        <mesh castShadow rotation={[0.2, 0.5, 0]}>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial color="#fef08a" roughness={0.3} />
        </mesh>
      </group>
      <group position={[-21, 0.6, 3.8]}>
        <mesh castShadow rotation={[0.1, -0.3, 0]}>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color="#bae6fd" roughness={0.3} />
        </mesh>
      </group>

      {/* 2. Gedung Kantor Pusat Enuma Reality (Tengah Utama: 3 Lantai ~12m Tinggi) */}
      <ModernBuilding
        position={[-1, 0, -4]}
        size={[13, 12, 11]}
        color="#ffffff"
        roofColor="#0f172a"
        name="Enuma Reality HQ"
        subtitle="Pusat Kantor Virtual"
        tag="ENUMA REALITY OFFICE"
        badgeIcon="office"
        badgePosition={[0, 14.5, 0]}
        onClick={() =>
          onBuildingSelect({
            buildingKey: "enuma-hq",
            name: "Enuma Reality Virtual Office",
            category: "Pusat Virtual Workspace",
            desc: "Gedung pusat virtual office 3 lantai lengkap dengan ruang kerja kolaboratif, auditorium meeting 3D, dan private booth.",
            status: "Aktif · Server Utama",
          })
        }
      />

      {/* 3. M Cafe & Rooftop Garden (Sebelah Kanan) */}
      <ModernBuilding
        position={[20, 0, -4]}
        size={[11, 9.5, 10]}
        color="#f8fafc"
        roofColor="#475569"
        name="M Cafe & Rooftop"
        subtitle="Coffee, Drinks & Terrace"
        tag="DISEWAKAN"
        badgeIcon="cafe"
        onClick={() =>
          onBuildingSelect({
            buildingKey: "m-cafe",
            name: "M Cafe & Terrace",
            category: "F&B & Cafe",
            desc: "Kafe modern dengan pemandangan terbuka, area rooftop untuk istirahat siang dan hangout santai rekan kerja.",
            status: "Buka · Menu Kopi & Pastry",
          })
        }
      />

      {/* Rooftop Cafe Details di Atas M Cafe (Payung, Meja, Kursi) */}
      <group position={[20, 9.8, -4]}>
        {/* Payung Kafe Pink */}
        <mesh position={[0, 2.2, 0]} castShadow>
          <coneGeometry args={[2.4, 1.1, 8]} />
          <meshStandardMaterial color="#f472b6" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 2.2, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* Meja Bundar */}
        <mesh position={[0, 0.75, 0]} castShadow>
          <cylinderGeometry args={[0.9, 0.9, 0.1, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Bangunan Pendukung di Bagian Belakang Seberang Jalan Utara */}
      {[-24, -10, 10, 24].map((x) => (
        <group key={`back-${x}`} position={[x, 0, -32]}>
          <mesh position={[0, 5, 0]} castShadow receiveShadow>
            <boxGeometry args={[10, 10, 9]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
          </mesh>
          <mesh position={[0, 10.2, 0]}>
            <boxGeometry args={[10.4, 0.4, 9.4]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>
      ))}

      {/* ========================================================
          AREA TAMAN KOTA, BANGKU & PEPOHONAN ASRI
          ======================================================== */}
      {/* Pepohonan di Sepanjang Jalur Pejalan Kaki & Taman */}
      <LowPolyTree position={[3.5, 0, -12]} scale={1.8} />
      <LowPolyTree position={[8.5, 0, -9]} scale={2.1} />
      <LowPolyTree position={[3.5, 0, -1]} scale={1.7} />
      <LowPolyTree position={[8.5, 0, 5]} scale={2.0} />

      {/* Pohon di Sudut-sudut Kota */}
      <LowPolyTree position={[-28, 0, -12]} scale={2.2} />
      <LowPolyTree position={[-28, 0, 6]} scale={2.0} />
      <LowPolyTree position={[30, 0, -12]} scale={2.3} />
      <LowPolyTree position={[30, 0, 6]} scale={2.1} />

      {/* Bangku Taman Menghadap Jalur Utama */}
      <ParkBench position={[6, 0, 8]} rotation={[0, Math.PI, 0]} />
      <ParkBench position={[6, 0, -16]} rotation={[0, 0, 0]} />
      <ParkBench position={[-8, 0, 8]} rotation={[0, Math.PI, 0]} />
      <ParkBench position={[14, 0, 8]} rotation={[0, Math.PI, 0]} />

      {/* Tanaman Semak Hias */}
      {[-9, -5, 12, 16].map((x) => (
        <mesh key={`bush-${x}`} position={[x, 0.45, 7.5]} castShadow>
          <sphereGeometry args={[0.65, 8, 8]} />
          <meshStandardMaterial color="#16a34a" roughness={0.8} />
        </mesh>
      ))}

      {/* ========================================================
          KENDARAAN / MOBIL PROPORSIONAL
          ======================================================== */}
      {/* Mobil Sedan Merah di Seberang Jalan Utara */}
      <LowPolyCar position={[16, 0, -22]} rotation={[0, 0, 0]} color="#ef4444" />

      {/* Mobil Putih & Biru Terparkir di Area Parkir */}
      <LowPolyCar position={[14, 0, 23]} rotation={[0, 0, 0]} color="#f8fafc" />
      <LowPolyCar position={[22, 0, 23]} rotation={[0, 0, 0]} color="#2563eb" />
      <LowPolyCar position={[28, 0, 23]} rotation={[0, 0, 0]} color="#0f172a" />

      {/* Mobil Hitam Melaju di Jalan Raya Selatan */}
      <LowPolyCar position={[-14, 0, 14]} rotation={[0, -Math.PI / 2, 0]} color="#1e293b" />

      {/* ========================================================
          LAMPU JALAN KELILING KOTA
          ======================================================== */}
      <StreetLamp position={[-18, 0, 10]} />
      <StreetLamp position={[-2, 0, 10]} />
      <StreetLamp position={[14, 0, 10]} />
      <StreetLamp position={[-18, 0, -18]} />
      <StreetLamp position={[-2, 0, -18]} />
      <StreetLamp position={[14, 0, -18]} />
    </group>
  );
}
