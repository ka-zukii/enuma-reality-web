import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NpcFigure } from "@/components/NpcFigure";
import { createNpcPose, readNpcPose } from "@/lib/npcRuntime";

/* ============================================================
 * PESEPEDA KOTA
 * Posisi dikirim server ("cyclist-0", "cyclist-1"). Putaran roda
 * tetap dihitung di client karena hanya kosmetik.
 * ============================================================ */
const pose = createNpcPose();

export function CityCyclists() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const wheels = useRef<(THREE.Group | null)[]>([]);

  useFrame(() => {
    [0, 1].forEach((i) => {
      const g = refs.current[i];
      if (!g || !readNpcPose(`cyclist-${i}`, pose)) return;
      g.position.set(pose.x, 0, pose.z);
      g.rotation.y = pose.yaw;
      for (let k = 0; k < 2; k++) {
        const w = wheels.current[i * 2 + k];
        if (w) w.rotation.x += 0.18;
      }
    });
  });

  return (
    <group>
      {[
        { shirt: "#0ea5e9", bike: "#ef4444" },
        { shirt: "#22c55e", bike: "#f59e0b" },
      ].map((c, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          {/* Roda depan & belakang sejajar arah laju sepeda (bidang YZ, poros X) */}
          {[0.45, -0.45].map((z, k) => (
            <group
              key={k}
              ref={(el) => {
                wheels.current[i * 2 + k] = el;
              }}
              position={[0, 0.28, z]}
            >
              <mesh rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.26, 0.04, 8, 16]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              {/* Jari-jari agar putaran roda terlihat jelas */}
              <mesh>
                <boxGeometry args={[0.02, 0.46, 0.025]} />
                <meshStandardMaterial color="#cbd5e1" />
              </mesh>
              <mesh>
                <boxGeometry args={[0.02, 0.025, 0.46]} />
                <meshStandardMaterial color="#cbd5e1" />
              </mesh>
            </group>
          ))}
          {/* Rangka sepeda & stang */}
          <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
            <meshStandardMaterial color={c.bike} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.72, 0.38]}>
            <boxGeometry args={[0.42, 0.04, 0.04]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          {/* Pengendara */}
          <group position={[0, 0.12, -0.05]}>
            <NpcFigure
              sitting
              scale={0.78}
              look={{
                shirt: c.shirt,
                pants: "#1e293b",
                skin: "#f5c28b",
                hair: "#1e1b18",
                hairStyle: 0,
              }}
            />
          </group>
        </group>
      ))}
    </group>
  );
}
