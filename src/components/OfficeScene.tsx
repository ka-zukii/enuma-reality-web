import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { playerPos } from "@/lib/playerPosition";
import { setInteractHint } from "@/lib/interactHint";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
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
  type BuildingInfo,
  type InteriorConfig,
  type Vec3,
} from "@/config/buildings";
import {
  floorOfElevation,
  gateFloorAt,
  inStairZones,
  isMoveBlocked,
  stairHeight,
  type MoveContext,
} from "@/lib/stairs";
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
import { findNearestSeat, type SeatConfig, CITY_SEATS } from "@/config/seats";

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
  /** Dipanggil setelah lingkungan (GLTF/Suspense) selesai dimuat dan frame pertama ter-render */
  onSceneReady?: () => void;
  /** Jika diisi, scene menjadi interior gedung, bukan kota */
  interior?: {
    config: InteriorConfig;
    onExit: () => void;
  };
}

const MOVE_SPEED = 6.0;
const EMIT_INTERVAL = 0.05; // 20Hz
/** Jarak minimum kamera mode follow (ikuti karakter). Di bawah ini kamera masuk ke First Person. */
const FOLLOW_MIN_DIST = 1.6;

const POS_REPORT_INTERVAL = 0.15;
/** Batas atas delta waktu. Saat frame turun, karakter tidak melompat jauh sekaligus. */
const MAX_DT = 1 / 30;
const DEFAULT_SPAWN: Vec3 = [0, 0, 3];
/** Sesuai tepi paving 84x84 di CityEnvironment.tsx */
const CITY_BOUNDS = { minX: -50, maxX: 50, minZ: -50, maxZ: 50 };
const LANDING_TARGET: Vec3 = [8.7, 4.5, -4];

const noop = () => {};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distXZ(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
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
  onSceneReady,
  interior,
}: OfficeSceneProps) {
  const isInterior = interior !== undefined;
  const bounds = interior ? interior.config.bounds : CITY_BOUNDS;
  // Batas jarak kamera: sampai menyentuh dinding (raycast ke geometri interior / kota).
  // Saat tembok sudah tidak menghalangi, kamera kembali ke jarak yang diinginkan pemain.
  useFrame(({ camera }, delta) => {
    const controls = controlsRef.current;
    const group = isInterior ? interiorGroupRef.current : cityGroupRef.current;
    if (!controls || !group || cameraMode === "first" || spectator) return;

    const target = controls.target as THREE.Vector3;
    const dir = new THREE.Vector3().subVectors(camera.position, target);
    const dist = dir.length();
    if (dist < 1e-4) return;
    dir.divideScalar(dist);

    // Jarak awal dijadikan jarak yang diinginkan
    if (prefDistRef.current === null) prefDistRef.current = dist;

    const maxRange = isInterior ? 14 : spectator ? 90 : 48;
    const ray = wallRayRef.current;
    ray.set(target, dir);
    ray.far = maxRange;
    const hits = ray.intersectObject(group, true);

    // Di kota, abaikan permukaan datar (tanah, jalan, atap) supaya kamera tidak terpotong saat melihat ke bawah
    let hit: THREE.Intersection | undefined;
    if (isInterior) {
      hit = hits[0];
    } else {
      hit = hits.find((h) => {
        if (!h.face) return false;
        const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
        return Math.abs(n.y) < 0.6;
      });
    }

    const wallMargin = 0.3;
    const minWallDist = cameraMode === "follow" ? FOLLOW_MIN_DIST : 0.5;
    const allowed = hit ? Math.max(minWallDist, hit.distance - wallMargin) : maxRange;
    controls.maxDistance = Math.min(maxRange, allowed);

    // Jarak tujuan: jarak yang diinginkan, tapi tidak lebih jauh dari tembok
    const goal = Math.min(prefDistRef.current, controls.maxDistance);

    if (dist > goal) {
      // Tembok menghalangi: tarik kamera ke dalam
      camera.position.copy(target).addScaledVector(dir, goal);
    } else if (dist < goal - 0.01 && desiredDistRef.current === null) {
      // Tembok sudah tidak menghalangi: kembali perlahan ke jarak yang diinginkan
      const next = THREE.MathUtils.lerp(dist, goal, 1 - Math.exp(-6 * delta));
      camera.position.copy(target).addScaledVector(dir, next);
    }
  });

  // Status buka/tutup tiap pintu interior, dicatat berdasarkan id pintu
  const [openDoors, setOpenDoors] = useState<Record<string, boolean>>({});
  // Salinan status pintu untuk dibaca di useFrame (tanpa re-render)
  const openDoorsRef = useRef(openDoors);
  openDoorsRef.current = openDoors;  
  const baseObstacles = interior ? interior.config.obstacles : CITY_OBSTACLES;
  // Pintu tertutup: daun pintu jadi penghalang. Pintu terbuka: potongan dinding di lubang pintu dibuka
  // Penghalang: pintu tertutup menambah penghalang daun pintu; pintu terbuka melubangi dinding
  const activeSeats = interior?.config.seats ?? CITY_SEATS;  
  const obstacles = (() => {
    const doorList = interior?.config.doors ?? [];
    if (doorList.length === 0) return baseObstacles;
    let result = [...baseObstacles];
    for (const d of doorList) {
      if (!openDoors[d.id]) {
        result.push(d.blocker);
        continue;
      }
      if (d.wallTarget && d.wallOpen) {
        const t = d.wallTarget;
        const open = d.wallOpen;
        result = result.flatMap((o) =>
          o.minX === t.minX &&
          o.maxX === t.maxX &&
          o.minZ === t.minZ &&
          o.maxZ === t.maxZ
            ? open
            : [o],
        );
      }
    }
    return result;
  })();
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
  // Hint tombol interaksi dikirim ke overlay di luar Canvas (lihat InteractHint)
  useEffect(() => () => setInteractHint(null), []);

  const controlsRef = useRef<any>(null);
  const interiorGroupRef = useRef<THREE.Group>(null);
  const cityGroupRef = useRef<THREE.Group>(null);
  const wallRayRef = useRef(new THREE.Raycaster());
  const keysPressed = useRef<Record<string, boolean>>({});
  const emitTimer = useRef(0);
  const posReportTimer = useRef(0);
  const debugPosTimer = useRef(0);
  /** Ringkasan state terakhir yang dikirim. Kosong = wajib kirim ulang. */
  const lastSentRef = useRef("");
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  const prevModeRef = useRef<CameraMode>(cameraMode);
  const desiredDistRef = useRef<number | null>(null);
  const prefDistRef = useRef<number | null>(null);
  const { gl } = useThree();

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
    if (isInterior) {
      onZoneChange("interior");
      console.log(
        `[Interior Pos] spawn x=${spawn[0].toFixed(2)}, y=${spawn[1].toFixed(2)}, z=${spawn[2].toFixed(2)}`,
      );
    }
  }, [isInterior, onZoneChange, spawn]);

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

      if (e.code === "KeyE" && !e.repeat && !spectator) {
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
        const seat = findNearestSeat(cur.position[0], cur.position[2], activeSeats);
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
  // Reset semua pintu saat pindah gedung
  useEffect(() => {
    setOpenDoors({});
  }, [interior?.config.buildingKey]);

  // Tekan E di dekat pintu interior: buka/tutup pintu terdekat dalam jarak tekan
  useEffect(() => {
    const doorList = interior?.config.doors ?? [];
    if (!isInterior || doorList.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (isChatFocused || e.code !== "KeyE" || e.repeat) return;
      const p = localStateRef.current.position;
      let best: (typeof doorList)[number] | null = null;
      let bestDist = Infinity;
      for (const d of doorList) {
        const dist = Math.hypot(p[0] - d.center[0], p[2] - d.center[2]);
        if (dist <= d.reach && dist < bestDist) {
          best = d;
          bestDist = dist;
        }
      }
      if (best) {
        const id = best.id;
        setOpenDoors((prev) => ({ ...prev, [id]: !prev[id] }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isInterior, interior, isChatFocused]);

  // Smooth & responsif zoom dengan scroll wheel / trackpad (mengurangi jumlah guliran)
  useEffect(() => {
    const dom = gl.domElement;
    const minDist = cameraMode === "follow" ? FOLLOW_MIN_DIST : 0.3;
    const maxDist = isInterior ? 14 : spectator ? 90 : 48;

    const onWheel = (e: WheelEvent) => {
      if (cameraMode === "first" || !controlsRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      const normDelta =
        e.deltaMode === 1
          ? e.deltaY * 33
          : e.deltaMode === 2
            ? e.deltaY * 300
            : e.deltaY;

      const curDist =
        prefDistRef.current ??
        desiredDistRef.current ??
        controlsRef.current.object.position.distanceTo(
          controlsRef.current.target,
        );
      const next = clamp(
        curDist * Math.exp(normDelta * 0.0028),
        minDist,
        maxDist,
      );
      desiredDistRef.current = next;
      prefDistRef.current = next;
    };

    dom.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => {
      dom.removeEventListener("wheel", onWheel, { capture: true });
    };
  }, [gl, cameraMode, isInterior, spectator]);

  const readyFramesRef = useRef(0);
  const readySentRef = useRef(false);

  useFrame((state, rawDelta) => {
    if (!readySentRef.current) {
      readyFramesRef.current += 1;
      if (readyFramesRef.current >= 2) {
        readySentRef.current = true;
        onSceneReady?.();
      }
    }
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

      const stairs = interiorRef.current?.config.stairs;
      const moveCtx: MoveContext = {
        stairs,
        wasOnStairs: onStairsRef.current,
        floor: stairs ? floorOfElevation(stairs, elevationRef.current) : 0,
        fromX: px,
        fromZ: pz,
        obstacles,
        upperObstacles: interiorRef.current?.config.upperObstacles,
      };

      // Cek sumbu X dulu, jika menabrak batalkan X saja (tetap bisa bergerak di Z)
      let nextX = clamp(px + stepX, bounds.minX, bounds.maxX);
      if (isMoveBlocked(moveCtx, nextX, pz)) nextX = px;

      // Lalu sumbu Z, dengan X yang sudah diputuskan
      let nextZ = clamp(pz + stepZ, bounds.minZ, bounds.maxZ);
      if (isMoveBlocked(moveCtx, nextX, nextZ)) nextZ = pz;

      const didMove = nextX !== px || nextZ !== pz;
      const nextRot = Math.atan2(moveDir.x, moveDir.z);

      let zone = current.zone;
      if (!isInterior && didMove) {
        zone = detectCityZone(nextX, nextZ);
        if (zone !== current.zone) onZoneChange(zone);
      }

      // Ketinggian: di atas tangga naik sesuai posisi, di luar tangga ikut lantai terakhir
      let nextY: number;
      const onStairs = !!stairs && inStairZones(stairs, nextX, nextZ);
      if (stairs && onStairs) {
        nextY = stairHeight(stairs, nextX, nextZ);
      } else {
        // Baru keluar dari tangga: lantai ditentukan oleh gerbang tempat keluar
        if (stairs && onStairsRef.current) {
          const g = gateFloorAt(stairs, nextX, nextZ) ?? floorOfElevation(stairs, py);
          elevationRef.current = g === 1 ? stairs.height : 0;
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

    // Mode orang pertama: badan karakter ikut menghadap arah pandang kamera.
    // Drag mouse untuk menoleh, dan karakter ikut berputar (strafe A/D tetap menghadap kamera).
    if (
      cameraMode === "first" &&
      controlsRef.current &&
      !sittingSeatRef.current &&
      !ride?.riding
    ) {
      const ctrl = controlsRef.current;
      // Arah pandang = dari posisi kamera ke target, diproyeksikan ke bidang XZ.
      // Konvensi yaw sama dengan moveDir: x = sin(yaw), z = cos(yaw).
      const lookYaw = Math.atan2(
        ctrl.target.x - camera.position.x,
        ctrl.target.z - camera.position.z,
      );
      localStateRef.current = { ...localStateRef.current, rotationY: lookYaw };
    }

    const cur = localStateRef.current;
    playerPos.x = cur.position[0];
    playerPos.z = cur.position[2];

    // Petunjuk tombol interaksi: dikirim ke overlay layar (bukan di atas karakter)
    {
      let hint: string | null = null;
      if (!isInterior && !spectator) {
        if (ride?.riding) {
          if (isTramStopped()) hint = "Turun";
        } else if (isNearTramDoor(cur.position[0], cur.position[2])) {
          hint = isTramStopped() ? "Naik Trem" : "Tunggu trem berhenti";
        } else if (sittingSeatRef.current) {
          hint = "Berdiri";
        } else if (findNearestSeat(cur.position[0], cur.position[2], activeSeats)) {
          hint = "Duduk";
        }
      }
      // Di dalam gedung: petunjuk untuk pintu terdekat dalam jarak tekan
      if (isInterior) {
        const doorList = interiorRef.current?.config.doors ?? [];
        let best: (typeof doorList)[number] | null = null;
        let bestDist = Infinity;
        for (const d of doorList) {
          const dd = Math.hypot(cur.position[0] - d.center[0], cur.position[2] - d.center[2]);
          if (dd <= d.reach && dd < bestDist) {
            best = d;
            bestDist = dd;
          }
        }
        if (best) {
          hint = openDoorsRef.current[best.id] ? "Tutup Pintu" : "Buka Pintu";
        }
      }
      setInteractHint(
        hint ? { label: hint, key: !hint.startsWith("Tunggu") } : null,
      );
    }

    // Pintu keluar interior: begitu pemain sampai di salah satu pintu keluar, kembali ke kota
    const activeInterior = interiorRef.current;
    if (activeInterior && !exitTriggeredRef.current) {
      const exits = [
        activeInterior.config.exit,
        ...(activeInterior.config.extraExits ?? []),
      ];
      for (const exit of exits) {
        if (distXZ(cur.position, exit.position) <= exit.radius) {
          exitTriggeredRef.current = true;
          activeInterior.onExit();
          break;
        }
      }
    }

    // Kamera follow pemain & deteksi First Person jika di-zoom mentok
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const offset = offsetVec.current;

      // Saat mode berganti, atur ulang posisi kamera terhadap karakter
      if (prevModeRef.current !== cameraMode) {
        desiredDistRef.current = null;
        offset.copy(camera.position).sub(controls.target);
        offset.y = 0;
        if (offset.lengthSq() < 1e-6) offset.set(0, 0, 1);
        offset.normalize();

        if (cameraMode === "follow" && camera.position.distanceTo(controls.target) < FOLLOW_MIN_DIST) {
          desiredDistRef.current = FOLLOW_MIN_DIST;
          prefDistRef.current = FOLLOW_MIN_DIST;
        }

        if (cameraMode === "first") {
          // Kamera menempel di ketinggian mata avatar, arah pandang mengikuti arah kamera sebelumnya
          camera.position.copy(controls.target).addScaledVector(offset, 0.6);
          camera.position.y = cur.position[1] + 1.34;
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

      // Interpolasi jarak zoom agar perpindahan terasa halus
      if (desiredDistRef.current !== null && cameraMode !== "first") {
        const curDist = camera.position.distanceTo(controls.target);
        const nextDist = THREE.MathUtils.lerp(
          curDist,
          desiredDistRef.current,
          1 - Math.exp(-12 * delta),
        );
        if (curDist > 1e-5) {
          offset
            .copy(camera.position)
            .sub(controls.target)
            .multiplyScalar(nextDist / curDist);
          camera.position.copy(controls.target).add(offset);
        }
        if (Math.abs(nextDist - desiredDistRef.current) < 0.005) {
          desiredDistRef.current = null;
        }
      }

      const dist = camera.position.distanceTo(controls.target);

      // Jika di-zoom sangat dekat (<= 1.25m), aktifkan First Person
      const enterFP = cameraMode !== "follow" && dist <= 1.25;
      if (enterFP !== isFirstPerson) {
        setIsFirstPerson(enterFP);
      }

      if (cameraMode === "follow" || enterFP) {
        // Ketinggian mata avatar (pusat kepala 1.585 * AVATAR_SCALE 0.84 ≈ 1.34m)
        const targetEyeY = enterFP ? 1.34 : 1.2;
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

      // Cegah kamera menembus tanah/lantai saat diarahkan ke atas (melihat langit)
      const minCamY = cur.position[1] + 0.35;
      if (camera.position.y < minCamY) {
        camera.position.y = minCamY;
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

    // Log koordinat saat bergerak/menekan tombol arah di dalam ruangan untuk debugging collision
    if (isInterior && moveDir.lengthSq() > 0) {
      debugPosTimer.current += delta;
      if (debugPosTimer.current >= 0.4) {
        debugPosTimer.current = 0;
        console.log(
          `[Interior Pos] x=${cur.position[0].toFixed(2)}, y=${cur.position[1].toFixed(2)}, z=${cur.position[2].toFixed(2)}`,
        );
      }
    }

    // DEBUG sementara: koordinat di kota saat bergerak
    if (!isInterior && moveDir.lengthSq() > 0) {
      debugPosTimer.current += delta;
      if (debugPosTimer.current >= 0.4) {
        debugPosTimer.current = 0;
        console.log(`[City Pos] x=${cur.position[0].toFixed(2)}, z=${cur.position[2].toFixed(2)}`);
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
    environment = (
      <group ref={interiorGroupRef}>
        <InteriorEnvironment config={interior.config} openDoors={openDoors} />
      </group>
    );
  } else {
    environment = (
      <group ref={cityGroupRef}>
        <CityEnvironment
          onBuildingSelect={onBuildingSelect ?? noop}
          showLabels={cameraMode !== "first" && labelsVisible}
          timeMode={timeMode}
        />
      </group>
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
        maxPolarAngle={Math.PI * 0.92}
        minDistance={
          cameraMode === "first"
            ? 0.6
            : cameraMode === "follow"
              ? FOLLOW_MIN_DIST
              : 0.3
        }
        maxDistance={cameraMode === "first" ? 0.6 : isInterior ? 14 : spectator ? 90 : 48}
        enableZoom={cameraMode !== "first"}
        zoomSpeed={1.8}
        target={spectator ? LANDING_TARGET : [spawn[0], 1.55, spawn[2]]}
      />

      {environment}

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