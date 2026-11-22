import { type RefObject, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Html, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { type PlayerTickData } from "@/hooks/useOfficeSocket";
import { getStatusMeta } from "@/config/status";
import { type MemberRole, type PlayerStatus } from "@/types";
import { getRoleMeta } from "@/lib/roles";

interface Avatar3DProps {
  userId: string;
  fullName: string;
  color?: string;
  initialPosition: [number, number, number];
  isLocal?: boolean;
  localStateRef?: RefObject<PlayerTickData>;
  remoteTicksRef?: RefObject<Record<string, PlayerTickData>>;
  bubbleMessage?: string | null;
  isFirstPerson?: boolean;
  role?: MemberRole | null;
  jobTitle?: string | null;
  status?: PlayerStatus | null;
}

// ---------------------------------------------------------------
// Palet dan tampilan unik per pemain
// ---------------------------------------------------------------
const SKIN_TONES = ["#fcd9b6", "#f5c28b", "#d9a273", "#a86f45"];
const HAIR_COLORS = [
  "#1e1b4b",
  "#3f2a1e",
  "#111827",
  "#7c2d12",
  "#6d28d9",
  "#d6b370",
];
const PANTS_COLORS = ["#1e293b", "#334155", "#312e81", "#44403c"];
const SHOE_COLOR = "#0f172a";
const ROLE_ACCENT: Record<MemberRole, string> = {
  OWNER: "#f59e0b",
  ADMIN: "#a855f7",
  MEMBER: "#0ea5e9",
  GUEST: "#94a3b8",
};

interface Look {
  skin: string;
  hair: string;
  pants: string;
  hairStyle: 0 | 1 | 2; // 0 pendek, 1 panjang, 2 sanggul
  glasses: boolean;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Tampilan stabil untuk setiap userId: sama di semua client */
function buildLook(userId: string): Look {
  const h = hashString(userId);
  return {
    skin: SKIN_TONES[h % SKIN_TONES.length],
    hair: HAIR_COLORS[(h >>> 3) % HAIR_COLORS.length],
    pants: PANTS_COLORS[(h >>> 6) % PANTS_COLORS.length],
    hairStyle: ((h >>> 9) % 3) as 0 | 1 | 2,
    glasses: (h >>> 12) % 4 === 0,
  };
}

// Interpolasi sudut terpendek agar karakter tidak berputar 360 derajat saat berbalik arah
function lerpAngle(a: number, b: number, t: number): number {
  const diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  const shortest = diff < -Math.PI ? diff + Math.PI * 2 : diff;
  return a + shortest * t;
}

// ---------------------------------------------------------------
// Bagian rambut
// ---------------------------------------------------------------
function Hair({ look }: { look: Look }) {
  const hairMat = <meshStandardMaterial color={look.hair} roughness={0.85} />;

  return (
    <group>
      {/* Tudung rambut di bagian atas kepala */}
      <mesh position={[0, 1.56, -0.012]} castShadow>
        <sphereGeometry
          args={[0.142, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42]}
        />
        {hairMat}
      </mesh>

      {look.hairStyle === 0 && (
        // Poni pendek
        <RoundedBox
          args={[0.2, 0.04, 0.07]}
          radius={0.02}
          smoothness={3}
          position={[0, 1.6, 0.095]}
          castShadow
        >
          {hairMat}
        </RoundedBox>
      )}

      {look.hairStyle === 1 && (
        // Rambut panjang di belakang kepala
        <RoundedBox
          args={[0.26, 0.3, 0.1]}
          radius={0.04}
          smoothness={4}
          position={[0, 1.44, -0.1]}
          castShadow
        >
          {hairMat}
        </RoundedBox>
      )}

      {look.hairStyle === 2 && (
        // Sanggul di atas belakang kepala
        <mesh position={[0, 1.72, -0.11]} castShadow>
          <sphereGeometry args={[0.07, 16, 12]} />
          {hairMat}
        </mesh>
      )}
    </group>
  );
}

// ---------------------------------------------------------------
// Wajah: mata, kilap mata, mulut, pipi, telinga, dan kacamata
// ---------------------------------------------------------------
function Face({ look }: { look: Look }) {
  const eyeZ = 0.12;
  const skinMat = <meshStandardMaterial color={look.skin} roughness={0.55} />;

  return (
    <group>
      {/* Telinga */}
      <mesh position={[-0.132, 1.555, 0]} castShadow>
        <sphereGeometry args={[0.03, 12, 10]} />
        {skinMat}
      </mesh>
      <mesh position={[0.132, 1.555, 0]} castShadow>
        <sphereGeometry args={[0.03, 12, 10]} />
        {skinMat}
      </mesh>

      {/* Mata dengan kilap */}
      {[-0.05, 0.05].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.575, eyeZ]}>
            <sphereGeometry args={[0.022, 12, 10]} />
            <meshStandardMaterial color="#0f172a" roughness={0.2} />
          </mesh>
          <mesh position={[x + 0.006, 1.583, eyeZ + 0.018]}>
            <sphereGeometry args={[0.007, 8, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Alis tipis */}
      {[-0.05, 0.05].map((x) => (
        <mesh key={`brow-${x}`} position={[x, 1.61, eyeZ - 0.005]}>
          <boxGeometry args={[0.04, 0.008, 0.01]} />
          <meshStandardMaterial color={look.hair} />
        </mesh>
      ))}

      {/* Pipi merona */}
      {[-0.078, 0.078].map((x) => (
        <mesh
          key={`blush-${x}`}
          position={[x, 1.538, 0.118]}
          scale={[1.3, 0.7, 0.2]}
        >
          <sphereGeometry args={[0.02, 12, 8]} />
          <meshStandardMaterial
            color="#fb7185"
            transparent
            opacity={0.55}
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* Mulut senyum sederhana */}
      <mesh position={[0, 1.52, 0.127]}>
        <boxGeometry args={[0.05, 0.01, 0.01]} />
        <meshStandardMaterial color="#9f1239" />
      </mesh>

      {/* Kacamata (hanya untuk sebagian pemain) */}
      {look.glasses && (
        <group>
          {[-0.05, 0.05].map((x) => (
            <mesh key={`lens-${x}`} position={[x, 1.575, eyeZ + 0.006]}>
              <torusGeometry args={[0.034, 0.005, 8, 18]} />
              <meshStandardMaterial
                color="#0f172a"
                roughness={0.3}
                metalness={0.6}
              />
            </mesh>
          ))}
          <mesh position={[0, 1.578, eyeZ + 0.006]}>
            <boxGeometry args={[0.03, 0.006, 0.006]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ---------------------------------------------------------------
// Komponen utama
// ---------------------------------------------------------------
/** Skala tinggi avatar (1 = ukuran asli ±1,8 m) */
const AVATAR_SCALE = 0.8;

export function Avatar3D({
  userId,
  fullName,
  color = "#2563eb",
  initialPosition,
  isLocal = false,
  localStateRef,
  remoteTicksRef,
  bubbleMessage,
  isFirstPerson = false,
  role,
  jobTitle,
  status,
}: Avatar3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyMeshRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const targetVec = useRef(new THREE.Vector3(...initialPosition));
  const walkTime = useRef(0);

  const look = useMemo(() => buildLook(userId), [userId]);
  const roleKey: MemberRole = (role ?? "MEMBER") as MemberRole;
  const accent = ROLE_ACCENT[roleKey] ?? ROLE_ACCENT.MEMBER;
  const isGuest = roleKey === "GUEST";

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const tick = isLocal
      ? localStateRef?.current
      : remoteTicksRef?.current?.[userId];
    if (tick && Array.isArray(tick.position)) {
      targetVec.current.set(...tick.position);
    }

    // Frame-rate independent damping
    const posAlpha = 1 - Math.exp(-(isLocal ? 35 : 14) * delta);
    const rotAlpha = 1 - Math.exp(-(isLocal ? 25 : 14) * delta);

    groupRef.current.position.lerp(targetVec.current, posAlpha);
    if (tick) {
      groupRef.current.rotation.y = lerpAngle(
        groupRef.current.rotation.y,
        tick.rotationY,
        rotAlpha,
      );
    }

    const isWalking = tick && tick.animation === "walk";

    if (isWalking) {
      walkTime.current += delta * 9;
      const swing = Math.sin(walkTime.current) * 0.55;

      // Kaki kiri & kanan mengayun berlawanan arah
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;

      // Lengan mengayun berlawanan arah dengan kaki
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.7;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.7;

      // Badan naik-turun sedikit saat berjalan
      if (bodyMeshRef.current) {
        bodyMeshRef.current.position.y =
          Math.abs(Math.sin(walkTime.current * 2)) * 0.05;
      }
    } else {
      walkTime.current = 0;
      const breathe = Math.sin(state.clock.elapsedTime * 2.5) * 0.015;

      const relax = (ref: RefObject<THREE.Group | null>) => {
        if (ref.current) {
          ref.current.rotation.x = THREE.MathUtils.lerp(
            ref.current.rotation.x,
            0,
            0.2,
          );
        }
      };
      relax(leftLegRef);
      relax(rightLegRef);
      relax(leftArmRef);
      relax(rightArmRef);

      if (bodyMeshRef.current) {
        bodyMeshRef.current.position.y = THREE.MathUtils.lerp(
          bodyMeshRef.current.position.y,
          breathe,
          0.1,
        );
      }
    }
  });

  const roleMeta = getRoleMeta(role);
  const roleText = jobTitle?.trim() || roleMeta.label;

  const shirtMat = <meshStandardMaterial color={color} roughness={0.5} />;
  const pantsMat = <meshStandardMaterial color={look.pants} roughness={0.7} />;
  const skinMat = <meshStandardMaterial color={look.skin} roughness={0.55} />;
  const statusMeta = getStatusMeta(status);

  return (
    <group
      ref={groupRef}
      position={initialPosition}
      scale={AVATAR_SCALE}
      visible={!(isLocal && isFirstPerson)}
    >
      {/* Bayangan di lantai */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.32, 24]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      <group ref={bodyMeshRef}>
        {/* ---------------- KAKI ---------------- */}
        {/* Kaki kiri: pivot di pinggul */}
        <group ref={leftLegRef} position={[-0.095, 0.8, 0]}>
          <RoundedBox
            args={[0.135, 0.72, 0.14]}
            radius={0.04}
            smoothness={4}
            position={[0, -0.36, 0]}
            castShadow
          >
            {pantsMat}
          </RoundedBox>
          <RoundedBox
            args={[0.14, 0.09, 0.27]}
            radius={0.035}
            smoothness={4}
            position={[0, -0.76, 0.04]}
            castShadow
          >
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.35} />
          </RoundedBox>
        </group>

        {/* Kaki kanan */}
        <group ref={rightLegRef} position={[0.095, 0.8, 0]}>
          <RoundedBox
            args={[0.135, 0.72, 0.14]}
            radius={0.04}
            smoothness={4}
            position={[0, -0.36, 0]}
            castShadow
          >
            {pantsMat}
          </RoundedBox>
          <RoundedBox
            args={[0.14, 0.09, 0.27]}
            radius={0.035}
            smoothness={4}
            position={[0, -0.76, 0.04]}
            castShadow
          >
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.35} />
          </RoundedBox>
        </group>

        {/* Pinggul */}
        <RoundedBox
          args={[0.36, 0.14, 0.24]}
          radius={0.05}
          smoothness={4}
          position={[0, 0.8, 0]}
          castShadow
        >
          {pantsMat}
        </RoundedBox>

        {/* ---------------- BADAN ---------------- */}
        {/* Torso / kemeja */}
        <RoundedBox
          args={[0.38, 0.54, 0.24]}
          radius={0.07}
          smoothness={5}
          position={[0, 1.12, 0]}
          castShadow
        >
          {shirtMat}
        </RoundedBox>

        {/* Kerah kemeja */}
        {!isGuest && (
          <>
            <mesh position={[-0.05, 1.38, 0.118]} rotation={[0, 0, 0.45]}>
              <boxGeometry args={[0.08, 0.035, 0.012]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[0.05, 1.38, 0.118]} rotation={[0, 0, -0.45]}>
              <boxGeometry args={[0.08, 0.035, 0.012]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          </>
        )}

        {/* Dasi (hanya untuk anggota dan admin) */}
        {!isGuest && (
          <>
            <mesh position={[0, 1.31, 0.128]} rotation={[0.05, 0, 0]}>
              <boxGeometry args={[0.055, 0.26, 0.018]} />
              <meshStandardMaterial color={accent} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.44, 0.126]}>
              <boxGeometry args={[0.065, 0.05, 0.03]} />
              <meshStandardMaterial color={accent} roughness={0.4} />
            </mesh>
          </>
        )}

        {/* Lanyard dan kartu identitas dengan warna role */}
        {!isGuest && (
          <group>
            <mesh position={[0, 1.22, 0.122]}>
              <boxGeometry args={[0.012, 0.22, 0.008]} />
              <meshStandardMaterial color={accent} />
            </mesh>
            <RoundedBox
              args={[0.11, 0.15, 0.01]}
              radius={0.01}
              smoothness={2}
              position={[0, 1.0, 0.13]}
            >
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </RoundedBox>
            <mesh position={[0, 1.07, 0.136]}>
              <boxGeometry args={[0.1, 0.035, 0.005]} />
              <meshStandardMaterial color={accent} />
            </mesh>
          </group>
        )}

        {/* ---------------- LENGAN ---------------- */}
        {/* Lengan kiri: pivot di bahu */}
        <group ref={leftArmRef} position={[-0.245, 1.34, 0]}>
          <RoundedBox
            args={[0.13, 0.44, 0.14]}
            radius={0.05}
            smoothness={4}
            position={[0, -0.22, 0]}
            castShadow
          >
            {shirtMat}
          </RoundedBox>
          <mesh position={[0, -0.48, 0]} castShadow scale={[1, 1.1, 0.9]}>
            <sphereGeometry args={[0.055, 12, 10]} />
            {skinMat}
          </mesh>
        </group>

        {/* Lengan kanan */}
        <group ref={rightArmRef} position={[0.245, 1.34, 0]}>
          <RoundedBox
            args={[0.13, 0.44, 0.14]}
            radius={0.05}
            smoothness={4}
            position={[0, -0.22, 0]}
            castShadow
          >
            {shirtMat}
          </RoundedBox>
          <mesh position={[0, -0.48, 0]} castShadow scale={[1, 1.1, 0.9]}>
            <sphereGeometry args={[0.055, 12, 10]} />
            {skinMat}
          </mesh>
        </group>

        {/* ---------------- KEPALA ---------------- */}
        {/* Leher */}
        <mesh position={[0, 1.42, 0]}>
          <cylinderGeometry args={[0.06, 0.065, 0.12, 12]} />
          {skinMat}
        </mesh>

        {/* Kepala */}
        <mesh position={[0, 1.56, 0]} castShadow>
          <sphereGeometry args={[0.135, 24, 18]} />
          {skinMat}
        </mesh>

        <Hair look={look} />
        <Face look={look} />
      </group>

      {/* Bubble chat: memakai Html dengan distanceFactor agar ikut mengecil saat zoom */}
      {bubbleMessage && (
        <Html
          position={[0, 2.4, 0]}
          center
          distanceFactor={24}
          zIndexRange={[50, 0]}
        >
          <div className="relative max-w-[240px] px-3.5 py-2 rounded-2xl bg-white/95 text-slate-800 text-xs font-semibold text-center shadow-2xl shadow-black/20 border border-slate-200/90 break-words pointer-events-none select-none animate-in fade-in zoom-in-95 duration-150">
            {bubbleMessage}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-r border-b border-slate-200/90" />
          </div>
        </Html>
      )}

      {/* Nama & role gaya Roblox: teks 3D dengan outline, selalu menghadap kamera */}
      <Billboard position={[0, 2.12, 0]}>
        <Text
          fontSize={0.19}
          color={isLocal ? "#67e8f9" : "#ffffff"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.014}
          outlineColor="#0f172a"
        >
          {isLocal ? `${fullName} (Kamu)` : fullName}
        </Text>

        <Text
          position={[0, -0.2, 0]}
          fontSize={0.12}
          color={accent}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#0f172a"
          letterSpacing={0.04}
          maxWidth={2.5}
        >
          {roleText}
        </Text>

        <Text
          position={[0, -0.36, 0]}
          fontSize={0.1}
          color={statusMeta.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#0f172a"
          maxWidth={2.5}
        >
          {`● ${statusMeta.label}`}
        </Text>
      </Billboard>
    </group>
  );
}
