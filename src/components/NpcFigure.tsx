import type { Ref } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";

export interface NpcAppearance {
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
  shoe?: string;
  hairStyle?: 0 | 1 | 2; // 0 pendek, 1 panjang, 2 sanggul
}

interface NpcFigureProps {
  look: NpcAppearance;
  scale?: number;
  sitting?: boolean;
  leftLegRef?: Ref<THREE.Group>;
  rightLegRef?: Ref<THREE.Group>;
  leftArmRef?: Ref<THREE.Group>;
  rightArmRef?: Ref<THREE.Group>;
}

/**
 * Karakter NPC 3D proporsional (dipakai di trotoar kota dan interior gedung).
 */
export function NpcFigure({
  look,
  scale = 0.84,
  sitting = false,
  leftLegRef,
  rightLegRef,
  leftArmRef,
  rightArmRef,
}: NpcFigureProps) {
  const hairStyle = look.hairStyle ?? 0;
  const shoeColor = look.shoe ?? "#1f2937";

  const shirtMat = <meshStandardMaterial color={look.shirt} roughness={0.55} />;
  const pantsMat = <meshStandardMaterial color={look.pants} roughness={0.72} />;
  const skinMat = <meshStandardMaterial color={look.skin} roughness={0.5} />;
  const hairMat = <meshStandardMaterial color={look.hair} roughness={0.7} />;
  const shoeMat = <meshStandardMaterial color={shoeColor} roughness={0.45} />;
  const soleMat = <meshStandardMaterial color="#f8fafc" roughness={0.5} />;

  const hipRotX = sitting ? -Math.PI / 2 : 0;
  const kneeRotX = sitting ? Math.PI / 2 : 0;
  const armRotX = sitting ? -0.45 : 0;

  return (
    <group scale={scale} position={[0, sitting ? -0.21 * scale : 0, 0]}>
      {/* Kaki kiri */}
      <group ref={leftLegRef} position={[-0.08, 0.82, 0]} rotation={[hipRotX, 0, 0]}>
        <mesh position={[0, -0.19, 0]} castShadow>
          <cylinderGeometry args={[0.064, 0.052, 0.38, 12]} />
          {pantsMat}
        </mesh>
        <group position={[0, -0.38, 0]} rotation={[kneeRotX, 0, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.052, 0.04, 0.36, 12]} />
            {pantsMat}
          </mesh>
          <RoundedBox
            args={[0.095, 0.058, 0.2]}
            radius={0.024}
            smoothness={3}
            position={[0, -0.39, 0.035]}
            castShadow
          >
            {shoeMat}
          </RoundedBox>
          <RoundedBox
            args={[0.102, 0.026, 0.212]}
            radius={0.012}
            smoothness={2}
            position={[0, -0.425, 0.035]}
          >
            {soleMat}
          </RoundedBox>
        </group>
      </group>

      {/* Kaki kanan */}
      <group ref={rightLegRef} position={[0.08, 0.82, 0]} rotation={[hipRotX, 0, 0]}>
        <mesh position={[0, -0.19, 0]} castShadow>
          <cylinderGeometry args={[0.064, 0.052, 0.38, 12]} />
          {pantsMat}
        </mesh>
        <group position={[0, -0.38, 0]} rotation={[kneeRotX, 0, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.052, 0.04, 0.36, 12]} />
            {pantsMat}
          </mesh>
          <RoundedBox
            args={[0.095, 0.058, 0.2]}
            radius={0.024}
            smoothness={3}
            position={[0, -0.39, 0.035]}
            castShadow
          >
            {shoeMat}
          </RoundedBox>
          <RoundedBox
            args={[0.102, 0.026, 0.212]}
            radius={0.012}
            smoothness={2}
            position={[0, -0.425, 0.035]}
          >
            {soleMat}
          </RoundedBox>
        </group>
      </group>

      {/* Pinggul */}
      <mesh position={[0, 0.85, 0]} scale={[1.15, 0.85, 0.78]} castShadow>
        <cylinderGeometry args={[0.132, 0.14, 0.16, 16]} />
        {pantsMat}
      </mesh>

      {/* Torso */}
      <mesh position={[0, 1.14, 0]} scale={[1.18, 1, 0.74]} castShadow>
        <cylinderGeometry args={[0.162, 0.132, 0.44, 18]} />
        {shirtMat}
      </mesh>
      <mesh position={[0, 1.35, 0]} scale={[1.22, 0.48, 0.75]} castShadow>
        <sphereGeometry args={[0.162, 16, 10]} />
        {shirtMat}
      </mesh>
      {/* Kerah putih */}
      <mesh position={[0, 1.385, 0.008]} scale={[1.04, 1, 0.88]}>
        <cylinderGeometry args={[0.062, 0.078, 0.042, 14]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.45} />
      </mesh>

      {/* Lengan kiri */}
      <group ref={leftArmRef} position={[-0.208, 1.33, 0]} rotation={[armRotX, 0, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.05, 10, 8]} />
          {shirtMat}
        </mesh>
        <mesh position={[0, -0.12, 0]} castShadow>
          <cylinderGeometry args={[0.046, 0.038, 0.23, 10]} />
          {shirtMat}
        </mesh>
        <mesh position={[0, -0.34, 0.01]} rotation={[-0.08, 0, 0]} castShadow>
          <cylinderGeometry args={[0.038, 0.03, 0.21, 10]} />
          {shirtMat}
        </mesh>
        <RoundedBox
          args={[0.042, 0.072, 0.03]}
          radius={0.014}
          smoothness={3}
          position={[0, -0.485, 0.018]}
          castShadow
        >
          {skinMat}
        </RoundedBox>
      </group>

      {/* Lengan kanan */}
      <group ref={rightArmRef} position={[0.208, 1.33, 0]} rotation={[armRotX, 0, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.05, 10, 8]} />
          {shirtMat}
        </mesh>
        <mesh position={[0, -0.12, 0]} castShadow>
          <cylinderGeometry args={[0.046, 0.038, 0.23, 10]} />
          {shirtMat}
        </mesh>
        <mesh position={[0, -0.34, 0.01]} rotation={[-0.08, 0, 0]} castShadow>
          <cylinderGeometry args={[0.038, 0.03, 0.21, 10]} />
          {shirtMat}
        </mesh>
        <RoundedBox
          args={[0.042, 0.072, 0.03]}
          radius={0.014}
          smoothness={3}
          position={[0, -0.485, 0.018]}
          castShadow
        >
          {skinMat}
        </RoundedBox>
      </group>

      {/* Leher & Kepala */}
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.044, 0.05, 0.11, 12]} />
        {skinMat}
      </mesh>
      <group position={[0, 1.585, 0]}>
        <mesh scale={[0.92, 1.06, 0.94]} castShadow>
          <sphereGeometry args={[0.126, 20, 16]} />
          {skinMat}
        </mesh>

        {/* Mata */}
        {[-0.042, 0.042].map((x) => (
          <group key={`eye-${x}`} position={[x, 0.01, 0.11]}>
            <mesh scale={[1.05, 1.02, 0.5]}>
              <sphereGeometry args={[0.018, 10, 8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.006]}>
              <sphereGeometry args={[0.011, 8, 8]} />
              <meshStandardMaterial color="#0f172a" roughness={0.15} />
            </mesh>
            <mesh position={[0.004, 0.004, 0.014]}>
              <sphereGeometry args={[0.0035, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}

        {/* Alis */}
        {[-0.042, 0.042].map((x) => (
          <mesh key={`brow-${x}`} position={[x, 0.042, 0.108]}>
            <boxGeometry args={[0.032, 0.006, 0.008]} />
            {hairMat}
          </mesh>
        ))}

        {/* Mulut */}
        <mesh position={[0, -0.048, 0.11]}>
          <boxGeometry args={[0.032, 0.007, 0.008]} />
          <meshStandardMaterial color="#9f4a4a" />
        </mesh>

        {/* Rambut */}
        <mesh position={[0, 0.012, -0.01]} scale={[0.96, 1.08, 0.99]} castShadow>
          <sphereGeometry
            args={[0.132, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.56]}
          />
          {hairMat}
        </mesh>
        {hairStyle === 0 && (
          <RoundedBox
            args={[0.16, 0.048, 0.13]}
            radius={0.022}
            smoothness={3}
            position={[0, 0.1, 0.015]}
            rotation={[-0.15, 0, 0]}
          >
            {hairMat}
          </RoundedBox>
        )}
        {hairStyle === 1 && (
          <RoundedBox
            args={[0.23, 0.28, 0.095]}
            radius={0.04}
            smoothness={3}
            position={[0, -0.11, -0.072]}
          >
            {hairMat}
          </RoundedBox>
        )}
        {hairStyle === 2 && (
          <mesh position={[0, 0.125, -0.095]}>
            <sphereGeometry args={[0.055, 12, 10]} />
            {hairMat}
          </mesh>
        )}
      </group>
    </group>
  );
}
