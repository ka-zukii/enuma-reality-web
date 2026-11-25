import { RoundedBox } from "@react-three/drei";
import { type AvatarPreset } from "@/config/avatars";
import { HEAD_R } from "@/components/avatar/constants";

// ---------------------------------------------------------------
// Rambut & Hijab (koordinat lokal terhadap pusat kepala [0, 0.145, 0])
// ---------------------------------------------------------------
export function Hair({ look }: { look: AvatarPreset }) {
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
        <mesh
          position={[0, 0.005, -0.014]}
          scale={[1.01, 1.09, 1.03]}
          castShadow
        >
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
      <mesh
        position={[0, -0.005, -0.036]}
        scale={[0.93, 0.98, 0.85]}
        castShadow
      >
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
