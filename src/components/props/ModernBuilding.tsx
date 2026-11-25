import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Html, RoundedBox } from "@react-three/drei";
import { Coffee, Gamepad2, Building2, Store } from "lucide-react";
import type { BuildingProps, FacadeStyle } from "@/components/props/types";
import { hash, hashString } from "@/components/props/utils";

/* ============================================================
 * TEKSTUR FASAD (dibuat dari canvas, tanpa file gambar)
 * Satu ubin mewakili sekitar 4 x 3.2 meter. Ubin diulang di seluruh permukaan.
 * ============================================================ */
function makeFacadeTexture(
  base: string,
  style: FacadeStyle,
  seed: number,
): THREE.CanvasTexture {
  const S = 256;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const g = canvas.getContext("2d");
  if (!g) return new THREE.CanvasTexture(canvas);

  // Warna dasar dan sedikit bintik agar permukaan tidak terlihat datar
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 320; i++) {
    const x = hash(seed * 7 + i) * S;
    const y = hash(seed * 11 + i + 500) * S;
    g.fillStyle =
      hash(i + seed) > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
    g.fillRect(x, y, 2, 2);
  }

  // Garis lantai (pemisah antar lantai)
  g.fillStyle = "rgba(15,23,42,0.22)";
  g.fillRect(0, S - 12, S, 12);

  const win = (x: number, y: number, w: number, h: number, i: number) => {
    const lit = hash(seed * 31 + i) > 0.8;

    // Bingkai aluminium
    g.fillStyle = "#e2e8f0";
    g.fillRect(x - 4, y - 4, w + 8, h + 8);

    // Kaca: biru saat siang, hangat jika lampu di dalam menyala
    const grad = g.createLinearGradient(0, y, 0, y + h);
    if (lit) {
      grad.addColorStop(0, "#fef3c7");
      grad.addColorStop(1, "#f59e0b");
    } else {
      grad.addColorStop(0, "#7dd3fc");
      grad.addColorStop(1, "#1e3a8a");
    }
    g.fillStyle = grad;
    g.fillRect(x, y, w, h);

    // Pantulan diagonal pada kaca yang tidak menyala
    if (!lit) {
      g.fillStyle = "rgba(255,255,255,0.22)";
      g.beginPath();
      g.moveTo(x + w * 0.15, y);
      g.lineTo(x + w * 0.4, y);
      g.lineTo(x + w * 0.2, y + h);
      g.lineTo(x, y + h);
      g.closePath();
      g.fill();
    }

    // Mullion di tengah
    g.fillStyle = "#e2e8f0";
    g.fillRect(x + w / 2 - 2, y, 4, h);
  };

  if (style === "office") {
    win(18, 34, 100, 150, 0);
    win(138, 34, 100, 150, 1);
  } else if (style === "shop") {
    // Cornice gelap di atas, lalu satu jendela lebar
    g.fillStyle = "rgba(0,0,0,0.15)";
    g.fillRect(0, 0, S, 16);
    win(40, 36, 176, 64, 0);
  } else {
    // Kafe: kaca besar dengan pita kanopi di atas
    g.fillStyle = "rgba(0,0,0,0.12)";
    g.fillRect(0, 0, S, 14);
    win(16, 40, 224, 140, 0);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ============================================================
 * GEDUNG
 * ============================================================ */
export function ModernBuilding({
  position,
  size = [8, 9, 8],
  color = "#ffffff",
  roofColor = "#1e293b",
  accentColor = "#0284c7",
  name,
  signText,
  subtitle,
  tag,
  variant = "office",
  onClick,
  badgeAction = "Masuk ›",
  badgeIcon = "office",
  badgePosition,
}: BuildingProps) {
  const [w, h, d] = size;
  const frontZ = d / 2;
  const trim = "#334155";
  const isOffice = variant === "office";
  const isCafe = variant === "cafe";

  // Lantai dasar: office lebih rendah, shop dan cafe punya storefront tinggi
  const groundH = isOffice ? h * 0.22 : 3.2;
  const baseY = 0.2;
  const awningY = baseY + groundH + 0.15;
  const signY = baseY + groundH + 0.85;
  const tagY = baseY + groundH + 1.9;
  const seed = hashString(name);
  const glowColor = isOffice ? "#7dd3fc" : "#fde68a";

  // Satu tekstur fasad per gedung. Pengulangan mengikuti ukuran gedung.
  const facadeTex = useMemo(() => {
    const t = makeFacadeTexture(color, variant, seed);
    t.repeat.set(
      Math.max(1, Math.round((w + d) / 2 / 4)),
      Math.max(1, Math.round(h / 3.2)),
    );
    return t;
  }, [color, variant, seed, w, h, d]);

  useEffect(() => () => facadeTex.dispose(), [facadeTex]);

  return (
    <group position={position}>
      {/* Plinth beton di dasar */}
      <RoundedBox
        args={[w + 0.8, 0.3, d + 0.8]}
        radius={0.08}
        smoothness={2}
        position={[0, 0.15, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </RoundedBox>

      {/* Badan gedung dengan sudut membulat dan fasad berjendela */}
      <RoundedBox
        args={[w, h, d]}
        radius={0.14}
        smoothness={3}
        position={[0, h / 2 + baseY, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={facadeTex}
          roughness={0.5}
          metalness={0.05}
        />
      </RoundedBox>

      {/* Cornice atas */}
      <RoundedBox
        args={[w + 0.5, 0.35, d + 0.5]}
        radius={0.06}
        smoothness={2}
        position={[0, h + baseY + 0.1, 0]}
        castShadow
      >
        <meshStandardMaterial color={roofColor} roughness={0.45} />
      </RoundedBox>

      {/* Lantai dasar: kaca dengan cahaya dari dalam */}
      <mesh position={[0, baseY + groundH / 2, frontZ + 0.03]}>
        <planeGeometry args={[w * 0.8, groundH - 0.5]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive={glowColor}
          emissiveIntensity={isOffice ? 0.12 : 0.3}
          roughness={0.12}
          metalness={0.5}
        />
      </mesh>
      {/* Bingkai storefront */}
      <mesh position={[0, baseY + groundH - 0.2, frontZ + 0.05]}>
        <boxGeometry args={[w * 0.8 + 0.1, 0.12, 0.08]} />
        <meshStandardMaterial color={trim} roughness={0.5} metalness={0.4} />
      </mesh>
      {[-w * 0.4, -w * 0.13, w * 0.13, w * 0.4].map((x) => (
        <mesh
          key={`mullion-${x}`}
          position={[x, baseY + groundH / 2, frontZ + 0.05]}
        >
          <boxGeometry args={[0.08, groundH - 0.5, 0.06]} />
          <meshStandardMaterial color={trim} roughness={0.5} metalness={0.4} />
        </mesh>
      ))}

      {/* Kanopi bergaris miring (shop dan cafe) */}
      {!isOffice && (
        <group position={[0, awningY, frontZ + 0.55]} rotation={[0.2, 0, 0]}>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh
              key={`awning-${i}`}
              position={[-w * 0.4 + ((i + 0.5) * w * 0.8) / 6, 0, 0]}
              castShadow
            >
              <boxGeometry args={[(w * 0.8) / 6, 0.12, 1.1]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? accentColor : "#f8fafc"}
                roughness={0.7}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Papan nama dengan lampu latar */}
      {signText && !isOffice && (
        <group position={[0, signY, frontZ + 0.08]}>
          <RoundedBox
            args={[w * 0.8, 0.8, 0.15]}
            radius={0.05}
            smoothness={2}
            castShadow
          >
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={0.35}
              roughness={0.4}
            />
          </RoundedBox>
          <Html
            position={[0, 0, 0.1]}
            center
            transform
            distanceFactor={12}
            zIndexRange={[5, 0]}
          >
            <div className="font-black text-[13px] tracking-widest text-white whitespace-nowrap drop-shadow">
              {signText}
            </div>
          </Html>
        </group>
      )}

      {/* Papan tag (DISEWAKAN / nama kategori) */}
      {tag && (
        <group position={[0, tagY, frontZ + 0.06]}>
          <mesh>
            <planeGeometry args={[w * 0.65, 0.7]} />
            <meshStandardMaterial
              color={tag.includes("DISEWAKAN") ? "#dc2626" : "#0284c7"}
              roughness={0.6}
            />
          </mesh>
          <Html
            position={[0, 0, 0.02]}
            center
            transform
            distanceFactor={18}
            zIndexRange={[5, 0]}
          >
            <div className="font-extrabold text-[10px] uppercase tracking-wider text-white px-2 whitespace-nowrap drop-shadow">
              {tag}
            </div>
          </Html>
        </group>
      )}

      {/* Detail atap */}
      {isOffice && (
        <>
          {/* Unit AC di atap */}
          <RoundedBox
            args={[1.4, 0.9, 1.0]}
            radius={0.08}
            smoothness={2}
            position={[w * 0.25, h + baseY + 0.7, -d * 0.2]}
            castShadow
          >
            <meshStandardMaterial
              color="#cbd5e1"
              roughness={0.6}
              metalness={0.3}
            />
          </RoundedBox>
          <RoundedBox
            args={[1.0, 0.6, 0.9]}
            radius={0.08}
            smoothness={2}
            position={[-w * 0.22, h + baseY + 0.5, d * 0.18]}
            castShadow
          >
            <meshStandardMaterial
              color="#e2e8f0"
              roughness={0.6}
              metalness={0.3}
            />
          </RoundedBox>
          {/* Antena dengan lampu merah berkedip (statis) */}
          <mesh position={[-w * 0.2, h + baseY + 1.8, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.06, 2.4, 8]} />
            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[-w * 0.2, h + baseY + 3.05, 0]}>
            <sphereGeometry args={[0.09, 10, 10]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#ef4444"
              emissiveIntensity={1.4}
            />
          </mesh>
        </>
      )}
      {variant === "shop" && (
        <group position={[w * 0.2, h + baseY + 0.9, -d * 0.2]}>
          {/* Tangki air khas gedung ruko */}
          <mesh castShadow>
            <cylinderGeometry args={[0.7, 0.7, 1.3, 18]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.85, 0]} castShadow>
            <coneGeometry args={[0.8, 0.5, 18]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.7} />
          </mesh>
        </group>
      )}
      {isCafe && (
        <group position={[w * 0.2, h + baseY + 0.3, -d * 0.15]}>
          {/* Meja dan payung di atap teras */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 0.1, 18]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.4, 8]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.5} />
          </mesh>
          <mesh position={[0, 1.45, 0]} castShadow>
            <coneGeometry args={[1.8, 0.8, 16]} />
            <meshStandardMaterial
              color={accentColor}
              roughness={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* Label lokasi yang bisa diklik */}
      <Html
        position={badgePosition || [0, h + 1.8, 0]}
        center
        distanceFactor={22}
        zIndexRange={[10, 0]}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="group cursor-pointer flex items-center gap-1.5 p-1.5 pl-3 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white border border-cyan-400/80 shadow-[0_4px_20px_rgba(56,189,248,0.35)] backdrop-blur-md transition-all duration-200 hover:scale-105 select-none"
        >
          <div className="w-6 h-6 rounded-full bg-linear-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-inner">
            {badgeIcon === "game" && <Gamepad2 className="w-3.5 h-3.5" />}
            {badgeIcon === "cafe" && <Coffee className="w-3.5 h-3.5" />}
            {badgeIcon === "office" && <Building2 className="w-3.5 h-3.5" />}
            {badgeIcon === "shop" && <Store className="w-3.5 h-3.5" />}
          </div>

          <div className="flex flex-col pr-1">
            <span className="text-xs font-bold tracking-tight text-white whitespace-nowrap leading-tight">
              {name}
            </span>
            {subtitle && (
              <span className="text-[10px] text-cyan-200/80 whitespace-nowrap leading-none">
                {subtitle}
              </span>
            )}
          </div>

          <div className="px-2.5 py-1 rounded-full bg-linear-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-[10px] font-semibold text-white shadow-sm flex items-center gap-0.5 whitespace-nowrap">
            {badgeAction}
          </div>
        </div>
      </Html>
    </group>
  );
}
