import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

interface BillboardSlide {
  badge: string;
  title: string;
  sub: string;
  info: string;
  bgTop: string;
  bgBottom: string;
  accent: string;
}

const BILLBOARD_SLIDES: BillboardSlide[] = [
  {
    badge: "LIVE SERVER",
    title: "ENUMA TECHNOLOGY",
    sub: "Virtual Office & Smart 3D City",
    info: "Masuk ke Gedung Kantor untuk ruang kerja & kolaborasi tim",
    bgTop: "#0f172a",
    bgBottom: "#1e3a8a",
    accent: "#38bdf8",
  },
  {
    badge: "TRANSIT GRATIS",
    title: "STASIUN ENUMA",
    sub: "Trem Keliling Kota Setiap Saat",
    info: "Naik ke peron stasiun lalu tekan E saat trem berhenti",
    bgTop: "#064e3b",
    bgBottom: "#0f172a",
    accent: "#4ade80",
  },
  {
    badge: "HANGOUT & KOPI",
    title: "LUNARA CAFE",
    sub: "Kopi Susu, Pastry & Lantai 2",
    info: "Area santai lengkap dengan tangga ke lantai atas & meja outdoor",
    bgTop: "#451a03",
    bgBottom: "#1c1917",
    accent: "#fbbf24",
  },
  {
    badge: "AREA REKREASI",
    title: "TAMAN & PLAZA TIMUR",
    sub: "Lapangan Basket · Food Truck · Hologram",
    info: "Jelajahi air mancur, menara jam, dan proyektor hologram kota",
    bgTop: "#1e1b4b",
    bgBottom: "#0f172a",
    accent: "#a78bfa",
  },
  {
    badge: "PANDUAN KOTA",
    title: "KONTROL JELAJAH",
    sub: "WASD Gerak · C Mode Kamera",
    info: "Scroll untuk zoom halus ke FPP · Tekan E untuk duduk atau naik trem",
    bgTop: "#0f172a",
    bgBottom: "#164e63",
    accent: "#22d3ee",
  },
];

function drawSlideTexture(s: BillboardSlide, idx: number, total: number) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d");
  if (g) {
    // Latar gradasi
    const grad = g.createLinearGradient(0, 0, 1024, 512);
    grad.addColorStop(0, s.bgTop);
    grad.addColorStop(1, s.bgBottom);
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 512);

    // Pola grid halus
    g.strokeStyle = "rgba(255,255,255,0.05)";
    g.lineWidth = 1;
    for (let x = 0; x <= 1024; x += 48) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 512);
      g.stroke();
    }
    for (let y = 0; y <= 512; y += 48) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(1024, y);
      g.stroke();
    }

    // Lingkaran cahaya aksen di kanan
    const glow = g.createRadialGradient(860, 140, 20, 860, 140, 260);
    glow.addColorStop(0, `${s.accent}44`);
    glow.addColorStop(1, "transparent");
    g.fillStyle = glow;
    g.fillRect(540, 0, 484, 420);

    // Garis aksen atas & bawah
    g.fillStyle = s.accent;
    g.fillRect(0, 0, 1024, 10);
    g.fillRect(0, 502, 1024, 10);

    // Badge kategori di kiri atas
    g.fillStyle = `${s.accent}28`;
    g.beginPath();
    g.roundRect(64, 48, 250, 44, 22);
    g.fill();
    g.strokeStyle = s.accent;
    g.lineWidth = 2;
    g.stroke();

    g.fillStyle = s.accent;
    g.font = "bold 20px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(s.badge, 189, 71);

    // Indikator titik slide di kanan atas
    for (let i = 0; i < total; i++) {
      const cx = 860 + i * 26;
      g.beginPath();
      g.arc(cx, 70, i === idx ? 8 : 5, 0, Math.PI * 2);
      g.fillStyle = i === idx ? s.accent : "rgba(255,255,255,0.28)";
      g.fill();
    }

    // Judul & subjudul utama
    g.textAlign = "left";
    g.fillStyle = "#ffffff";
    g.font = "900 68px sans-serif";
    g.fillText(s.title, 64, 190);

    g.fillStyle = s.accent;
    g.font = "bold 34px sans-serif";
    g.fillText(s.sub, 64, 255);

    // Kotak info di bagian bawah
    g.fillStyle = "rgba(255,255,255,0.08)";
    g.beginPath();
    g.roundRect(64, 330, 896, 106, 18);
    g.fill();

    // Garis aksen vertikal di kiri kotak info
    g.fillStyle = s.accent;
    g.fillRect(64, 344, 8, 78);

    g.fillStyle = "#e2e8f0";
    g.font = "600 26px sans-serif";
    g.fillText(s.info, 96, 384);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Billboard LED modern dua sisi dengan informasi kota dinamis */
export function LedBillboard({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % BILLBOARD_SLIDES.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  const textures = useMemo(
    () =>
      BILLBOARD_SLIDES.map((s, i) =>
        drawSlideTexture(s, i, BILLBOARD_SLIDES.length),
      ),
    [],
  );

  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  const current = BILLBOARD_SLIDES[slideIdx];
  const tex = textures[slideIdx];

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Alas beton & cincin dasar */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.55, 0.24, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.26, 0.3, 0.06, 16]} />
        <meshStandardMaterial
          color={current.accent}
          emissive={current.accent}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Tiang utama baja */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 2.8, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Rangka utama billboard */}
      <group position={[0, 3.8, 0]}>
        <mesh castShadow>
          <boxGeometry args={[4.6, 2.4, 0.3]} />
          <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.5} />
        </mesh>
        {/* List aksen menyala di atas & bawah rangka */}
        <mesh position={[0, 1.22, 0]}>
          <boxGeometry args={[4.64, 0.06, 0.34]} />
          <meshStandardMaterial
            color={current.accent}
            emissive={current.accent}
            emissiveIntensity={0.8}
          />
        </mesh>
        <mesh position={[0, -1.22, 0]}>
          <boxGeometry args={[4.64, 0.06, 0.34]} />
          <meshStandardMaterial
            color={current.accent}
            emissive={current.accent}
            emissiveIntensity={0.8}
          />
        </mesh>

        {/* Catwalk servis kecil di bawah */}
        <mesh position={[0, -1.32, 0.35]}>
          <boxGeometry args={[4.2, 0.05, 0.45]} />
          <meshStandardMaterial color="#334155" metalness={0.5} />
        </mesh>

        {/* 2 lampu sorot atas */}
        {[-1.3, 1.3].map((lx) => (
          <group key={lx} position={[lx, 1.32, 0.28]}>
            <mesh rotation={[0.45, 0, 0]}>
              <boxGeometry args={[0.32, 0.08, 0.2]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, -0.04, 0.06]}>
              <boxGeometry args={[0.24, 0.03, 0.1]} />
              <meshStandardMaterial
                color="#fef9c3"
                emissive="#fef08a"
                emissiveIntensity={0.9}
              />
            </mesh>
          </group>
        ))}

        {/* Layar LED Depan (+Z) */}
        <mesh position={[0, 0, 0.16]}>
          <planeGeometry args={[4.3, 2.15]} />
          <meshStandardMaterial
            map={tex}
            emissive="#ffffff"
            emissiveMap={tex}
            emissiveIntensity={0.9}
            roughness={0.18}
          />
        </mesh>

        {/* Layar LED Belakang (-Z) */}
        <mesh position={[0, 0, -0.16]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[4.3, 2.15]} />
          <meshStandardMaterial
            map={tex}
            emissive="#ffffff"
            emissiveMap={tex}
            emissiveIntensity={0.9}
            roughness={0.18}
          />
        </mesh>
      </group>
    </group>
  );
}
