// src/preview.tsx
import { createRoot } from "react-dom/client";
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  CHARACTER_OPTIONS,
  DEFAULT_TUNING,
  RIG_MODEL_URL,
  RiggedCharacter,
  type WalkTuning,
} from "@/components/avatar/RiggedCharacter";

type KeyState = Record<string, boolean>;

/** Catat tombol yang sedang ditekan */
function useKeys() {
  const keys = useRef<KeyState>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    const blur = () => {
      keys.current = {};
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  return keys;
}

/** Selisih sudut terpendek, hasil dalam rentang -π sampai π */
const wrapAngle = (a: number) =>
  ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;

interface PlayerProps {
  modelUrl: string;
  keys: { current: KeyState };
  walkRef: { current: boolean };
  controlsRef: { current: any };
  autoWalk: boolean;
  moveSpeed: number;
  resetSignal: number;
  turnSignal: number;
  tuning: WalkTuning;
  showSkeleton: boolean;
}

function Player({
  modelUrl,
  keys,
  walkRef,
  controlsRef,
  autoWalk,
  moveSpeed,
  resetSignal,
  turnSignal,
  tuning,
  showSkeleton,
}: PlayerProps) {
  const group = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(0, 0, 0));
  // Mulai menghadap -Z (searah kamera awal) agar tidak langsung balik badan saat pencet W
  const yaw = useRef(Math.PI);

  // Reset posisi saat tombol ditekan
  useEffect(() => {
    pos.current.set(0, 0, 0);
    yaw.current = Math.PI;
  }, [resetSignal]);

  // Putar hadap karakter 180° tanpa merusak sumbu depan model
  useEffect(() => {
    if (turnSignal === 0) return;
    yaw.current = wrapAngle(yaw.current + Math.PI);
  }, [turnSignal]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const k = keys.current;
    const cam = state.camera;

    // Arah maju dan kanan relatif ke kamera (di bidang datar)
    const fwd = new THREE.Vector3();
    cam.getWorldDirection(fwd);
    fwd.y = 0;
    if (fwd.lengthSq() > 1e-6) fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    if (k.KeyW || k.ArrowUp) move.add(fwd);
    if (k.KeyS || k.ArrowDown) move.sub(fwd);
    if (k.KeyD || k.ArrowRight) move.add(right);
    if (k.KeyA || k.ArrowLeft) move.sub(right);

    const moving = move.lengthSq() > 1e-4;
    walkRef.current = moving || autoWalk;

    if (moving) {
      move.normalize();
      pos.current.addScaledVector(move, moveSpeed * dt);
      // Karakter menghadap arah gerak, dengan putaran halus
      const target = Math.atan2(move.x, move.z);
      yaw.current += wrapAngle(target - yaw.current) * Math.min(1, dt * 10);
    }

    if (group.current) {
      group.current.position.copy(pos.current);
      group.current.rotation.y = yaw.current;
    }

    // Kamera ikut bergerak bersama karakter
    const ctrl = controlsRef.current;
    if (ctrl) {
      const before = ctrl.target.clone();
      const goal = new THREE.Vector3(pos.current.x, 1.0, pos.current.z);
      ctrl.target.lerp(goal, 1 - Math.exp(-6 * dt));
      cam.position.add(ctrl.target.clone().sub(before));
      ctrl.update();
    }
  });

  return (
    <group ref={group}>
      <RiggedCharacter
        key={modelUrl}
        modelUrl={modelUrl}
        walkRef={walkRef}
        tuning={tuning}
        flip={false}
        showSkeleton={showSkeleton}
      />
    </group>
  );
}

function Viewer() {
  const [modelUrl, setModelUrl] = useState<string>(RIG_MODEL_URL);
  const [autoWalk, setAutoWalk] = useState(false);
  const [skel, setSkel] = useState(false);
  const [tuning, setTuning] = useState<WalkTuning>(DEFAULT_TUNING);
  const [moveSpeed, setMoveSpeed] = useState(1.5);
  const [resetSignal, setResetSignal] = useState(0);
  const [turnSignal, setTurnSignal] = useState(0);

  const keys = useKeys();
  const walkRef = useRef(false);
  const controlsRef = useRef<any>(null);

  const currentIndex = CHARACTER_OPTIONS.findIndex((c) => c.url === modelUrl);

  const cycleCharacter = (dir: -1 | 1) => {
    const base = currentIndex === -1 ? 0 : currentIndex;
    const next = (base + dir + CHARACTER_OPTIONS.length) % CHARACTER_OPTIONS.length;
    setModelUrl(CHARACTER_OPTIONS[next].url);
  };

  const btn: React.CSSProperties = {
    padding: "6px 10px",
    cursor: "pointer",
    marginRight: 6,
    marginBottom: 6,
  };

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative", background: "#e9edf2" }}>
      <div
        style={{
          position: "absolute",
          zIndex: 1,
          top: 12,
          left: 12,
          background: "rgba(255,255,255,0.92)",
          padding: 12,
          borderRadius: 8,
          width: 300,
          fontFamily: "sans-serif",
          fontSize: 13,
        }}
      >
        <div style={{ marginBottom: 8, color: "#334155" }}>
          <b>WASD</b>: jalan (relatif ke kamera). Seret untuk memutar kamera, scroll untuk zoom.
        </div>

        {/* Pilihan Karakter */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: "#1e293b" }}>Karakter</div>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              type="button"
              onClick={() => cycleCharacter(-1)}
              style={{ padding: "5px 8px", cursor: "pointer" }}
              title="Karakter sebelumnya"
            >
              ‹
            </button>
            <select
              value={modelUrl}
              onChange={(e) => {
                setModelUrl(e.target.value);
                e.currentTarget.blur();
              }}
              style={{
                flex: 1,
                padding: "5px 6px",
                borderRadius: 4,
                border: "1px solid #cbd5e1",
                background: "#fff",
              }}
            >
              {CHARACTER_OPTIONS.map((char) => (
                <option key={char.url} value={char.url}>
                  {char.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => cycleCharacter(1)}
              style={{ padding: "5px 8px", cursor: "pointer" }}
              title="Karakter berikutnya"
            >
              ›
            </button>
          </div>
        </div>

        <div>
          <button style={btn} onClick={() => setAutoWalk((w) => !w)}>
            {autoWalk ? "Berhenti di tempat" : "Jalan di tempat"}
          </button>
          <button style={btn} onClick={() => setTurnSignal((t) => t + 1)}>
            Putar 180°
          </button>
          <button style={btn} onClick={() => setSkel((s) => !s)}>
            {skel ? "Sembunyikan tulang" : "Tampilkan tulang"}
          </button>
          <button style={btn} onClick={() => setResetSignal((r) => r + 1)}>
            Reset posisi
          </button>
        </div>

        <label style={{ display: "block", marginTop: 8 }}>
          Kecepatan gerak: {moveSpeed.toFixed(2)}
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.05}
            value={moveSpeed}
            onChange={(e) => setMoveSpeed(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </label>

        <label style={{ display: "block", marginTop: 8 }}>
          Kecepatan animasi: {tuning.speed.toFixed(2)}
          <input
            type="range"
            min={2}
            max={14}
            step={0.1}
            value={tuning.speed}
            onChange={(e) => setTuning({ speed: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </label>

        <button style={{ ...btn, marginTop: 8 }} onClick={() => setTuning(DEFAULT_TUNING)}>
          Reset kecepatan
        </button>
      </div>

      <Canvas camera={{ position: [0, 1.6, 4], fov: 35 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 4, 3]} intensity={1.2} />
        <gridHelper args={[30, 30, "#94a3b8", "#cbd5e1"]} />
        <Suspense fallback={null}>
          <Player
            modelUrl={modelUrl}
            keys={keys}
            walkRef={walkRef}
            controlsRef={controlsRef}
            autoWalk={autoWalk}
            moveSpeed={moveSpeed}
            resetSignal={resetSignal}
            turnSignal={turnSignal}
            tuning={tuning}
            showSkeleton={skel}
          />
        </Suspense>
        <OrbitControls ref={controlsRef} makeDefault target={[0, 1, 0]} enableDamping />
      </Canvas>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Viewer />);