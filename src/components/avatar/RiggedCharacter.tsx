// src/components/avatar/RiggedCharacter.tsx
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

export interface CharacterOption {
  id: string;
  label: string;
  url: string;
}

export const CHARACTER_OPTIONS: CharacterOption[] = [
  { id: "char2", label: "Character 2", url: "/models/character2-walking.glb" },
  { id: "char3", label: "Character 3", url: "/models/character3-walking.glb" },
  { id: "char5", label: "Character 5", url: "/models/character5-walking.glb" },
];

// Tetap diekspor sebagai default agar import lama tidak error
export const RIG_MODEL_URL = CHARACTER_OPTIONS[1].url;

// Preload semua karakter sekaligus
CHARACTER_OPTIONS.forEach((char) => useGLTF.preload(char.url));

/**
 * Peta preset avatar (config/avatars.ts) -> file GLB.
 * Ubah sesuai selera: karakter mana untuk preset mana.
 */
const AVATAR_MODEL: Record<string, string> = {
  male_1: CHARACTER_OPTIONS[1].url,
  male_2: CHARACTER_OPTIONS[2].url,
  male_3: CHARACTER_OPTIONS[2].url,
  female_1: CHARACTER_OPTIONS[0].url,
  female_2: CHARACTER_OPTIONS[0].url,
  female_3: CHARACTER_OPTIONS[0].url,
};

export function modelUrlForAvatar(avatarId?: string | null): string {
  return (avatarId && AVATAR_MODEL[avatarId]) || RIG_MODEL_URL;
}

export type RigAnimation = "idle" | "walk" | "sit";

export interface WalkTuning {
  /** Kecepatan animasi. 7 = kecepatan asli dari Blender. */
  speed: number;
}

export const DEFAULT_TUNING: WalkTuning = { speed: 7 };

/** Kecepatan asli animasi, dipakai sebagai acuan timeScale */
const BASE_SPEED = 7;
/** Durasi transisi antar pose (detik) */
const FADE = 0.25;
/** 1 = putar animasi maju normal */
const WALK_DIR = 1;
/** Seberapa jauh lengan melebar ke samping saat diam (0 = lurus ke bawah) */
const ARM_OUT = 0.15;

/** Tinggi karakter yang diinginkan (satuan lokal Avatar3D, sebelum AVATAR_SCALE). Kepala lama ≈ 1.72 */
export const TARGET_HEIGHT = 1.72;
/** Tinggi sendi pinggul saat duduk (satuan lokal Avatar3D). Sama dengan avatar lama: 0.82 - 0.21 */
const SIT_HIP_Y = 0.61;
/** Geser model ke belakang saat duduk agar punggung menempel sandaran (satuan lokal) */
const SIT_Z = -0.04;
/** Paha sedikit turun ke arah lutut saat duduk (0 = rata horizontal) */
const SIT_THIGH_DROP = 0.12;

export interface RiggedCharacterProps {
  modelUrl?: string;
  /** Cara baru (dipakai Avatar3D): state animasi dibaca tiap frame */
  animRef?: { current: RigAnimation };
  /** Cara lama (dipakai preview.tsx) */
  walking?: boolean;
  walkRef?: { current: boolean };
  tuning?: WalkTuning;
  flip?: boolean;
  showSkeleton?: boolean;
  targetHeight?: number;
}

/** Cari tulang berdasarkan akhiran nama, misalnya "LeftArm" */
function findBone(bones: Map<string, THREE.Bone>, base: string): THREE.Bone | undefined {
  for (const b of bones.values()) {
    if (b.name.endsWith(base)) return b;
  }
  return undefined;
}

/** Hitung rata-rata quaternion dari sebuah track agar arah hadap netral tanpa sisa ayunan langkah */
function averageTrackQuaternion(track: THREE.KeyframeTrack): THREE.Quaternion {
  const v = track.values;
  const count = v.length / 4;
  const sum = new THREE.Vector4(0, 0, 0, 0);
  const first = new THREE.Vector4(v[0], v[1], v[2], v[3]);

  for (let i = 0; i < count; i++) {
    const idx = i * 4;
    let x = v[idx];
    let y = v[idx + 1];
    let z = v[idx + 2];
    let w = v[idx + 3];

    if (x * first.x + y * first.y + z * first.z + w * first.w < 0) {
      x = -x;
      y = -y;
      z = -z;
      w = -w;
    }

    sum.x += x;
    sum.y += y;
    sum.z += z;
    sum.w += w;
  }

  return new THREE.Quaternion(sum.x, sum.y, sum.z, sum.w).normalize();
}

/**
 * Putar `bone` (di ruang dunia) sehingga arah bone -> child menunjuk ke `target`.
 * Hasilnya langsung ditulis ke bone.quaternion dan dikembalikan.
 */
function aimBone(bone: THREE.Bone, child: THREE.Object3D, target: THREE.Vector3): THREE.Quaternion {
  bone.updateWorldMatrix(true, false);
  child.updateWorldMatrix(true, false);
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  bone.getWorldPosition(p0);
  child.getWorldPosition(p1);
  const dir = p1.sub(p0).normalize();

  const dq = new THREE.Quaternion().setFromUnitVectors(dir, target.clone().normalize());
  const pw = new THREE.Quaternion();
  if (bone.parent) bone.parent.getWorldQuaternion(pw);
  const q = pw.clone().invert().multiply(dq).multiply(pw).multiply(bone.quaternion);
  bone.quaternion.copy(q);
  bone.updateMatrixWorld(true);
  return q.clone();
}

export function RiggedCharacter({
  modelUrl = RIG_MODEL_URL,
  animRef,
  walking = false,
  walkRef,
  tuning = DEFAULT_TUNING,
  flip = false,
  showSkeleton = false,
  targetHeight = TARGET_HEIGHT,
}: RiggedCharacterProps) {
  const gltf = useGLTF(modelUrl);

  const built = useMemo(() => {
    const root = clone(gltf.scene) as THREE.Group;

    root.traverse((o) => {
      if ((o as THREE.SkinnedMesh).isSkinnedMesh) {
        const sm = o as THREE.SkinnedMesh;
        sm.frustumCulled = false;
        sm.castShadow = true;
        sm.receiveShadow = true;
      }
    });
    root.updateMatrixWorld(true);

    const bones = new Map<string, THREE.Bone>();
    root.traverse((o) => {
      if ((o as THREE.Bone).isBone) bones.set(o.name, o as THREE.Bone);
    });

    // ---- Pose diam: lengan diturunkan lurus ke bawah dari T-pose ----
    const idleOverride = new Map<string, THREE.Quaternion>();
    for (const side of ["LeftArm", "RightArm"]) {
      const arm = findBone(bones, side);
      const fore = findBone(bones, side.replace("Arm", "ForeArm"));
      if (!arm || !fore || !arm.parent) continue;

      const p0 = new THREE.Vector3();
      const p1 = new THREE.Vector3();
      arm.getWorldPosition(p0);
      fore.getWorldPosition(p1);
      const dir = p1.clone().sub(p0).normalize();

      const outward = Math.sign(dir.x) || 1;
      const target = new THREE.Vector3(outward * ARM_OUT, -1, 0).normalize();

      const dq = new THREE.Quaternion().setFromUnitVectors(dir, target);
      const pw = new THREE.Quaternion();
      arm.parent.getWorldQuaternion(pw);
      const restLocal = arm.quaternion.clone();
      const idleQ = pw.clone().invert().multiply(dq).multiply(pw).multiply(restLocal);
      idleOverride.set(arm.name, idleQ);
    }

    // ---- Clip jalan: buang gerak maju akar (Hips) ----
    const src = gltf.animations[0];
    const tracks = src
      ? src.tracks.filter(
          (t) => !(t.name.toLowerCase().includes("hips") && t.name.endsWith(".position")),
        )
      : [];
    const walkClip = new THREE.AnimationClip("walk", src?.duration ?? 1, tracks);

    // Samakan arah hadap tulang akar (Hips) saat idle dengan orientasi rata-rata di walkClip
    const animatedNodes = new Set(tracks.map((t) => t.name.slice(0, t.name.lastIndexOf("."))));
    for (const t of tracks) {
      const dot = t.name.lastIndexOf(".");
      const node = t.name.slice(0, dot);
      const prop = t.name.slice(dot + 1);
      if (prop !== "quaternion") continue;

      const bone = bones.get(node);
      if (bone && (!bone.parent || !animatedNodes.has(bone.parent.name))) {
        idleOverride.set(node, averageTrackQuaternion(t));
      }
    }

    // ---- Pose duduk: dihitung di atas pose diam ----
    const sitOverride = new Map(idleOverride);
    let hipWorldY: number | null = null;
    {
      const restQuats = new Map<string, THREE.Quaternion>();
      for (const [name, bone] of bones) restQuats.set(name, bone.quaternion.clone());
      for (const [name, q] of idleOverride) bones.get(name)?.quaternion.copy(q);
      root.updateMatrixWorld(true);

      let ok = true;
      for (const side of ["Left", "Right"]) {
        const up = findBone(bones, `${side}UpLeg`);
        const leg = findBone(bones, `${side}Leg`);
        const foot = findBone(bones, `${side}Foot`);
        if (!up || !leg || !foot) {
          ok = false;
          continue;
        }
        if (hipWorldY === null) {
          const p = new THREE.Vector3();
          up.getWorldPosition(p);
          hipWorldY = p.y;
        }
        // Simpan orientasi dunia telapak kaki agar tetap rata di lantai
        const footWorld = new THREE.Quaternion();
        foot.getWorldQuaternion(footWorld);

        // Paha ke depan (+Z), betis ke bawah
        sitOverride.set(up.name, aimBone(up, leg, new THREE.Vector3(0, -SIT_THIGH_DROP, 1)));
        sitOverride.set(leg.name, aimBone(leg, foot, new THREE.Vector3(0, -1, 0)));

        const pw = new THREE.Quaternion();
        foot.parent?.getWorldQuaternion(pw);
        const footLocal = pw.invert().multiply(footWorld);
        foot.quaternion.copy(footLocal);
        foot.updateMatrixWorld(true);
        sitOverride.set(foot.name, footLocal.clone());
      }
      if (!ok) console.warn("[RiggedCharacter] tulang kaki (UpLeg/Leg/Foot) tidak lengkap, pose duduk dilewati.");

      // Kembalikan pose asli
      for (const [name, q] of restQuats) bones.get(name)?.quaternion.copy(q);
      root.updateMatrixWorld(true);
    }

    // ---- Clip statis (idle / sit) dari override quaternion ----
    const makeStaticClip = (name: string, overrides: Map<string, THREE.Quaternion>) => {
      const out: THREE.KeyframeTrack[] = [];
      for (const t of tracks) {
        const dot = t.name.lastIndexOf(".");
        const node = t.name.slice(0, dot);
        const prop = t.name.slice(dot + 1);
        const bone = bones.get(node);
        if (!bone) continue;

        if (prop === "quaternion") {
          const q = overrides.get(node) ?? bone.quaternion;
          out.push(new THREE.QuaternionKeyframeTrack(t.name, [0, 1], [...q.toArray(), ...q.toArray()]));
        } else if (prop === "position") {
          const p = bone.position;
          out.push(new THREE.VectorKeyframeTrack(t.name, [0, 1], [...p.toArray(), ...p.toArray()]));
        } else if (prop === "scale") {
          out.push(new THREE.VectorKeyframeTrack(t.name, [0, 1], [1, 1, 1, 1, 1, 1]));
        }
      }
      return new THREE.AnimationClip(name, 1, out);
    };

    const mixer = new THREE.AnimationMixer(root);
    const actions: Record<RigAnimation, THREE.AnimationAction> = {
      walk: mixer.clipAction(walkClip),
      idle: mixer.clipAction(makeStaticClip("idle", idleOverride)),
      sit: mixer.clipAction(makeStaticClip("sit", sitOverride)),
    };
    actions.walk.setLoop(THREE.LoopRepeat, Infinity);
    actions.idle.setLoop(THREE.LoopRepeat, Infinity);
    actions.sit.setLoop(THREE.LoopRepeat, Infinity);
    actions.idle.play();

    // ---- Pusatkan model: x dan z di tengah, telapak kaki di y = 0 ----
    const box = new THREE.Box3().setFromObject(root);
    const c = box.getCenter(new THREE.Vector3());
    const height = Math.max(box.max.y - box.min.y, 1e-4);
    root.position.set(-c.x, -box.min.y, -c.z);

    // Skala agar tingginya sama dengan avatar lama, lalu hitung turunnya badan saat duduk
    const fit = targetHeight / height;
    const hipY = hipWorldY !== null ? (hipWorldY - box.min.y) * fit : 0.82;
    const sitDrop = Math.max(0, hipY - SIT_HIP_Y);

    return { scene: root, mixer, actions, fit, sitDrop };
  }, [gltf, targetHeight]);

  const { scene, mixer, actions, fit, sitDrop } = built;

  const helper = useMemo(() => (showSkeleton ? new THREE.SkeletonHelper(scene) : null), [scene, showSkeleton]);

  const offsetRef = useRef<THREE.Group>(null);
  const stateRef = useRef<RigAnimation>("idle");

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const want: RigAnimation = animRef
      ? animRef.current
      : (walkRef ? walkRef.current : walking)
        ? "walk"
        : "idle";

    if (want !== stateRef.current) {
      const prev = actions[stateRef.current];
      const next = actions[want];
      stateRef.current = want;
      next.reset().setEffectiveWeight(1).play();
      prev.crossFadeTo(next, FADE, false);
    }

    actions.walk.timeScale = (WALK_DIR * tuning.speed) / BASE_SPEED;
    mixer.update(dt);

    // Turunkan badan ke dudukan saat duduk, naik lagi saat berdiri
    const g = offsetRef.current;
    if (g) {
      const sitting = want === "sit";
      const a = 1 - Math.exp(-14 * dt);
      g.position.y += ((sitting ? -sitDrop : 0) - g.position.y) * a;
      g.position.z += ((sitting ? SIT_Z : 0) - g.position.z) * a;
    }
  });

  return (
    <group rotation={[0, flip ? Math.PI : 0, 0]}>
      <group ref={offsetRef}>
        <group scale={fit}>
          <primitive object={scene} />
          {helper && <primitive object={helper} />}
        </group>
      </group>
    </group>
  );
}