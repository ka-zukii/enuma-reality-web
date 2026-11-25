import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

const BILLBOARD_SLIDES = [
  {
    title: "ENUMA CITY",
    sub: "Virtual Office · Live",
    bg: "#0f172a",
    accent: "#38bdf8",
  },
  {
    title: "LUNARA CAFE",
    sub: "Kopi Susu & Pastry",
    bg: "#3d150c",
    accent: "#f59e0b",
  },
  {
    title: "STASIUN ENUMA",
    sub: "Naik Trem Gratis!",
    bg: "#1e3a8a",
    accent: "#4ade80",
  },
];

/** Billboard LED animasi berganti slide tiap 4 detik */
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
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  const textures = useMemo(
    () =>
      BILLBOARD_SLIDES.map((s) => {
        const c = document.createElement("canvas");
        c.width = 512;
        c.height = 256;
        const g = c.getContext("2d");
        if (g) {
          g.fillStyle = s.bg;
          g.fillRect(0, 0, 512, 256);
          g.fillStyle = s.accent;
          g.fillRect(0, 0, 512, 16);
          g.fillRect(0, 240, 512, 16);
          g.fillStyle = "#ffffff";
          g.font = "bold 52px sans-serif";
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(s.title, 256, 108);
          g.fillStyle = s.accent;
          g.font = "bold 28px sans-serif";
          g.fillText(s.sub, 256, 168);
        }
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      }),
    [],
  );

  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  const tex = textures[slideIdx];

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Tiang penyangga */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 3.0, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Rangka layar */}
      <mesh position={[0, 3.5, 0]}>
        <boxGeometry args={[3.9, 2.0, 0.22]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Layar LED */}
      <mesh position={[0, 3.5, 0.12]}>
        <planeGeometry args={[3.65, 1.75]} />
        <meshStandardMaterial
          map={tex}
          emissive="#ffffff"
          emissiveMap={tex}
          emissiveIntensity={0.85}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}
