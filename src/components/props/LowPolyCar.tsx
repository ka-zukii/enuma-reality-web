import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ============================================================
 * MOBIL
 * Bodi diekstrusi dari profil samping, kaca kabin, empat roda dengan velg,
 * lampu depan dan belakang.
 * Arah depan mobil: -Z. Jika mobil bergerak ke +X, rotasi y = -π/2.
 * ============================================================ */
function makeCarBody(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const pts: [number, number][] = [
    [-2.1, 0.32],
    [-2.1, 0.72],
    [-1.85, 0.86],
    [-0.9, 0.92],
    [-0.5, 1.36],
    [0.7, 1.36],
    [1.15, 0.95],
    [2.0, 0.9],
    [2.1, 0.75],
    [2.1, 0.32],
  ];
  shape.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.7,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 3,
    curveSegments: 1,
  });
  // Panjang mobil ke Z (depan di -Z), lebar ke X, lalu dipusatkan
  geo.rotateY(-Math.PI / 2);
  geo.translate(0.85, 0, 0);
  return geo;
}

function makeCarGlass(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.95, 0.92);
  shape.lineTo(-0.5, 1.3);
  shape.lineTo(0.65, 1.3);
  shape.lineTo(1.1, 0.96);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.9,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geo.rotateY(-Math.PI / 2);
  geo.translate(0.95, 0, 0);
  return geo;
}

function makeHeadlightTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  if (g) {
    // Gradien halus dari lampu mobil (bawah/y=128) memudar ke depan (atas/y=0)
    const grad = g.createLinearGradient(0, 128, 0, 0);
    grad.addColorStop(0, "rgba(254, 249, 195, 0.55)");
    grad.addColorStop(0.45, "rgba(254, 249, 195, 0.18)");
    grad.addColorStop(1, "rgba(254, 249, 195, 0)");
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(46, 128);
    g.lineTo(82, 128);
    g.lineTo(124, 0);
    g.lineTo(4, 0);
    g.closePath();
    g.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function LowPolyCar({
  position,
  rotation = [0, 0, 0],
  color = "#dc2626",
  isNight = false,
  spinning = false,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  isNight?: boolean;
  spinning?: boolean;
}) {
  const bodyGeo = useMemo(() => makeCarBody(), []);
  const glassGeo = useMemo(() => makeCarGlass(), []);
  const beamTex = useMemo(() => makeHeadlightTexture(), []);
  const wheelRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, delta) => {
    if (!spinning) return;
    for (const w of wheelRefs.current) {
      if (w) w.rotation.x -= delta * 10;
    }
  });

  useEffect(
    () => () => {
      bodyGeo.dispose();
      glassGeo.dispose();
      beamTex.dispose();
    },
    [bodyGeo, glassGeo, beamTex],
  );

  const wheels: [number, number][] = [
    [-0.86, -1.3],
    [0.86, -1.3],
    [-0.86, 1.3],
    [0.86, 1.3],
  ];

  return (
    <group position={position} rotation={rotation}>
      {/* Bodi */}
      <mesh geometry={bodyGeo} castShadow>
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.35} />
      </mesh>

      {/* Kaca kabin */}
      <mesh geometry={glassGeo}>
        <meshStandardMaterial
          color="#0b1220"
          roughness={0.08}
          metalness={0.3}
        />
      </mesh>

      {/* Roda dengan velg & baut tengah */}
      {wheels.map(([x, z], idx) => (
        <group
          key={`${x}-${z}`}
          ref={(el) => {
            wheelRefs.current[idx] = el;
          }}
          position={[x, 0.32, z]}
        >
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.24, 20]} />
            <meshStandardMaterial color="#111827" roughness={0.88} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.25, 16]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.26, 12]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Sunroof kaca di atap */}
      <mesh position={[0, 1.445, 0.1]}>
        <boxGeometry args={[1.15, 0.02, 0.72]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.4} />
      </mesh>

      {/* Bumper & gril depan (di -Z) */}
      <mesh position={[0, 0.45, -2.14]}>
        <boxGeometry args={[1.65, 0.16, 0.1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.62, -2.13]}>
        <boxGeometry args={[0.85, 0.16, 0.06]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.46, -2.195]}>
        <boxGeometry args={[0.42, 0.1, 0.02]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>

      {/* Lampu depan (di -Z) + sorot lembut di permukaan aspal saat malam */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={`head-${x}`} position={[x, 0.72, -2.12]}>
          <boxGeometry args={[0.45, 0.13, 0.06]} />
          <meshStandardMaterial
            color="#fef9c3"
            emissive="#fef9c3"
            emissiveIntensity={isNight ? 1.8 : 0.7}
          />
        </mesh>
      ))}
      {isNight && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, -4.3]}>
          <planeGeometry args={[2.6, 4.4]} />
          <meshBasicMaterial map={beamTex} transparent depthWrite={false} />
        </mesh>
      )}

      {/* Bumper belakang, plat & knalpot (di +Z) */}
      <mesh position={[0, 0.44, 2.14]}>
        <boxGeometry args={[1.65, 0.16, 0.1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.62, 2.14]}>
        <boxGeometry args={[0.42, 0.1, 0.02]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      {[-0.55, 0.55].map((x) => (
        <mesh
          key={`ex-${x}`}
          position={[x, 0.34, 2.18]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.045, 0.045, 0.08, 10]} />
          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Lampu belakang (di +Z) */}
      {[-0.7, 0.7].map((x) => (
        <mesh key={`tail-${x}`} position={[x, 0.72, 2.12]}>
          <boxGeometry args={[0.42, 0.13, 0.06]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={0.7}
          />
        </mesh>
      ))}

      {/* Spion */}
      {[-1.0, 1.0].map((x) => (
        <mesh key={`mirror-${x}`} position={[x, 1.0, -0.6]}>
          <boxGeometry args={[0.16, 0.12, 0.2]} />
          <meshStandardMaterial color={color} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
