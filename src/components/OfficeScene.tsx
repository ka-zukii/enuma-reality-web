import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Sky } from "@react-three/drei";
import { type Socket } from "socket.io-client";
import * as THREE from "three";
import { Avatar3D } from "@/components/Avatar3D";
import { GhostGroup } from "@/components/GhostGroup";
import { CityEnvironment } from "@/components/CityEnvironment";
import { InteriorEnvironment } from "@/components/interiors/InteriorEnvironment";
import { type MemberRole, type PlayerStatus, type RemotePlayer } from "@/types";
import { type PlayerTickData } from "@/hooks/useOfficeSocket";
import {
  BUILDINGS,
  CITY_OBSTACLES,
  PLAYER_RADIUS,
  type Box,
  type BuildingInfo,
  type InteriorConfig,
  type Vec3,
} from "@/config/buildings";
import type { CameraMode } from "@/config/camera";

interface OfficeSceneProps {
  socket: Socket | null;
  currentUser: {
    id: string;
    fullName: string;
    color: string;
    role?: MemberRole;
    jobTitle?: string | null;
    status?: PlayerStatus;
  };
  remotePlayers: RemotePlayer[];
  remoteTicksRef: RefObject<Record<string, PlayerTickData>>;
  bubbles: Record<string, string>;
  onZoneChange: (zone: string) => void;
  isChatFocused: boolean;
  onBuildingSelect?: (building: BuildingInfo) => void;
  /** Dipanggil dengan throttle (sekitar 6x per detik) saat posisi lokal berubah */
  onLocalPositionChange?: (pos: Vec3) => void;
  cameraMode: CameraMode;
  /** Mode pengamat (sebelum masuk): tanpa avatar lokal dan tanpa kontrol gerak */
  spectator?: boolean;
  /** Jika diisi, scene menjadi interior gedung, bukan kota */
  interior?: {
    config: InteriorConfig;
    onExit: () => void;
  };
}

const MOVE_SPEED = 6.0;
const EMIT_INTERVAL = 0.05; // 20Hz
const POS_REPORT_INTERVAL = 0.15;
/** Batas atas delta waktu. Saat frame turun, karakter tidak melompat jauh sekaligus. */
const MAX_DT = 1 / 30;
const DEFAULT_SPAWN: Vec3 = [0, 0, 3];
const CITY_BOUNDS = { minX: -37, maxX: 37, minZ: -25, maxZ: 27 };

const noop = () => {};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distXZ(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

/** Titik (x, z) dianggap menabrak jika berada di dalam kotak yang sudah diperbesar radius avatar */
function isBlocked(x: number, z: number, boxes: Box[]): boolean {
  for (const b of boxes) {
    if (
      x > b.minX - PLAYER_RADIUS &&
      x < b.maxX + PLAYER_RADIUS &&
      z > b.minZ - PLAYER_RADIUS &&
      z < b.maxZ + PLAYER_RADIUS
    ) {
      return true;
    }
  }
  return false;
}

function detectCityZone(x: number, z: number): string {
  for (const b of BUILDINGS) {
    const f = b.footprint;
    if (
      x >= f.x - f.w / 2 - 1 &&
      x <= f.x + f.w / 2 + 1 &&
      z >= f.z - f.d / 2 - 1 &&
      z <= f.z + f.d / 2 + 1
    ) {
      return b.key === "enuma-hq" ? "enuma-reality-hq" : b.key;
    }
  }
  if (x >= 4 && x <= 10 && z >= -18 && z <= 8) return "taman-kota";
  if (z >= 11 && z <= 17) return "jalan-selatan";
  if (z <= -19) return "jalan-utara";
  if (x <= -31) return "jalan-barat";
  if (x >= 31) return "jalan-timur";
  return "jalan-utama";
}

export function OfficeScene({
  socket,
  currentUser,
  remotePlayers,
  remoteTicksRef,
  bubbles,
  onZoneChange,
  isChatFocused,
  onBuildingSelect,
  onLocalPositionChange,
  cameraMode,
  spectator = false,
  interior,
}: OfficeSceneProps) {
  const isInterior = interior !== undefined;
  const bounds = interior ? interior.config.bounds : CITY_BOUNDS;
  const obstacles = interior ? interior.config.obstacles : CITY_OBSTACLES;
  const spawn: Vec3 = interior ? interior.config.spawn : DEFAULT_SPAWN;

  const localStateRef = useRef<PlayerTickData>({
    position: [spawn[0], spawn[1], spawn[2]],
    rotationY: 0,
    animation: "idle",
    zone: isInterior ? "interior" : "open-space",
  });

  // Selalu membaca interior terbaru tanpa membuat ulang useFrame
  const interiorRef = useRef(interior);
  interiorRef.current = interior;
  const exitTriggeredRef = useRef(false);

  const controlsRef = useRef<any>(null);
  const keysPressed = useRef<Record<string, boolean>>({});
  const emitTimer = useRef(0);
  const posReportTimer = useRef(0);
  /** Ringkasan state terakhir yang dikirim. Kosong = wajib kirim ulang. */
  const lastSentRef = useRef("");
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  const prevModeRef = useRef<CameraMode>(cameraMode);

  // Vektor yang dipakai ulang setiap frame. Tidak ada alokasi baru di dalam useFrame.
  const camTargetVec = useRef(new THREE.Vector3(spawn[0], 1.55, spawn[2]));
  const forwardVec = useRef(new THREE.Vector3());
  const rightVec = useRef(new THREE.Vector3());
  const upVec = useRef(new THREE.Vector3(0, 1, 0));
  const moveVec = useRef(new THREE.Vector3());
  const prevTargetVec = useRef(new THREE.Vector3());
  const deltaVec = useRef(new THREE.Vector3());
  const offsetVec = useRef(new THREE.Vector3());

  // Beri tahu HUD bahwa zona sekarang interior
  useEffect(() => {
    if (isInterior) onZoneChange("interior");
  }, [isInterior, onZoneChange]);

  // Setelah masuk, join ulang, atau pindah ruangan, server belum tahu state terbaru kita.
  // Kosongkan ringkasan agar frame berikutnya langsung mengirim state lengkap.
  useEffect(() => {
    if (!socket) return;
    const resync = () => {
      lastSentRef.current = "";
    };
    socket.on("room:state", resync);
    return () => {
      socket.off("room:state", resync);
    };
  }, [socket]);

  useEffect(() => {
    // Lepas semua tombol yang masih tertahan. keyup tidak terpanggil bila window
    // kehilangan fokus (alt-tab, klik ke iframe, layar terkunci), sehingga karakter
    // akan terus berjalan sendiri tanpa dilepas.
    const releaseAllKeys = () => {
      const keys = keysPressed.current;
      for (const code of Object.keys(keys)) keys[code] = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isChatFocused) return;
      keysPressed.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") releaseAllKeys();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", releaseAllKeys);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", releaseAllKeys);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isChatFocused]);

  // Saat chat diaktifkan, tombol gerak tidak boleh tersisa sebagai "tertekan"
  useEffect(() => {
    if (!isChatFocused) return;
    const keys = keysPressed.current;
    for (const code of Object.keys(keys)) keys[code] = false;
  }, [isChatFocused]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, MAX_DT);
    const keys = keysPressed.current;
    const camera = state.camera;

    // Arah depan kamera diproyeksikan ke bidang horizontal XZ
    const forward = forwardVec.current;
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    // Arah kanan kamera
    const right = rightVec.current
      .crossVectors(forward, upVec.current)
      .normalize();

    const moveDir = moveVec.current.set(0, 0, 0);

    if (!isChatFocused) {
      if (keys["KeyW"] || keys["ArrowUp"]) moveDir.add(forward);
      if (keys["KeyS"] || keys["ArrowDown"]) moveDir.sub(forward);
      if (keys["KeyD"] || keys["ArrowRight"]) moveDir.add(right);
      if (keys["KeyA"] || keys["ArrowLeft"]) moveDir.sub(right);
    }

    const isMoving = moveDir.lengthSq() > 0.0001;
    const current = localStateRef.current;

    if (isMoving) {
      moveDir.normalize();

      const [px, , pz] = current.position;
      const stepX = moveDir.x * MOVE_SPEED * delta;
      const stepZ = moveDir.z * MOVE_SPEED * delta;

      // Cek sumbu X dulu, jika menabrak batalkan X saja (tetap bisa bergerak di Z)
      let nextX = clamp(px + stepX, bounds.minX, bounds.maxX);
      if (isBlocked(nextX, pz, obstacles)) nextX = px;

      // Lalu sumbu Z, dengan X yang sudah diputuskan
      let nextZ = clamp(pz + stepZ, bounds.minZ, bounds.maxZ);
      if (isBlocked(nextX, nextZ, obstacles)) nextZ = pz;

      const didMove = nextX !== px || nextZ !== pz;
      const nextRot = Math.atan2(moveDir.x, moveDir.z);

      let zone = current.zone;
      if (!isInterior && didMove) {
        zone = detectCityZone(nextX, nextZ);
        if (zone !== current.zone) onZoneChange(zone);
      }

      localStateRef.current = {
        position: [nextX, 0, nextZ],
        rotationY: nextRot,
        animation: didMove ? "walk" : "idle",
        zone,
      };
    } else if (current.animation !== "idle") {
      localStateRef.current = { ...current, animation: "idle" };
    }

    const cur = localStateRef.current;

    // Pintu keluar interior: begitu pemain sampai di sana, kembali ke kota
    const activeInterior = interiorRef.current;
    if (activeInterior && !exitTriggeredRef.current) {
      const exit = activeInterior.config.exit;
      if (distXZ(cur.position, exit.position) <= exit.radius) {
        exitTriggeredRef.current = true;
        activeInterior.onExit();
      }
    }

    // Kamera follow pemain & deteksi First Person jika di-zoom mentok
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const offset = offsetVec.current;

      // Saat mode berganti, atur ulang posisi kamera terhadap karakter
      if (prevModeRef.current !== cameraMode) {
        offset.copy(camera.position).sub(controls.target);
        offset.y = 0;
        if (offset.lengthSq() < 1e-6) offset.set(0, 0, 1);
        offset.normalize();

        if (cameraMode === "first") {
          // Kamera menempel di kepala, arah pandang mengikuti arah kamera sebelumnya
          camera.position.copy(controls.target).addScaledVector(offset, 0.6);
          camera.position.y = controls.target.y + 0.1;
        } else if (prevModeRef.current === "first") {
          // Keluar dari orang pertama: mundur kembali
          camera.position.set(
            controls.target.x + offset.x * 10,
            controls.target.y + 7,
            controls.target.z + offset.z * 10,
          );
        }
        prevModeRef.current = cameraMode;
      }

      const dist = camera.position.distanceTo(controls.target);

      // Jika di-zoom sangat dekat (<= 1.25m), aktifkan First Person
      const enterFP = dist <= 1.25;
      if (enterFP !== isFirstPerson) {
        setIsFirstPerson(enterFP);
      }

      if (cameraMode === "follow" || enterFP) {
        // Ketinggian mata karakter manusia ~1.56m
        const targetEyeY = enterFP ? 1.56 : 1.2;
        camTargetVec.current.set(cur.position[0], targetEyeY, cur.position[2]);

        const prevTarget = prevTargetVec.current.copy(controls.target);
        controls.target.lerp(camTargetVec.current, 1 - Math.exp(-14 * delta));

        // Kamera ikut bergeser sebesar target, sehingga jarak kamera ke karakter tetap
        deltaVec.current.subVectors(controls.target, prevTarget);
        camera.position.add(deltaVec.current);
      }
      controls.update();
    }

    // Kirim koordinat ke server setiap 50ms (20Hz), HANYA bila ada perubahan.
    // Avatar yang diam tidak mengirim apa pun, sehingga server bisa mendeteksi pemain tidak aktif.
    emitTimer.current += delta;
    if (socket && emitTimer.current >= EMIT_INTERVAL) {
      emitTimer.current = 0;
      const snapshot = `${cur.position[0]},${cur.position[2]},${cur.rotationY},${cur.animation},${cur.zone}`;
      if (snapshot !== lastSentRef.current) {
        lastSentRef.current = snapshot;
        socket.emit("player:move", cur);
      }
    }

    // Laporkan posisi ke App dengan throttle (untuk popup masuk gedung)
    posReportTimer.current += delta;
    if (
      onLocalPositionChange &&
      posReportTimer.current >= POS_REPORT_INTERVAL
    ) {
      posReportTimer.current = 0;
      onLocalPositionChange([...cur.position] as Vec3);
    }
  });

  let environment: ReactNode;
  if (interior) {
    environment = <InteriorEnvironment config={interior.config} />;
  } else {
    environment = (
      <CityEnvironment onBuildingSelect={onBuildingSelect ?? noop} />
    );
  }

  return (
    <>
      <color attach="background" args={["#e2e8f0"]} />
      {!isInterior && (
        <Sky sunPosition={[100, 150, 80]} turbidity={0.1} rayleigh={0.5} />
      )}

      <ambientLight intensity={0.9} color="#ffffff" />
      <directionalLight
        position={[25, 45, 25]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={90}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />
      <hemisphereLight args={["#ffffff", "#cbd5e1", 0.6]} />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.07}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={cameraMode === "first" ? 0.6 : 0.3}
        maxDistance={cameraMode === "first" ? 0.6 : isInterior ? 14 : 48}
        enableZoom={cameraMode !== "first"}
        zoomSpeed={1.8}
        target={[spawn[0], 1.55, spawn[2]]}
      />

      {environment}

      {!spectator && (
        <Avatar3D
          userId={currentUser.id}
          fullName={currentUser.fullName}
          color={currentUser.color}
          initialPosition={spawn}
          isLocal={true}
          localStateRef={localStateRef}
          bubbleMessage={bubbles[currentUser.id]}
          isFirstPerson={isFirstPerson}
          role={currentUser.role}
          jobTitle={currentUser.jobTitle}
          status={currentUser.status}
        />
      )}

      {remotePlayers.map((player) => (
        <GhostGroup
          key={player.userId}
          dim={player.connectionState === "reconnecting"}
        >
          <Avatar3D
            userId={player.userId}
            fullName={player.fullName}
            color={player.avatarConfig?.color || "#3b82f6"}
            initialPosition={player.position}
            isLocal={false}
            remoteTicksRef={remoteTicksRef}
            bubbleMessage={bubbles[player.userId]}
            role={player.role}
            jobTitle={player.jobTitle}
            status={player.status}
          />
        </GhostGroup>
      ))}
    </>
  );
}
