import type { BuildingInfo } from "@/config/buildings";
import {
  ModernBuilding,
  LowPolyTree,
  LowPolyCar,
  StreetLamp,
  ParkBench,
} from "@/components/CityProps";
import { CityLife, Sway } from "@/components/city/CityLife";
import { RailTrack } from "@/components/railway/RailTrack";
import { TrainStation } from "@/components/railway/TrainStation";
import { Tram } from "./railway/Tram";

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
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.06, 0]}
        receiveShadow
      >
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#86efac" roughness={0.9} />
      </mesh>

      {/* Blok Utama Trotoar Paving Kota */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[84, 84]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>

      {/* ========================================================
          JARINGAN JALAN RAYA KELILING KOTA (RING ROAD)
          ======================================================== */}
      {/* 1. Jalan Depan / Selatan (Horizontal: X: -38 s.d. 38, Z: 14) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 14]}
        receiveShadow
      >
        <planeGeometry args={[76, 7]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* 2. Jalan Belakang / Utara (Horizontal: X: -38 s.d. 38, Z: -22) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, -22]}
        receiveShadow
      >
        <planeGeometry args={[76, 7]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* 3. Jalan Samping Barat / Kiri (Vertikal: Z: -22 s.d. 14, X: -34.5) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-34.5, 0.02, -4]}
        receiveShadow
      >
        <planeGeometry args={[7, 43]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* 4. Jalan Samping Timur / Kanan (Vertikal: Z: -22 s.d. 14, X: 34.5) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[34.5, 0.02, -4]}
        receiveShadow
      >
        <planeGeometry args={[7, 43]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* Marka Jalan Putih Putus-putus Jalan Selatan */}
      {[-28, -20, -12, -4, 4, 12, 20, 28].map((x) => (
        <mesh
          key={`s-${x}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.025, 14]}
        >
          <planeGeometry args={[4, 0.3]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Marka Jalan Putih Putus-putus Jalan Utara */}
      {[-28, -20, -12, -4, 4, 12, 20, 28].map((x) => (
        <mesh
          key={`n-${x}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.025, -22]}
        >
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
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[20, 0.022, 23]}
        receiveShadow
      >
        <planeGeometry args={[26, 7.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      {[10, 14, 18, 22, 26, 30].map((x) => (
        <mesh
          key={`park-${x}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.026, 23]}
        >
          <planeGeometry args={[0.2, 6.5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Jalur Paving Pejalan Kaki / Promenade Tengah */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[6, 0.025, -4]}
        receiveShadow
      >
        <planeGeometry args={[4.8, 28]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>

      {/* ========================================================
          BARISAN BANGUNAN PERKANTORAN MODERN (RESCALED 1:1 HUMAN)
          ======================================================== */}

      {/* ========================================================
          EMPAT GEDUNG UTAMA (BARIS DEPAN, z = -4)
          ======================================================== */}

      {/* 1. Warung Madura (paling kiri) */}
      <ModernBuilding
        position={[-25, 0, -4]}
        size={[9, 6.5, 9]}
        color="#fef3c7"
        roofColor="#7c2d12"
        accentColor="#f97316"
        name="Warung Madura"
        signText="WARUNG MADURA"
        subtitle="Jajanan & Minuman"
        tag="WARUNG"
        variant="shop"
        badgeIcon="shop"
        onClick={() =>
          onBuildingSelect({
            buildingKey: "warung-madura",
            name: "Warung Madura",
            category: "Warung & Makanan Cepat",
            desc: "Warung kecil dengan jajanan, minuman dingin, dan makanan siap saji untuk rekan kerja yang sedang lapar.",
            status: "Buka · Jajanan & Minuman",
          })
        }
      />

      {/* 2. Indomart */}
      <ModernBuilding
        position={[-14, 0, -4]}
        size={[9, 6.5, 10]}
        color="#ffffff"
        roofColor="#1e3a8a"
        accentColor="#dc2626"
        name="Indomart"
        signText="INDOMART"
        subtitle="Minimarket & Kebutuhan Harian"
        tag="MINIMARKET"
        variant="shop"
        badgeIcon="shop"
        onClick={() =>
          onBuildingSelect({
            buildingKey: "indomart",
            name: "Indomart",
            category: "Minimarket",
            desc: "Minimarket untuk kebutuhan harian, minuman dingin, dan camilan selama bekerja.",
            status: "Buka · Kebutuhan Harian",
          })
        }
      />

      {/* 3. Kantor Enuma Technology (tengah, paling tinggi) */}
      <ModernBuilding
        position={[-1, 0, -4]}
        size={[13, 12, 11]}
        color="#ffffff"
        roofColor="#0f172a"
        accentColor="#2563eb"
        name="Kantor Enuma Technology"
        subtitle="Pusat Kantor Virtual"
        tag="ENUMA TECHNOLOGY"
        variant="office"
        badgeIcon="office"
        badgePosition={[0, 14.5, 0]}
        onClick={() =>
          onBuildingSelect({
            buildingKey: "enuma-hq",
            name: "Kantor Enuma Technology",
            category: "Pusat Virtual Workspace",
            desc: "Gedung pusat virtual office 3 lantai lengkap dengan ruang kerja kolaboratif, auditorium meeting 3D, dan private booth.",
            status: "Aktif · Server Utama",
          })
        }
      />

      {/* 4. Lunara Cafe (paling kanan) */}
      <ModernBuilding
        position={[14, 0, -4]}
        size={[10, 8, 10]}
        color="#fdf2f8"
        roofColor="#831843"
        accentColor="#f472b6"
        name="Lunara Cafe"
        signText="LUNARA"
        subtitle="Kopi & Pastry"
        tag="CAFE"
        variant="cafe"
        badgeIcon="cafe"
        onClick={() =>
          onBuildingSelect({
            buildingKey: "lunara-cafe",
            name: "Lunara Cafe",
            category: "Cafe & Kopi",
            desc: "Kafe hangat untuk ngopi, makan ringan, dan mengobrol santai bersama rekan kerja.",
            status: "Buka · Menu Kopi & Pastry",
          })
        }
      />

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
      {/* Pepohonan di Sepanjang Jalur Pejalan Kaki & Taman (bergoyang pelan) */}
      <Sway position={[3.5, 0, -12]} phase={0}>
        <LowPolyTree position={[0, 0, 0]} scale={1.8} />
      </Sway>
      <Sway position={[7, 0, -13]} phase={1.7}>
        <LowPolyTree position={[0, 0, 0]} scale={2.1} />
      </Sway>
      <Sway position={[3.5, 0, -1]} phase={3.1}>
        <LowPolyTree position={[0, 0, 0]} scale={1.7} />
      </Sway>
      <Sway position={[8.5, 0, 5]} phase={4.4}>
        <LowPolyTree position={[0, 0, 0]} scale={2.0} />
      </Sway>

      {/* Pohon di Sudut-sudut Kota */}
      <Sway position={[-28, 0, -14]} phase={0.8}>
        <LowPolyTree position={[0, 0, 0]} scale={2.2} />
      </Sway>
      <Sway position={[-28, 0, 6]} phase={2.4}>
        <LowPolyTree position={[0, 0, 0]} scale={2.0} />
      </Sway>
      <Sway position={[30, 0, -12]} phase={3.9}>
        <LowPolyTree position={[0, 0, 0]} scale={2.3} />
      </Sway>
      <Sway position={[30, 0, 6]} phase={5.2}>
        <LowPolyTree position={[0, 0, 0]} scale={2.1} />
      </Sway>

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
          KENDARAAN / MOBIL PARKIR
          (mobil yang melaju di jalan dikelola CityLife)
          ======================================================== */}
      {/* Mobil Putih & Biru Terparkir di Area Parkir */}
      <LowPolyCar position={[14, 0, 23]} rotation={[0, 0, 0]} color="#f8fafc" />
      <LowPolyCar position={[22, 0, 23]} rotation={[0, 0, 0]} color="#2563eb" />
      <LowPolyCar position={[28, 0, 23]} rotation={[0, 0, 0]} color="#0f172a" />

      {/* ========================================================
          LAMPU JALAN KELILING KOTA
          ======================================================== */}
      <StreetLamp position={[-18, 0, 10]} />
      <StreetLamp position={[-2, 0, 10]} />
      <StreetLamp position={[14, 0, 10]} />
      <StreetLamp position={[-18, 0, -18]} />
      <StreetLamp position={[-2, 0, -18]} />
      <StreetLamp position={[14, 0, -18]} />

      {/* ========================================================
          KEHIDUPAN KOTA: pejalan kaki, lalu lintas, burung, awan, cahaya
          ======================================================== */}
      <CityLife />
      <RailTrack />
      <TrainStation position={[0, 0, 36.6]} />
      <Tram />
    </group>
  );
}
