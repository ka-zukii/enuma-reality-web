import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { playerPos } from "@/lib/playerPosition";
import { useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { type Socket } from "socket.io-client";
import * as THREE from "three";
import { Avatar3D } from "@/components/Avatar3D";
import { GhostGroup } from "@/components/GhostGroup";
import { CityEnvironment } from "@/components/CityEnvironment";
import { InteriorEnvironment } from "@/components/interiors/InteriorEnvironment";
import { WorldLighting, type TimeMode } from "@/components/WorldLighting";
import type { WeatherOverride } from "@/components/RainEffect";
import { type MemberRole, type PlayerStatus, type RemotePlayer } from "@/types";
import { type PlayerTickData } from "@/hooks/useOfficeSocket";
import {
  BUILDINGS,
  CITY_OBSTACLES,
  PLAYER_RADIUS,
  type Box,
  type BuildingInfo,
  type InteriorConfig,
  type StairsConfig,
  type Vec3,
} from "@/config/buildings";
import type { CameraMode } from "@/config/camera";
import {
  TRAM,
  installTramKey,
  isNearTramDoor,
  isTramStopped,
  stepTramView,
  updateRider,
  type RiderState,
} from "@/lib/tramRuntime";
import { platformY } from "@/config/railway";
import { findNearestSeat, type SeatConfig } from "@/config/seats";

interface OfficeSceneProps {
  socket: Socket | null;
  currentUser: {
    id: string;
    fullName: string;
    color: string;
    avatarId?: string | null;
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
  /** Mode waktu lingkungan: live = jam WIB asli */
  timeMode?: TimeMode;
  /** false = sembunyikan label gedung */
  labelsVisible?: boolean;
  /** Tombol Hujan / Badai di panel status */
  weatherOverride?: WeatherOverride;
  /** Mode pengamat (sebelum masuk): tanpa avatar lokal dan tanpa kontrol gerak */
  spectator?: boolean;
  /** Posisi awal avatar di kota (mis. pintu gedung yang baru ditinggalkan) */
  initialPosition?: Vec3;
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
/** Sesuai tepi paving 84x84 di CityEnvironment.tsx */
const CITY_BOUNDS = { minX: -50, maxX: 50, minZ: -50, maxZ: 50 };

const noop = () => {};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distXZ(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

function inBox(x: number, z: number, b: Box): boolean {
  return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
}

/**
 * Tinggi lantai tangga di titik (x, z): proyeksi ke segmen `path` yang paling dekat,
 * lalu dibagi panjang total path supaya naik sebanding dengan jarak.
 */
function stairHeight(stairs: StairsConfig, x: number, z: number): number {
  const p = stairs.path;
  let total = 0;
  const cum: number[] = [0];
  for (let i = 1; i < p.length; i++) {
    total += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    cum.push(total);
  }
  let bestDist = Infinity;
  let bestProgress = 0;
  for (let i = 1; i < p.length; i++) {
    const [ax, az] = p[i - 1];
    const [bx, bz] = p[i];
    const dx = bx - ax;
    const dz = bz - az;
    const len2 = dx * dx + dz * dz || 1;
    const u = clamp(((x - ax) * dx + (z - az) * dz) / len2, 0, 1);
    const px = ax + dx * u;
    const pz = az + dz * u;
    const d = Math.hypot(x - px, z - pz);
    if (d < bestDist) {
      bestDist = d;
      bestProgress = cum[i - 1] + Math.hypot(dx, dz) * u;
    }
  }
  return total > 0 ? (bestProgress / total) * stairs.height : 0;
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
  // Batas jalan keliling (lihat ROAD di CityEnvironment.tsx)
  if (z >= 18.5 && z <= 25.5) return "jalan-selatan";
  if (z <= -26.5) return "jalan-utara";
  if (x <= -40.5) return "jalan-barat";
  if (x >= 40.5) return "jalan-timur";
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
  timeMode = "live",
  labelsVisible = true,
  weatherOverride = null,
  spectator = false,
  initialPosition,
  interior,
}: OfficeSceneProps) {
  const isInterior = interior !== undefined;
  const bounds = interior ? interior.config.bounds : CITY_BOUNDS;
  const obstacles = interior ? interior.config.obstacles : CITY_OBSTACLES;
  const spawn: Vec3 = interior
    ? interior.config.spawn
    : (initialPosition ?? DEFAULT_SPAWN);

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
  /** Tinggi lantai terakhir di luar tangga (0 = lantai dasar, >0 = lantai atas) */
  const elevationRef = useRef(0);
  const onStairsRef = useRef(false);
  /** Status naik trem pemain lokal (koordinat di kabin) */
  const riderRef = useRef<RiderState>({ riding: false, rx: 0, rz: 0 });
  const sittingSeatRef = useRef<SeatConfig | null>(null);
  const standPosRef = useRef<Vec3>([spawn[0], spawn[1], spawn[2]]);
  /** Petunjuk naik/turun trem & duduk di atas kepala pemain (diubah langsung, tanpa re-render) */
  const tramHintGroupRef = useRef<THREE.Group>(null);
  const tramHintTextRef = useRef<HTMLDivElement>(null);
  const lastHintRef = useRef<string | null>(null);

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

  // Tombol E untuk naik/turun trem hanya aktif di kota dan untuk pemain (bukan pengamat)
  useEffect(() => {
    if (isInterior || spectator) return;
    return installTramKey();
  }, [isInterior, spectator]);

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

      if (e.code === "KeyE" && !e.repeat && !isInterior && !spectator) {
        // Jangan bentrok jika pemain sedang di dalam/dekat pintu trem
        const cur = localStateRef.current;
        if (riderRef.current.riding || isNearTramDoor(cur.position[0], cur.position[2])) {
          return;
        }
        if (sittingSeatRef.current) {
          sittingSeatRef.current = null;
          localStateRef.current = {
            ...cur,
            position: [...standPosRef.current] as Vec3,
            animation: "idle",
          };
          return;
        }
        const seat = findNearestSeat(cur.position[0], cur.position[2]);
        if (seat) {
          standPosRef.current = [cur.position[0], cur.position[1], cur.position[2]];
          sittingSeatRef.current = seat;
          localStateRef.current = {
            ...cur,
            position: [seat.x, seat.y, seat.z],
            rotationY: seat.rotationY,
            animation: "sit",
          };
        }
      }
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
    if (isMoving) moveDir.normalize();

    const current = localStateRef.current;

    // --- Trem: posisi trem dari server (sama untuk semua pemain), lalu cek naik/turun/ikut bergerak ---
    let ride: ReturnType<typeof updateRider> = null;
    if (!isInterior && !spectator) {
      stepTramView(state.clock.elapsedTime);
      ride = updateRider(
        delta,
        [current.position[0], current.position[2]],
        isMoving ? [moveDir.x, moveDir.z] : null,
        riderRef.current,
      );
    }

    if (ride) {
      sittingSeatRef.current = null;
      // Pemain sedang di dalam trem, atau baru saja turun dari trem
      const [x, z] = ride.pos;
      let zone = current.zone;
      if (!ride.riding) {
        zone = detectCityZone(x, z);
        if (zone !== current.zone) onZoneChange(zone);
      }

      localStateRef.current = {
        position: [x, ride.riding ? TRAM.floorY : platformY(x, z), z],
        rotationY: isMoving ? Math.atan2(moveDir.x, moveDir.z) : current.rotationY,
        animation: ride.riding && isMoving ? "walk" : "idle",
        zone,
        ride: ride.riding
          ? { rx: riderRef.current.rx, rz: riderRef.current.rz }
          : null,
      };
    } else if (isMoving) {
      // Jika sedang duduk lalu menekan tombol gerak, otomatis berdiri
      if (sittingSeatRef.current) {
        sittingSeatRef.current = null;
        current.position = [...standPosRef.current] as Vec3;
      }
      // Gerak jalan kaki biasa (di luar trem)
      const [px, py, pz] = current.position;
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

      // Ketinggian: di atas tangga naik sesuai posisi X, di luar tangga ikut lantai terakhir
      const stairs = interiorRef.current?.config.stairs;
      const onStairs = !!stairs && inBox(nextX, nextZ, stairs.box);
      let nextY: number;
      if (stairs && onStairs) {
        nextY = stairHeight(stairs, nextX, nextZ);
      } else {
        // Baru keluar dari tangga: tentukan lantai dari tinggi terakhir di tangga
        if (stairs && onStairsRef.current) {
          elevationRef.current = py >= stairs.height / 2 ? stairs.height : 0;
        }
        nextY = isInterior ? elevationRef.current : platformY(nextX, nextZ);
      }
      onStairsRef.current = onStairs;

      localStateRef.current = {
        position: [nextX, nextY, nextZ],
        rotationY: nextRot,
        animation: didMove ? "walk" : "idle",
        zone,
      };
    } else if (sittingSeatRef.current) {
      const seat = sittingSeatRef.current;
      localStateRef.current = {
        ...current,
        position: [seat.x, seat.y, seat.z],
        rotationY: seat.rotationY,
        animation: "sit",
      };
    } else if (current.animation !== "idle") {
      localStateRef.current = { ...current, animation: "idle" };
    }

    const cur = localStateRef.current;
    playerPos.x = cur.position[0];
    playerPos.z = cur.position[2];

    // Petunjuk di atas kepala: naik saat trem berhenti dekat pintu, turun saat di dalam
    const hintGroup = tramHintGroupRef.current;
    if (hintGroup) {
      let hint: string | null = null;
      if (!isInterior && !spectator) {
        if (ride?.riding) {
          if (isTramStopped()) hint = "Tekan E untuk turun";
        } else if (isNearTramDoor(cur.position[0], cur.position[2])) {
          hint = isTramStopped()
            ? "Tekan E untuk naik"
            : "Tunggu trem berhenti untuk naik";
        } else if (sittingSeatRef.current) {
          hint = "Tekan E untuk berdiri";
        } else if (findNearestSeat(cur.position[0], cur.position[2])) {
          hint = "Tekan E untuk duduk";
        }
      }
      hintGroup.visible = hint !== null;
      if (tramHintTextRef.current) {
        tramHintTextRef.current.style.display = hint ? "block" : "none";
      }
      if (hint) {
        hintGroup.position.set(cur.position[0], cur.position[1] + 2.5, cur.position[2]);
        if (hint !== lastHintRef.current && tramHintTextRef.current) {
          tramHintTextRef.current.textContent = hint;
          lastHintRef.current = hint;
        }
      }
    }

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
        camTargetVec.current.set(
          cur.position[0],
          cur.position[1] + targetEyeY,
          cur.position[2],
        );

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
      const snapshot = `${cur.position[0]},${cur.position[1]},${cur.position[2]},${cur.rotationY},${cur.animation},${cur.zone},${cur.ride ? `${cur.ride.rx},${cur.ride.rz}` : "-"}`;
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
      <CityEnvironment
        onBuildingSelect={onBuildingSelect ?? noop}
        showLabels={cameraMode !== "first" && labelsVisible}
        timeMode={timeMode}
      />
    );
  }

  return (
    <>
      {isInterior && <color attach="background" args={["#e2e8f0"]} />}
      {isInterior ? (
        <>
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
        </>
      ) : (
        <WorldLighting timeMode={timeMode} weatherOverride={weatherOverride} />
      )}

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

      {!isInterior && !spectator && (
        <group ref={tramHintGroupRef} visible={false}>
          <Html center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <div
              ref={tramHintTextRef}
              style={{
                display: "none",
                background: "rgba(15, 23, 42, 0.85)",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            />
          </Html>
        </group>
      )}

      {!spectator && (
        <Avatar3D
          userId={currentUser.id}
          fullName={currentUser.fullName}
          color={currentUser.color}
          avatarId={currentUser.avatarId}
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
            avatarId={player.avatarConfig?.character ?? null}
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
