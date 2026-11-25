import { LowPolyTree, ParkBench } from "@/components/CityProps";
import { ClockTower } from "@/components/city/decor/ClockTower";
import { LedBillboard } from "@/components/city/decor/LedBillboard";
import { Fireflies } from "@/components/city/decor/effects";
import { EastPlaza } from "@/components/city/decor/EastPlaza";
import { CityInfrastructure } from "@/components/city/decor/CityInfrastructure";
import { CityAmbientLife } from "@/components/city/decor/CityAmbientLife";
import {
  BollardLight,
  BusStop,
  CafeTable,
  CitySignpost,
  CrossingSignal,
  FLOWER_COLORS,
  Fountain,
  PlanterBox,
  StreetProps,
} from "@/components/city/decor/street-furniture";

/** Dekorasi taman, trotoar, dan fasilitas kota */
export function CityDecorations({ isNight = false }: { isNight?: boolean }) {
  return (
    <group>
      {/* ============ JALUR SETAPAK PENGHUBUNG (ZEBRA CROSS -> TAMAN & STASIUN) ============ */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.017, 34]}
        receiveShadow
      >
        <planeGeometry args={[3.2, 16.5]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-5.8, 0.017, 32.5]}
        receiveShadow
      >
        <planeGeometry args={[10.5, 2.4]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
      </mesh>

      {/* ============ TAMAN KOTA SELATAN (z: 27 s.d. 38, aman dari jalan z<=25.5) ============ */}
      {/* Paving bundar taman */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-16, 0.018, 32.5]}
        receiveShadow
      >
        <circleGeometry args={[5.4, 32]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-16, 0.02, 32.5]}>
        <ringGeometry args={[5.15, 5.4, 32]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>

      {/* Lampu taman pendek di sisi jalur setapak */}
      {[28, 33, 38].map((z) => (
        <group key={`bol-${z}`}>
          <BollardLight position={[-1.9, 0, z]} isNight={isNight} />
          <BollardLight position={[1.9, 0, z]} isNight={isNight} />
        </group>
      ))}

      {/* Air mancur pusat taman */}
      <Fountain position={[-16, 0, 32.5]} isNight={isNight} />

      {/* 4 bangku mengelilingi air mancur */}
      <ParkBench position={[-16, 0, 28.4]} rotation={[0, 0, 0]} />
      <ParkBench position={[-16, 0, 36.6]} rotation={[0, Math.PI, 0]} />
      <ParkBench position={[-20.1, 0, 32.5]} rotation={[0, Math.PI / 2, 0]} />
      <ParkBench position={[-11.9, 0, 32.5]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Pohon rindang di sekitar taman */}
      <LowPolyTree position={[-25, 0, 29]} scale={2.1} />
      <LowPolyTree position={[-26, 0, 36]} scale={1.9} />
      <LowPolyTree position={[-6, 0, 29]} scale={2.0} />
      <LowPolyTree position={[-6, 0, 36]} scale={1.8} />

      {/* Menara jam taman kota */}
      <ClockTower position={[-32, 0, 32.5]} isNight={isNight} />

      {/* Kunang-kunang khusus malam hari di taman */}
      {isNight && <Fireflies center={[-16, 0, 32.5]} />}

      {/* Area kafe outdoor berpayung */}
      <CafeTable position={[35.5, 0, 12.2]} umbrellaColor="#ef4444" />
      <CafeTable position={[-8.2, 0, 34.5]} umbrellaColor="#0284c7" />

      {/* Lampu penyeberangan & papan petunjuk arah */}
      <CrossingSignal position={[-2.8, 0, 17.8]} rotationY={0} />
      <CrossingSignal position={[2.8, 0, 26.2]} rotationY={Math.PI} />
      <CitySignpost position={[3.6, 0, 13.5]} />
      <LedBillboard position={[20.5, 0, 15.8]} rotationY={0} />

      {/* Pot bunga di tepi taman */}
      {[-22, -19, -13, -10].map((x, i) => (
        <PlanterBox
          key={`park-fl-${x}`}
          position={[x, 0, 26.6]}
          flowerColor={FLOWER_COLORS[i % FLOWER_COLORS.length]}
        />
      ))}

      {/* ============ TROTOAR & HALTE JALAN SELATAN ============ */}
      <BusStop position={[-22, 0, 17.2]} rotationY={0} isNight={isNight} />
      <BusStop position={[16, 0, 17.2]} rotationY={0} isNight={isNight} />

      {/* Pot bunga sepanjang trotoar selatan (menghindari zebra cross x=-2..2 & halte) */}
      {[-34, -12, -6, 6, 26, 34].map((x, i) => (
        <PlanterBox
          key={`south-fl-${x}`}
          position={[x, 0, 17.3]}
          flowerColor={FLOWER_COLORS[(i + 1) % FLOWER_COLORS.length]}
        />
      ))}

      {/* Tempat sampah & hidran di trotoar */}
      <StreetProps position={[-15, 0, 13.6]} />
      <StreetProps position={[8, 0, 13.6]} />
      <StreetProps position={[31, 0, 13.6]} />

      {/* ============ TROTOAR JALAN UTARA ============ */}
      {[-34, -18, -6, 10, 22, 34].map((x, i) => (
        <PlanterBox
          key={`north-fl-${x}`}
          position={[x, 0, -25.3]}
          flowerColor={FLOWER_COLORS[(i + 2) % FLOWER_COLORS.length]}
        />
      ))}

      {/* ============ PLAZA TIMUR, INFRASTRUKTUR, CAKRAWALA & BURUNG ============ */}
      <EastPlaza isNight={isNight} />
      <CityInfrastructure isNight={isNight} />
      <CityAmbientLife isNight={isNight} />
    </group>
  );
}
