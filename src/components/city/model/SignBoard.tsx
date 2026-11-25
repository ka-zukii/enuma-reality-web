import { useEffect, useMemo } from "react";
import * as THREE from "three";

export const LABEL_STYLE: Record<
  string,
  { subtitle: string; icon: "shop" | "cafe" | "office" }
> = {
  "warung-madura": { subtitle: "Jajanan & Minuman", icon: "shop" },
  indomart: { subtitle: "Minimarket & Kebutuhan Harian", icon: "shop" },
  "enuma-hq": { subtitle: "Pusat Kantor Virtual", icon: "office" },
  "lunara-cafe": { subtitle: "Kopi & Pastry", icon: "cafe" },
};

/** Membuat tekstur papan nama gedung berbasis Canvas */
function makeSignTexture(
  title: string,
  subtitle: string,
  bg: string,
  fg: string,
  accent: string,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  if (g) {
    g.fillStyle = bg;
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = accent;
    g.fillRect(0, 0, 512, 12);
    g.fillRect(0, 116, 512, 12);
    g.fillStyle = fg;
    g.font = "bold 46px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(title, 256, 54);
    g.font = "600 20px sans-serif";
    g.globalAlpha = 0.85;
    g.fillText(subtitle, 256, 92);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function SignBoard({
  title,
  subtitle,
  bg,
  fg,
  accent,
  position,
  size = [4.2, 0.9],
  isNight = false,
}: {
  title: string;
  subtitle: string;
  bg: string;
  fg: string;
  accent: string;
  position: [number, number, number];
  size?: [number, number];
  isNight?: boolean;
}) {
  const tex = useMemo(
    () => makeSignTexture(title, subtitle, bg, fg, accent),
    [title, subtitle, bg, fg, accent],
  );
  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[size[0] + 0.14, size[1] + 0.14, 0.14]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={size} />
        <meshStandardMaterial
          map={tex}
          emissive="#ffffff"
          emissiveMap={tex}
          emissiveIntensity={isNight ? 0.85 : 0.2}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}
