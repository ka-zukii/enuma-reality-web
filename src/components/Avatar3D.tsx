import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Html, Text } from "@react-three/drei";
import * as THREE from "three";
import { riderWorldPos, stepTramView, TRAM } from "@/lib/tramRuntime";
import { getStatusMeta } from "@/config/status";
import { type MemberRole } from "@/types";
import { getRoleMeta } from "@/lib/roles";
import { resolveAvatarPreset, useLocalAvatarId } from "@/config/avatars";
import { AVATAR_SCALE, ROLE_ACCENT, lerpAngle } from "@/components/avatar/constants";
import {
  RiggedCharacter,
  modelUrlForAvatar,
  type RigAnimation,
} from "@/components/avatar/RiggedCharacter";
import type { Avatar3DProps } from "@/components/avatar/types";

export function Avatar3D({
  userId,
  fullName,
  color: _color,
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
  const targetVec = useRef(new THREE.Vector3(...initialPosition));
  /** Dibaca RiggedCharacter tiap frame: "idle" | "walk" | "sit" */
  const animRef = useRef<RigAnimation>("idle");

  const localAvatarId = useLocalAvatarId();
  const effectiveAvatarId = isLocal ? (localAvatarId ?? avatarId) : avatarId;

  // Preset tetap dipakai untuk memilih karakter GLB (konsisten per user)
  const preset = useMemo(
    () => resolveAvatarPreset(effectiveAvatarId, userId),
    [effectiveAvatarId, userId],
  );
  const modelUrl = modelUrlForAvatar(preset.id);

  const roleKey: MemberRole = (role ?? "MEMBER") as MemberRole;
  const accent = ROLE_ACCENT[roleKey] ?? ROLE_ACCENT.MEMBER;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const tick = isLocal ? localStateRef?.current : remoteTicksRef?.current?.[userId];
    if (tick && Array.isArray(tick.position)) {
      targetVec.current.set(...tick.position);
    }

    // Rotasi: local lebih responsif, remote lebih halus (hindari snap)
    const rotAlpha = 1 - Math.exp(-(isLocal ? 18 : 10) * delta);

    // Penumpang trem (pemain lain): posisi dunia dihitung dari kabin trem
    if (!isLocal && tick?.ride) {
      stepTramView(state.clock.elapsedTime);
      const [x, z] = riderWorldPos(tick.ride.rx, tick.ride.rz);
      groupRef.current.position.set(x, TRAM.floorY, z);
    } else {
      // Posisi: local lebih cepat snap (player sendiri), remote lebih halus
      const posAlpha = 1 - Math.exp(-(isLocal ? 28 : 12) * delta);
      groupRef.current.position.lerp(targetVec.current, posAlpha);
    }
    if (tick) {
      groupRef.current.rotation.y = lerpAngle(groupRef.current.rotation.y, tick.rotationY, rotAlpha);
    }

    animRef.current = tick?.animation === "walk" ? "walk" : tick?.animation === "sit" ? "sit" : "idle";
  });

  const roleMeta = getRoleMeta(role);
  const roleText = jobTitle?.trim() || roleMeta.label;
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
        <circleGeometry args={[0.3, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.18} depthWrite={false} />
      </mesh>

      {/* Model GLB. key = modelUrl agar karakter dibuat ulang saat ganti avatar */}
      <Suspense fallback={null}>
        <RiggedCharacter key={modelUrl} modelUrl={modelUrl} animRef={animRef} />
      </Suspense>

      {/* Bubble chat */}
      {bubbleMessage && (
        <Html position={[0, 2.55, 0]} center zIndexRange={[50, 0]} style={{ pointerEvents: "none" }}>
          <div className="relative w-max max-w-55 rounded-2xl border border-slate-200/90 bg-white/95 px-3.5 py-2 text-center text-xs font-semibold text-slate-800 shadow-xl wrap-break-word select-none">
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