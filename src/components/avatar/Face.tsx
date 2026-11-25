import { type RefObject } from "react";
import * as THREE from "three";
import { type AvatarPreset } from "@/config/avatars";

// ---------------------------------------------------------------
// Wajah (koordinat lokal terhadap pusat kepala [0, 0.145, 0])
// Permukaan depan kepala: z ≈ 0.122 di tengah, z ≈ 0.112 di posisi mata (x=±0.044)
// ---------------------------------------------------------------
export function Face({
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
              args={[
                0.102,
                18,
                12,
                0,
                Math.PI * 2,
                Math.PI * 0.56,
                Math.PI * 0.4,
              ]}
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
