import { type RefObject, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Html, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { type PlayerTickData } from "@/hooks/useOfficeSocket";
import { riderWorldPos, stepTramView, TRAM } from "@/lib/tramRuntime";
import { getStatusMeta } from "@/config/status";
import { type MemberRole, type PlayerStatus } from "@/types";
import { getRoleMeta } from "@/lib/roles";
import {
  resolveAvatarPreset,
  useLocalAvatarId,
  type AvatarPreset,
} from "@/config/avatars";

interface Avatar3DProps {
  userId: string;
  fullName: string;
  color?: string;
  avatarId?: string | null;
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

const ROLE_ACCENT: Record<MemberRole, string> = {
  OWNER: "#f59e0b",
  ADMIN: "#a855f7",
  MEMBER: "#0ea5e9",
  GUEST: "#94a3b8",
};

function lerpAngle(a: number, b: number, t: number): number {
  const diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  const shortest = diff < -Math.PI ? diff + Math.PI * 2 : diff;
  return a + shortest * t;
}

// Semua komponen kepala memakai koordinat lokal terhadap pusat kepala (0, 0.145, 0)
// di dalam headGroupRef yang berporos di leher (0, 1.44, 0).
const HEAD_R = 0.13;
const HEAD_SCALE: [number, number, number] = [0.92, 1.06, 0.94];

// ---------------------------------------------------------------
// Rambut & Hijab (koordinat lokal terhadap pusat kepala [0, 0.145, 0])
// ---------------------------------------------------------------
function Hair({ look }: { look: AvatarPreset }) {
  const hairMat = <meshStandardMaterial color={look.hair} roughness={0.65} />;

  if (look.hairStyle === "hijab") {
    return (
      <group>
        {/* Ciput di dahi */}
        <mesh position={[0, 0.015, 0.005]} scale={[0.95, 1.07, 0.96]}>
          <sphereGeometry args={[HEAD_R * 1.02, 24, 18]} />
          <meshStandardMaterial color={look.collar} roughness={0.7} />
        </mesh>
        {/* Tudung hijab utama */}
        <mesh position={[0, 0.005, -0.014]} scale={[1.01, 1.09, 1.03]} castShadow>
          <sphereGeometry args={[HEAD_R * 1.06, 24, 18]} />
          {hairMat}
        </mesh>
        {/* Kain hijab menutup leher & bahu atas */}
        <mesh position={[0, -0.14, -0.01]} castShadow>
          <cylinderGeometry args={[0.105, 0.145, 0.16, 20]} />
          {hairMat}
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Tudung rambut menempel rapi pada kepala */}
      <mesh position={[0, 0.012, -0.01]} scale={[0.96, 1.08, 0.99]} castShadow>
        <sphereGeometry
          args={[HEAD_R * 1.045, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.56]}
        />
        {hairMat}
      </mesh>
      {/* Rambut belakang kepala */}
      <mesh position={[0, -0.005, -0.036]} scale={[0.93, 0.98, 0.85]} castShadow>
        <sphereGeometry args={[HEAD_R * 0.98, 20, 16]} />
        {hairMat}
      </mesh>

      {look.hairStyle === "short" && (
        <>
          <RoundedBox
            args={[0.17, 0.052, 0.14]}
            radius={0.024}
            smoothness={4}
            position={[0, 0.105, 0.015]}
            rotation={[-0.16, 0, 0]}
            castShadow
          >
            {hairMat}
          </RoundedBox>
          {[-0.112, 0.112].map((x) => (
            <mesh key={`sb-${x}`} position={[x, -0.01, 0.015]}>
              <boxGeometry args={[0.014, 0.06, 0.03]} />
              {hairMat}
            </mesh>
          ))}
        </>
      )}

      {look.hairStyle === "fade" && (
        <RoundedBox
          args={[0.15, 0.065, 0.13]}
          radius={0.028}
          smoothness={4}
          position={[0, 0.115, 0.025]}
          rotation={[-0.22, 0, 0]}
          castShadow
        >
          {hairMat}
        </RoundedBox>
      )}

      {look.hairStyle === "parted" && (
        <>
          <RoundedBox
            args={[0.105, 0.042, 0.11]}
            radius={0.02}
            smoothness={3}
            position={[-0.045, 0.1, 0.04]}
            rotation={[0.1, 0.15, 0.24]}
            castShadow
          >
            {hairMat}
          </RoundedBox>
          <RoundedBox
            args={[0.105, 0.042, 0.11]}
            radius={0.02}
            smoothness={3}
            position={[0.045, 0.1, 0.04]}
            rotation={[0.1, -0.15, -0.24]}
            castShadow
          >
            {hairMat}
          </RoundedBox>
        </>
      )}

      {look.hairStyle === "long" && (
        <>
          {/* Poni menyamping */}
          <RoundedBox
            args={[0.11, 0.04, 0.08]}
            radius={0.018}
            smoothness={3}
            position={[-0.048, 0.088, 0.065]}
            rotation={[0.25, 0.2, 0.3]}
            castShadow
          >
            {hairMat}
          </RoundedBox>
          <RoundedBox
            args={[0.11, 0.04, 0.08]}
            radius={0.018}
            smoothness={3}
            position={[0.048, 0.088, 0.065]}
            rotation={[0.25, -0.2, -0.3]}
            castShadow
          >
            {hairMat}
          </RoundedBox>
          {/* Rambut panjang di belakang */}
          <RoundedBox
            args={[0.24, 0.3, 0.1]}
            radius={0.045}
            smoothness={4}
            position={[0, -0.12, -0.075]}
            castShadow
          >
            {hairMat}
          </RoundedBox>
          {[-0.11, 0.11].map((x) => (
            <RoundedBox
              key={`lock-${x}`}
              args={[0.048, 0.22, 0.065]}
              radius={0.022}
              smoothness={3}
              position={[x, -0.1, 0.01]}
              castShadow
            >
              {hairMat}
            </RoundedBox>
          ))}
        </>
      )}

      {look.hairStyle === "ponytail" && (
        <>
          <RoundedBox
            args={[0.17, 0.042, 0.07]}
            radius={0.018}
            smoothness={3}
            position={[0, 0.085, 0.072]}
            rotation={[0.2, 0, 0]}
            castShadow
          >
            {hairMat}
          </RoundedBox>
          {/* Ikat rambut & kuncir */}
          <mesh position={[0, 0.065, -0.115]} rotation={[-0.5, 0, 0]}>
            <torusGeometry args={[0.028, 0.009, 10, 16]} />
            <meshStandardMaterial color={look.shirt} roughness={0.4} />
          </mesh>
          <mesh
            position={[0, -0.04, -0.155]}
            rotation={[0.32, 0, 0]}
            scale={[0.8, 1.8, 0.8]}
            castShadow
          >
            <sphereGeometry args={[0.058, 16, 14]} />
            {hairMat}
          </mesh>
        </>
      )}
    </group>
  );
}

// ---------------------------------------------------------------
// Wajah (koordinat lokal terhadap pusat kepala [0, 0.145, 0])
// Permukaan depan kepala: z ≈ 0.122 di tengah, z ≈ 0.112 di posisi mata (x=±0.044)
// ---------------------------------------------------------------
function Face({
  look,
  eyesRef,
}: {
  look: AvatarPreset;
  eyesRef: RefObject<THREE.Group | null>;
}) {
  const isFemale = look.gender === "female";
  const eyeZ = 0.112;
  const skinMat = <meshStandardMaterial color={look.skin} roughness={0.48} />;

  return (
    <group>
      {/* Telinga */}
      {[-0.118, 0.118].map((x) => (
        <mesh
          key={`ear-${x}`}
          position={[x, -0.005, -0.005]}
          scale={[0.5, 1, 0.7]}
          castShadow
        >
          <sphereGeometry args={[0.024, 12, 10]} />
          {skinMat}
        </mesh>
      ))}

      {/* Hidung halus */}
      <mesh position={[0, -0.014, 0.122]} scale={[0.9, 1.1, 0.8]}>
        <sphereGeometry args={[0.011, 12, 10]} />
        {skinMat}
      </mesh>

      {/* Mata ekspresif + animasi kedip */}
      <group ref={eyesRef} position={[0, 0.012, eyeZ]}>
        {[-0.044, 0.044].map((x) => (
          <group key={`eye-${x}`} position={[x, 0, 0]}>
            {/* Sklera */}
            <mesh scale={[1.05, isFemale ? 1.12 : 0.96, 0.5]}>
              <sphereGeometry args={[0.02, 14, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.15} />
            </mesh>
            {/* Iris berwarna */}
            <mesh position={[0, 0, 0.006]} scale={[1, 1.05, 0.5]}>
              <sphereGeometry args={[0.014, 12, 10]} />
              <meshStandardMaterial color={look.iris} roughness={0.2} />
            </mesh>
            {/* Pupil */}
            <mesh position={[0, 0, 0.01]}>
              <sphereGeometry args={[0.0075, 10, 8]} />
              <meshStandardMaterial color="#090d16" roughness={0.1} />
            </mesh>
            {/* Kilau mata */}
            <mesh position={[0.005, 0.005, 0.015]}>
              <sphereGeometry args={[0.004, 8, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Alis */}
      {[-0.044, 0.044].map((x) => (
        <mesh
          key={`brow-${x}`}
          position={[x, 0.046, eyeZ - 0.002]}
          rotation={[0, 0, x < 0 ? 0.08 : -0.08]}
        >
          <boxGeometry args={[0.034, 0.006, 0.008]} />
          <meshStandardMaterial color={look.hair} roughness={0.7} />
        </mesh>
      ))}

      {/* Pipi merona */}
      {[-0.068, 0.068].map((x) => (
        <mesh
          key={`blush-${x}`}
          position={[x, -0.024, 0.104]}
          scale={[1.3, 0.7, 0.25]}
        >
          <sphereGeometry args={[0.017, 12, 8]} />
          <meshStandardMaterial
            color="#fb7185"
            transparent
            opacity={isFemale ? 0.42 : 0.2}
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* Senyum */}
      <mesh position={[0, -0.052, 0.112]}>
        <boxGeometry args={[0.036, 0.007, 0.008]} />
        <meshStandardMaterial
          color={isFemale ? "#e11d48" : "#9f4a4a"}
          roughness={0.5}
        />
      </mesh>

      {/* Janggut rapi (untuk preset cowok tertentu) */}
      {look.beard && (
        <group>
          <mesh position={[0, -0.075, 0.035]} scale={[0.9, 0.7, 0.9]}>
            <sphereGeometry
              args={[0.102, 18, 12, 0, Math.PI * 2, Math.PI * 0.56, Math.PI * 0.4]}
            />
            <meshStandardMaterial color={look.hair} roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.04, 0.113]}>
            <boxGeometry args={[0.04, 0.007, 0.008]} />
            <meshStandardMaterial color={look.hair} roughness={0.85} />
          </mesh>
        </group>
      )}

      {/* Kacamata */}
      {look.glasses && (
        <group>
          {[-0.044, 0.044].map((x) => (
            <mesh key={`lens-${x}`} position={[x, 0.012, eyeZ + 0.015]}>
              <torusGeometry args={[0.026, 0.0035, 8, 20]} />
              <meshStandardMaterial
                color="#1e293b"
                roughness={0.25}
                metalness={0.7}
              />
            </mesh>
          ))}
          <mesh position={[0, 0.014, eyeZ + 0.015]}>
            <boxGeometry args={[0.022, 0.004, 0.004]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ---------------------------------------------------------------
// Komponen utama Avatar3D
// ---------------------------------------------------------------
const AVATAR_SCALE = 0.84;

export function Avatar3D({
  userId,
  fullName,
  color,
  avatarId,
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
  const headGroupRef = useRef<THREE.Group>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftKneeRef = useRef<THREE.Group>(null);
  const rightKneeRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const targetVec = useRef(new THREE.Vector3(...initialPosition));
  const walkTime = useRef(0);
  const blinkTimer = useRef(Math.random() * 3);

  const localAvatarId = useLocalAvatarId();
  const effectiveAvatarId = isLocal ? (localAvatarId ?? avatarId) : avatarId;

  const look = useMemo(
    () => resolveAvatarPreset(effectiveAvatarId, userId),
    [effectiveAvatarId, userId],
  );
  const isFemale = look.gender === "female";
  const hasSkirt =
    look.outfit === "cardigan_skirt" || look.outfit === "jacket_skirt";

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

    const rotAlpha = 1 - Math.exp(-(isLocal ? 25 : 14) * delta);

    if (!isLocal && tick?.ride) {
      stepTramView(state.clock.elapsedTime);
      const [x, z] = riderWorldPos(tick.ride.rx, tick.ride.rz);
      groupRef.current.position.set(x, TRAM.floorY, z);
    } else {
      const posAlpha = 1 - Math.exp(-(isLocal ? 35 : 14) * delta);
      groupRef.current.position.lerp(targetVec.current, posAlpha);
    }
    if (tick) {
      groupRef.current.rotation.y = lerpAngle(
        groupRef.current.rotation.y,
        tick.rotationY,
        rotAlpha,
      );
    }

    // Animasi kedip mata natural tiap ~3.8 detik
    blinkTimer.current += delta;
    if (eyesRef.current) {
      const cycle = blinkTimer.current % 3.8;
      const targetScaleY = cycle > 3.65 ? 0.08 : 1;
      eyesRef.current.scale.y = THREE.MathUtils.lerp(
        eyesRef.current.scale.y,
        targetScaleY,
        0.45,
      );
    }

    const isWalking = tick && tick.animation === "walk";
    const isSitting = tick && tick.animation === "sit";

    if (isSitting) {
      walkTime.current = 0;
      const t = state.clock.elapsedTime;
      // Tinggi pinggul tepat di atas dudukan kursi/bangku (y ≈ 0.46 m)
      const sitBob = -0.21 + Math.sin(t * 2.0) * 0.004;

      // Tekuk paha ke depan 90° & tekuk lutut ke bawah 90° agar duduk natural di kursi
      const poseLimb = (ref: RefObject<THREE.Group | null>, targetX: number) => {
        if (ref.current) {
          ref.current.rotation.x = THREE.MathUtils.lerp(
            ref.current.rotation.x,
            targetX,
            0.25,
          );
        }
      };
      poseLimb(leftLegRef, -Math.PI / 2);
      poseLimb(rightLegRef, -Math.PI / 2);
      poseLimb(leftKneeRef, Math.PI / 2);
      poseLimb(rightKneeRef, Math.PI / 2);
      poseLimb(leftArmRef, -0.45);
      poseLimb(rightArmRef, -0.45);

      if (bodyMeshRef.current) {
        bodyMeshRef.current.position.y = THREE.MathUtils.lerp(
          bodyMeshRef.current.position.y,
          sitBob,
          0.25,
        );
      }
      if (headGroupRef.current) {
        headGroupRef.current.rotation.z = THREE.MathUtils.lerp(
          headGroupRef.current.rotation.z,
          Math.sin(t * 0.9) * 0.025,
          0.08,
        );
      }
    } else if (isWalking) {
      walkTime.current += delta * 9.5;
      const swing = Math.sin(walkTime.current) * 0.48;

      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftKneeRef.current) {
        leftKneeRef.current.rotation.x = Math.max(0, -swing * 0.45);
      }
      if (rightKneeRef.current) {
        rightKneeRef.current.rotation.x = Math.max(0, swing * 0.45);
      }
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.65;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.65;

      if (bodyMeshRef.current) {
        bodyMeshRef.current.position.y =
          Math.abs(Math.sin(walkTime.current * 2)) * 0.038;
      }
      if (headGroupRef.current) {
        headGroupRef.current.rotation.z = Math.sin(walkTime.current) * 0.025;
      }
    } else {
      walkTime.current = 0;
      const t = state.clock.elapsedTime;
      const breathe = Math.sin(t * 2.2) * 0.01;

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
      relax(leftKneeRef);
      relax(rightKneeRef);
      relax(leftArmRef);
      relax(rightArmRef);

      if (bodyMeshRef.current) {
        bodyMeshRef.current.position.y = THREE.MathUtils.lerp(
          bodyMeshRef.current.position.y,
          breathe,
          0.1,
        );
      }
      if (headGroupRef.current) {
        headGroupRef.current.rotation.z = THREE.MathUtils.lerp(
          headGroupRef.current.rotation.z,
          Math.sin(t * 1.1) * 0.018,
          0.08,
        );
      }
    }
  });

  const roleMeta = getRoleMeta(role);
  const roleText = jobTitle?.trim() || roleMeta.label;
  const shirtColor = look.shirt || color || "#1e3a5f";

  const shirtMat = <meshStandardMaterial color={shirtColor} roughness={0.55} />;
  const innerMat = <meshStandardMaterial color={look.inner} roughness={0.48} />;
  const collarMat = <meshStandardMaterial color={look.collar} roughness={0.45} />;
  const pantsMat = <meshStandardMaterial color={look.pants} roughness={0.68} />;
  const skinMat = <meshStandardMaterial color={look.skin} roughness={0.48} />;
  const shoeMat = <meshStandardMaterial color={look.shoe} roughness={0.42} />;
  const soleMat = <meshStandardMaterial color={look.shoeSole} roughness={0.45} />;
  const statusMeta = getStatusMeta(status);

  const shoulderX = isFemale ? 0.185 : 0.215;
  const hipX = isFemale ? 0.072 : 0.082;
  const chestR = isFemale ? 0.145 : 0.168;
  const waistR = isFemale ? 0.115 : 0.138;

  return (
    <group
      ref={groupRef}
      position={initialPosition}
      scale={AVATAR_SCALE}
      visible={!(isLocal && isFirstPerson)}
    >
      {/* Bayangan di lantai */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.3, 24]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      <group ref={bodyMeshRef}>
        {/* ---------------- KAKI & SNEAKERS ---------------- */}
        {[-hipX, hipX].map((x, idx) => {
          const ref = idx === 0 ? leftLegRef : rightLegRef;
          const kneeRef = idx === 0 ? leftKneeRef : rightKneeRef;
          return (
            <group key={`leg-${idx}`} ref={ref} position={[x, 0.82, 0]}>
              {/* Paha */}
              <mesh position={[0, -0.19, 0]} castShadow>
                <cylinderGeometry
                  args={[
                    isFemale ? 0.06 : 0.068,
                    isFemale ? 0.048 : 0.054,
                    0.38,
                    16,
                  ]}
                />
                {hasSkirt ? skinMat : pantsMat}
              </mesh>
              {/* Sendi Lutut -> Betis & Sepatu (berporos di lutut agar bisa menekuk 90°) */}
              <group ref={kneeRef} position={[0, -0.38, 0]}>
                <mesh>
                  <sphereGeometry args={[isFemale ? 0.046 : 0.052, 12, 10]} />
                  {hasSkirt ? skinMat : pantsMat}
                </mesh>
                {/* Betis */}
                <mesh position={[0, -0.18, 0]} castShadow>
                  <cylinderGeometry
                    args={[
                      isFemale ? 0.046 : 0.052,
                      isFemale ? 0.036 : 0.042,
                      0.36,
                      16,
                    ]}
                  />
                  {hasSkirt ? skinMat : pantsMat}
                </mesh>
                {/* Kaus kaki tinggi untuk outfit rok */}
                {hasSkirt && (
                  <mesh position={[0, -0.28, 0]}>
                    <cylinderGeometry args={[0.04, 0.037, 0.15, 14]} />
                    {collarMat}
                  </mesh>
                )}
                {/* Kerah sepatu */}
                <mesh position={[0, -0.36, 0.01]}>
                  <cylinderGeometry args={[0.042, 0.046, 0.05, 14]} />
                  {shoeMat}
                </mesh>
                {/* Bodi sepatu sneakers */}
                <RoundedBox
                  args={[0.098, 0.062, 0.21]}
                  radius={0.026}
                  smoothness={4}
                  position={[0, -0.39, 0.038]}
                  castShadow
                >
                  {shoeMat}
                </RoundedBox>
                {/* Sol putih sneakers */}
                <RoundedBox
                  args={[0.106, 0.028, 0.222]}
                  radius={0.013}
                  smoothness={3}
                  position={[0, -0.425, 0.038]}
                  castShadow
                >
                  {soleMat}
                </RoundedBox>
              </group>
            </group>
          );
        })}

        {/* Pinggul / Rok A-line */}
        {hasSkirt ? (
          <mesh position={[0, 0.78, 0]} scale={[1.1, 1, 0.85]} castShadow>
            <cylinderGeometry args={[waistR + 0.005, 0.175, 0.28, 24]} />
            {pantsMat}
          </mesh>
        ) : (
          <mesh position={[0, 0.85, 0]} scale={[1.15, 0.85, 0.78]} castShadow>
            <cylinderGeometry args={[waistR, waistR + 0.008, 0.16, 20]} />
            {pantsMat}
          </mesh>
        )}

        {/* Sabuk & gesper metalik */}
        <mesh position={[0, 0.92, 0]} scale={[1.16, 1, 0.8]}>
          <cylinderGeometry args={[waistR + 0.004, waistR + 0.004, 0.028, 20]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.92, isFemale ? 0.095 : 0.114]}>
          <boxGeometry args={[0.034, 0.028, 0.012]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* ---------------- TORSO & OUTFIT ---------------- */}
        <mesh position={[0, 1.14, 0]} scale={[1.18, 1, 0.74]} castShadow>
          <cylinderGeometry args={[chestR, waistR, 0.44, 22]} />
          {shirtMat}
        </mesh>
        {/* Bahu atas membulat */}
        <mesh position={[0, 1.35, 0]} scale={[1.22, 0.48, 0.75]} castShadow>
          <sphereGeometry args={[chestR, 20, 12]} />
          {shirtMat}
        </mesh>

        {/* Layer inner kemeja/kaos di dada */}
        {(look.outfit === "blazer" ||
          look.outfit === "cardigan_skirt" ||
          look.outfit === "hijab_blazer" ||
          look.outfit === "jacket_skirt") && (
          <mesh position={[0, 1.2, 0.072]} scale={[0.75, 1, 0.55]}>
            <cylinderGeometry args={[0.07, 0.055, 0.34, 14]} />
            {innerMat}
          </mesh>
        )}

        {/* Kerah / Hoodie */}
        {look.outfit === "hoodie" ? (
          <>
            <mesh position={[0, 1.36, -0.045]} rotation={[0.45, 0, 0]} castShadow>
              <torusGeometry args={[0.09, 0.034, 12, 20]} />
              {shirtMat}
            </mesh>
            {[-0.03, 0.03].map((x) => (
              <mesh key={`lace-${x}`} position={[x, 1.28, 0.118]}>
                <cylinderGeometry args={[0.005, 0.005, 0.14, 8]} />
                {collarMat}
              </mesh>
            ))}
          </>
        ) : (
          <mesh position={[0, 1.385, 0.008]} scale={[1.04, 1, 0.88]}>
            <cylinderGeometry args={[0.065, 0.082, 0.045, 16]} />
            {collarMat}
          </mesh>
        )}

        {/* Lanyard & ID card karyawan */}
        {!isGuest && (
          <group>
            <mesh position={[0, 1.23, 0.122]}>
              <boxGeometry args={[0.011, 0.2, 0.008]} />
              <meshStandardMaterial color={accent} />
            </mesh>
            <RoundedBox
              args={[0.09, 0.12, 0.01]}
              radius={0.01}
              smoothness={2}
              position={[0, 1.05, 0.126]}
            >
              <meshStandardMaterial color="#ffffff" roughness={0.35} />
            </RoundedBox>
            <mesh position={[0, 1.1, 0.132]}>
              <boxGeometry args={[0.08, 0.028, 0.005]} />
              <meshStandardMaterial color={accent} />
            </mesh>
          </group>
        )}

        {/* ---------------- LENGAN & TANGAN ---------------- */}
        {[-shoulderX, shoulderX].map((x, idx) => {
          const ref = idx === 0 ? leftArmRef : rightArmRef;
          return (
            <group key={`arm-${idx}`} ref={ref} position={[x, 1.33, 0]}>
              <mesh position={[0, 0, 0]} castShadow>
                <sphereGeometry args={[isFemale ? 0.046 : 0.054, 14, 10]} />
                {shirtMat}
              </mesh>
              <mesh position={[0, -0.115, 0]} castShadow>
                <cylinderGeometry
                  args={[
                    isFemale ? 0.043 : 0.05,
                    isFemale ? 0.036 : 0.042,
                    0.23,
                    14,
                  ]}
                />
                {shirtMat}
              </mesh>
              <mesh position={[0, -0.23, 0]}>
                <sphereGeometry args={[isFemale ? 0.035 : 0.041, 10, 8]} />
                {shirtMat}
              </mesh>
              <mesh position={[0, -0.34, 0.012]} rotation={[-0.08, 0, 0]} castShadow>
                <cylinderGeometry
                  args={[
                    isFemale ? 0.035 : 0.041,
                    isFemale ? 0.028 : 0.033,
                    0.21,
                    14,
                  ]}
                />
                {shirtMat}
              </mesh>
              <mesh position={[0, -0.445, 0.02]}>
                <cylinderGeometry
                  args={[
                    isFemale ? 0.03 : 0.035,
                    isFemale ? 0.028 : 0.033,
                    0.024,
                    12,
                  ]}
                />
                {collarMat}
              </mesh>
              <RoundedBox
                args={[0.045, 0.078, 0.032]}
                radius={0.015}
                smoothness={4}
                position={[0, -0.498, 0.022]}
                castShadow
              >
                {skinMat}
              </RoundedBox>
            </group>
          );
        })}

        {/* ---------------- KEPALA & LEHER (PIVOT DI LEHER) ---------------- */}
        <mesh position={[0, 1.42, 0]}>
          <cylinderGeometry args={[0.046, 0.052, 0.11, 16]} />
          {skinMat}
        </mesh>

        <group ref={headGroupRef} position={[0, 1.44, 0]}>
          <group position={[0, 0.145, 0]}>
            {/* Kepala oval proporsional */}
            <mesh scale={HEAD_SCALE} castShadow>
              <sphereGeometry args={[HEAD_R, 26, 20]} />
              {skinMat}
            </mesh>
            <Hair look={look} />
            <Face look={look} eyesRef={eyesRef} />
          </group>
        </group>
      </group>

      {/* Bubble chat */}
      {bubbleMessage && (
        <Html
          position={[0, 2.55, 0]}
          center
          zIndexRange={[50, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="relative w-max max-w-[220px] rounded-2xl border border-slate-200/90 bg-white/95 px-3.5 py-2 text-center text-xs font-semibold text-slate-800 shadow-xl break-words select-none">
            {bubbleMessage}
            <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-200/90 bg-white" />
          </div>
        </Html>
      )}

      {/* Nama & role */}
      <Billboard position={[0, 2.18, 0]}>
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
