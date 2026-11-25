import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { TimeMode } from "@/components/WorldLighting";
import type { WeatherOverride } from "@/components/RainEffect";
import type { PlayerStatus } from "@/types";
import { CITY_DOORS } from "@/config/doors";
import { doorReady } from "@/lib/playerPosition";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { AlertCircle, Building2, LogOut, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOfficeSocket } from "@/hooks/useOfficeSocket";
import { GuestJoinModal } from "@/components/entry/GuestJoinModal";
import { AccountBadge } from "@/components/account/AccountBadge";
import {
  LandingOverlay,
  type LandingMenuKey,
} from "@/components/entry/LandingOverlay";
import { OfficeScene } from "@/components/OfficeScene";
import { VOfficeOverlay } from "@/components/hud/VOfficeOverlay";
import { JoinWorkspaceModal } from "@/components/hud/JoinWorkspaceModal";
import { RoomTransition } from "@/components/hud/RoomTransition";
import {
  BUILDINGS,
  getBuilding,
  type BuildingConfig,
  type BuildingInfo,
  type Vec3,
} from "@/config/buildings";
import LoadingScreen from "@/components/entry/LoadingScreen";
import { CAMERA_CYCLE, type CameraMode } from "@/config/camera";

// Interior hanya dimuat saat pemain benar-benar masuk gedung
const InteriorPage = lazy(() => import("@/pages/InteriorPage"));

const DEFAULT_SPAWN: Vec3 = [0, 0, 3];
// Popup tetap tampil sampai pemain menjauh sejauh margin ini (mencegah kedip)
const LEAVE_MARGIN = 1.5;
// Setelah pindah ruangan selesai, popup masuk gedung ditahan sebentar agar scene sempat stabil
const PROMPT_SETTLE_MS = 1500;
// Durasi minimum overlay transisi ruangan tampil agar pintu sempat menutup sempurna
// dan scene tujuan sempat termuat di balik layar sebelum pintu terbuka lagi
const MIN_TRANSITION_MS = 1350;

const EXTERIOR_CAMERA = { position: [0, 16, 22] as Vec3, fov: 42 };
const INTERIOR_CAMERA = { position: [0, 9, 11] as Vec3, fov: 42 };

function distXZ(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

/** Status di mode jelajah -> mode waktu lingkungan */
function statusToTimeMode(status?: PlayerStatus | null): TimeMode {
  switch (status) {
    case "PAGI":
      return "pagi";
    case "SORE":
      return "sore";
    case "MALAM":
      return "malam";
    case "ISTIRAHAT":
      return "istirahat";
    default:
      return "live";
  }
}

/** Canvas dibuat ulang setiap pindah halaman, sehingga memori scene sebelumnya dilepas */
function SceneCanvas({
  children,
  camera,
}: {
  children: React.ReactNode;
  camera: { position: Vec3; fov: number };
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={camera}
      className="w-full h-full"
    >
      {children}
    </Canvas>
  );
}

/** Teks popup per gedung. Gedung lain memakai nama gedungnya. */
const PROMPT_COPY: Record<string, { title: string; desc: string }> = {
  "enuma-hq": {
    title: "Gedung Kantor",
    desc: "Anda akan masuk area kantor Enuma Technology.",
  },
};

function BuildingPrompt({
  building,
  onEnter,
  onDismiss,
}: {
  building: BuildingConfig;
  onEnter: () => void;
  onDismiss: () => void;
}) {
  const copy = PROMPT_COPY[building.key] ?? {
    title: building.name,
    desc: `Anda akan masuk ke ${building.name}.`,
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[1px]">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-105 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl"
      >
        <img src="/logo-enuma.png" alt="" className="mx-auto h-12 w-12" />
        <h2 className="mt-3 text-xl font-extrabold text-slate-900">
          Masuk ke <span className="text-blue-600">{copy.title}</span>?
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">{copy.desc}</p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onDismiss}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
            Tidak, terimakasih
          </button>
          <button
            onClick={onEnter}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 cursor-pointer"
          >
            <Building2 className="h-4 w-4" />
            Masuk Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, loading, signOut } = useAuth();
  // Hanya id user yang dipakai untuk koneksi, supaya refresh token tidak memicu join ulang
  const userId = session?.user.id ?? null;
  const isSignedIn = userId !== null;
  // Avatar terpilih user. Saat berubah, hook mengirimkannya ke server
  // agar pemain lain ikut melihat perubahannya.
  const selectedAvatarId =
    (session?.user.user_metadata?.character as string | undefined) ?? null;
  const {
    socket,
    error,
    workspace,
    remotePlayers,
    remoteTicksRef,
    messages,
    bubbles,
    selfInfo,
    joinByInviteCode,
    switchWorkspace,
    sendMessage,
    enterRoom,
    enterBuilding,
    setStatus,
  } = useOfficeSocket(userId, selectedAvatarId);

  // Status di mode jelajah: disimpan lokal (untuk lingkungan),
  // dan dikirim ke server hanya untuk status yang dikenalnya
  const [localStatus, setLocalStatus] = useState<PlayerStatus>("LIVE");
  const handleStatusChange = (next: PlayerStatus) => {
    setLocalStatus(next);
    if (next === "LIVE" || next === "PAGI" || next === "ISTIRAHAT")
      setStatus(next);
  };

  // Tampilan sebelum masuk (overview kota + modal nama)
  const [showGuestModal, setShowGuestModal] = useState(false);
  // Akun yang login (bukan anonim/tamu) melewati popup nama dan langsung masuk game
  const isLoggedIn = !!session && !session.user.is_anonymous;
  const [enteredGame, setEnteredGame] = useState(false);
  useEffect(() => {
    if (!session) {
      setEnteredGame(false);
      return;
    }
    if (isLoggedIn && showGuestModal) {
      // Login dari popup: langsung masuk game
      setEnteredGame(true);
      setShowGuestModal(false);
    }
  }, [session, isLoggedIn, showGuestModal]);
  const [landingMenu, setLandingMenu] = useState<LandingMenuKey | null>(null);
  const [landingView, setLandingView] = useState("Beranda");
  const [timeMode, setTimeMode] = useState<TimeMode>("live");
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [hudVisible, setHudVisible] = useState(true);
  const [weatherOverride, setWeatherOverride] = useState<WeatherOverride>(null);
  const [currentZone, setCurrentZone] = useState("jalan-utama");
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>("follow");
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(
    null,
  );

  // Popup masuk gedung dan gedung yang sedang aktif di socket
  const [promptBuilding, setPromptBuilding] = useState<BuildingConfig | null>(
    null,
  );
  const [activeBuildingKey, setActiveBuildingKey] = useState<string | null>(
    null,
  );
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // URL adalah sumber kebenaran: "/" = kota, "/gedung/<key>" = interior
  const urlBuildingKey =
    location.pathname.match(/^\/gedung\/([^/]+)\/?$/)?.[1] ?? null;
  const currentBuilding = getBuilding(urlBuildingKey);

  /** Nama tujuan untuk overlay pindah ruangan */
  const transitionDestination = urlBuildingKey
    ? (currentBuilding?.interior.name ?? currentBuilding?.name ?? "Gedung")
    : "Kota Enuma";

  const exteriorRoomId =
    workspace?.rooms.find((r) => !r.buildingKey)?.id ??
    workspace?.rooms[0]?.id ??
    null;

  const urlKeyRef = useRef(urlBuildingKey);
  urlKeyRef.current = urlBuildingKey;

  const shownBuildingRef = useRef<BuildingConfig | null>(null);
  const dismissedKeyRef = useRef<string | null>(null);
  const syncingToRef = useRef<string | null | undefined>(undefined);
  /** true selama pindah ruangan berlangsung, popup tidak boleh muncul */
  const transitioningRef = useRef(false);
  /** Popup ditahan sampai waktu ini (ms epoch), setelah pindah ruangan selesai */
  const promptBlockedUntilRef = useRef(0);
  /** Posisi kota tempat pemain keluar dari gedung (pintu gedung tersebut) */
  const cityReturnPosRef = useRef<Vec3>(DEFAULT_SPAWN);
  /** Resolver yang dipanggil saat OfficeScene tujuan selesai memuat aset & merender frame pertama */
  const sceneReadyResolveRef = useRef<(() => void) | null>(null);
  const handleSceneReady = useCallback(() => {
    sceneReadyResolveRef.current?.();
    sceneReadyResolveRef.current = null;
  }, []);

  // Dipanggil dari OfficeScene dengan throttle
  const handleLocalPosition = useCallback((pos: Vec3) => {
    if (urlKeyRef.current) return; // popup hanya di kota
    if (transitioningRef.current) return; // sedang pindah ruangan
    if (Date.now() < promptBlockedUntilRef.current) return; // masih dalam masa tenang

    const shown = shownBuildingRef.current;
    if (
      shown &&
      distXZ(pos, shown.entrance) <= shown.entranceRadius + LEAVE_MARGIN
    ) {
      return; // masih dekat, popup tetap
    }
    if (shown) {
      shownBuildingRef.current = null;
      setPromptBuilding(null);
    }

    // Popup hanya muncul jika pintu gedung sudah terbuka penuh (gedung tanpa pintu geser langsung)
    const near = BUILDINGS.find(
      (b) =>
        distXZ(pos, b.entrance) <= b.entranceRadius &&
        (CITY_DOORS[b.key] === undefined || doorReady[b.key] === true),
    );
    if (!near) {
      dismissedKeyRef.current = null; // sudah menjauh, popup boleh muncul lagi
      return;
    }
    if (near.key === dismissedKeyRef.current) return; // sudah ditolak atau baru ditinggalkan

    shownBuildingRef.current = near;
    setPromptBuilding(near);
  }, []);

  const handleEnterFromPrompt = (building: BuildingConfig) => {
    shownBuildingRef.current = null;
    setPromptBuilding(null);
    navigate(`/gedung/${building.key}`);
  };

  const handleDismissPrompt = () => {
    if (promptBuilding) dismissedKeyRef.current = promptBuilding.key;
    shownBuildingRef.current = null;
    setPromptBuilding(null);
  };

  /**
   * Keluar dari gedung. Pintu yang ditinggalkan ditandai SEBELUM navigasi,
   * supaya scene kota yang baru muncul tidak langsung memunculkan popup di pintu yang sama.
   */
  const handleExitBuilding = () => {
    const left = getBuilding(activeBuildingKey) ?? currentBuilding;
    dismissedKeyRef.current = left?.key ?? null;
    // Kota di-mount ulang setelah keluar, jadi posisi pintu disimpan di sini
    cityReturnPosRef.current = left?.entrance ?? DEFAULT_SPAWN;
    shownBuildingRef.current = null;
    setPromptBuilding(null);
    navigate("/");
  };

  /** Tombol "Masuk Sekarang" di panel detail gedung */
  const handleEnterSelectedBuilding = () => {
    if (!selectedBuilding) return;
    const target = getBuilding(selectedBuilding.buildingKey);
    setSelectedBuilding(null);
    if (target) navigate(`/gedung/${target.key}`);
  };

  // Sinkronkan socket dengan URL: masuk gedung atau kembali ke kota
  useEffect(() => {
    if (!isSignedIn || !workspace || !exteriorRoomId) return;
    if (urlBuildingKey === activeBuildingKey) return;
    if (syncingToRef.current === urlBuildingKey) return;

    syncingToRef.current = urlBuildingKey;
    transitioningRef.current = true;
    setTransitioning(true);
    setTransitionError(null);

    const run = async () => {
      const minWait = new Promise<void>((resolve) =>
        window.setTimeout(resolve, MIN_TRANSITION_MS),
      );
      const sceneReadyWait = new Promise<void>((resolve) => {
        sceneReadyResolveRef.current = resolve;
      });
      try {
        if (urlBuildingKey) {
          const building = getBuilding(urlBuildingKey);
          if (!building) {
            navigate("/", { replace: true });
            return;
          }
          await enterBuilding(building.key, building.interior.spawn);
          setActiveBuildingKey(building.key);
          await Promise.all([minWait, sceneReadyWait]);
        } else {
          const prev = getBuilding(activeBuildingKey);
          // Jangan langsung muncul popup lagi di pintu tempat pemain keluar
          dismissedKeyRef.current = prev?.key ?? null;
          await enterRoom(exteriorRoomId, prev?.entrance ?? DEFAULT_SPAWN);
          setActiveBuildingKey(null);
          await Promise.all([minWait, sceneReadyWait]);
        }
      } catch (err) {
        console.error("Gagal berpindah ruangan:", err);
        setTransitionError(
          err instanceof Error ? err.message : "Gagal berpindah ruangan",
        );
        navigate("/", { replace: true });
      } finally {
        sceneReadyResolveRef.current = null;
        syncingToRef.current = undefined;
        transitioningRef.current = false;
        promptBlockedUntilRef.current = Date.now() + PROMPT_SETTLE_MS;
        setTransitioning(false);
      }
    };

    void run();
  }, [
    urlBuildingKey,
    activeBuildingKey,
    isSignedIn,
    workspace,
    exteriorRoomId,
    enterBuilding,
    enterRoom,
    navigate,
  ]);

  // Tombol C: ganti sudut pandang kamera
  useEffect(() => {
    if (!isSignedIn) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyC" || e.repeat) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isChatFocused || showJoinModal) return;

      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }

      setCameraMode((prev) => {
        const i = CAMERA_CYCLE.indexOf(prev);
        return CAMERA_CYCLE[(i + 1) % CAMERA_CYCLE.length];
      });
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isSignedIn, isChatFocused, showJoinModal]);

  // Setiap masuk atau keluar mode jelajah, kamera kembali ke default (ikuti karakter)
  useEffect(() => {
    setCameraMode("follow");
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-xs text-slate-500 font-sans">
        Memuat Virtual Office City...
      </div>
    );
  }

  if (!session || (isLoggedIn && !enteredGame)) {
    // Belum masuk atau akun login belum menekan Jelajahi: tampilkan overview kota sebagai latar
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-slate-100 select-none font-sans">
        <SceneCanvas camera={EXTERIOR_CAMERA}>
          <OfficeScene
            socket={null}
            currentUser={{
              id: "preview",
              fullName: "",
              color: "#3b82f6",
            }}
            remotePlayers={[]}
            remoteTicksRef={remoteTicksRef}
            bubbles={{}}
            onZoneChange={setCurrentZone}
            isChatFocused={true}
            cameraMode="iso"
            spectator
            timeMode={timeMode}
            labelsVisible={labelsVisible}
            weatherOverride={weatherOverride}
          />
        </SceneCanvas>
        <div className="pointer-events-none absolute inset-0 bg-slate-900/25" />
        <LandingOverlay
          activeMenu={landingMenu}
          onMenuSelect={setLandingMenu}
          onMenuClose={() => setLandingMenu(null)}
          activeView={landingView}
          onViewSelect={setLandingView}
          onExplore={() =>
            isLoggedIn ? setEnteredGame(true) : setShowGuestModal(true)
          }
          timeMode={timeMode}
          onTimeModeChange={setTimeMode}
          weatherOverride={weatherOverride}
          onWeatherOverrideChange={setWeatherOverride}
          labelsVisible={labelsVisible}
          onToggleLabels={() => setLabelsVisible((v) => !v)}
          hudVisible={hudVisible}
          onToggleHud={() => setHudVisible((v) => !v)}
        />

        <AccountBadge session={session} hidden={!hudVisible} />

        {showGuestModal && (
          <GuestJoinModal onClose={() => setShowGuestModal(false)} />
        )}
      </div>
    );
  }

  const userName =
    session.user.user_metadata?.full_name ||
    session.user.email?.split("@")[0] ||
    "User";

  const currentUser = {
    id: session.user.id,
    fullName: userName,
    color: "#3b82f6",
    avatarId: selectedAvatarId,
    role: selfInfo?.role ?? "MEMBER",
    jobTitle: selfInfo?.jobTitle ?? null,
    status: selfInfo?.status ?? "LIVE",
  };

  const isInteriorReady =
    !!currentBuilding && activeBuildingKey === currentBuilding.key;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-100 select-none font-sans">
      <Routes>
        <Route
          path="/"
          element={
            <SceneCanvas camera={EXTERIOR_CAMERA}>
              <OfficeScene
                socket={socket}
                currentUser={currentUser}
                remotePlayers={remotePlayers}
                remoteTicksRef={remoteTicksRef}
                bubbles={bubbles}
                onZoneChange={setCurrentZone}
                isChatFocused={isChatFocused || showJoinModal}
                initialPosition={cityReturnPosRef.current}
                onBuildingSelect={() => {
                  /* klik gedung/label tidak membuka apa pun; masuk lewat popup di pintu */
                }}
                onLocalPositionChange={handleLocalPosition}
                cameraMode={cameraMode}
                timeMode={statusToTimeMode(localStatus)}
                onSceneReady={handleSceneReady}
              />
            </SceneCanvas>
          }
        />
        <Route
          path="/gedung/:buildingKey"
          element={
            <SceneCanvas camera={INTERIOR_CAMERA}>
              <Suspense fallback={null}>
                {isInteriorReady && currentBuilding && (
                  <InteriorPage
                    building={currentBuilding}
                    socket={socket}
                    currentUser={currentUser}
                    remotePlayers={remotePlayers}
                    remoteTicksRef={remoteTicksRef}
                    bubbles={bubbles}
                    onZoneChange={setCurrentZone}
                    cameraMode={cameraMode}
                    isChatFocused={isChatFocused || showJoinModal}
                    onSceneReady={handleSceneReady}
                    onExit={handleExitBuilding}
                  />
                )}
              </Suspense>
            </SceneCanvas>
          }
        />
      </Routes>

      {/* Animasi pindah ruangan: pintu menutup, muat, lalu terbuka */}
      <RoomTransition
        active={transitioning}
        destination={transitionDestination}
        toCity={!urlBuildingKey}
      />

      {/* Banner error (koneksi atau pindah ruangan) */}
      {(error || transitionError) && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500 text-white text-xs shadow-xl max-w-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{transitionError || error}</span>
        </div>
      )}

      {/* Tombol keluar gedung, di tengah atas agar tidak menabrak chat */}
      {urlBuildingKey && isInteriorReady && (
        <button
          onClick={handleExitBuilding}
          className="absolute top-18 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 border border-white/80 shadow-lg text-xs font-bold text-slate-700 hover:text-blue-600 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar ke Kota
        </button>
      )}

      {/* Popup konfirmasi masuk gedung (hanya di kota) */}
      {!urlBuildingKey && promptBuilding && (
        <BuildingPrompt
          building={promptBuilding}
          onEnter={() => handleEnterFromPrompt(promptBuilding)}
          onDismiss={handleDismissPrompt}
        />
      )}

      {/* HUD sama di kota maupun interior */}
      <AccountBadge session={session} position="game" />
      <VOfficeOverlay
        currentUserId={session.user.id}
        onlineCount={remotePlayers.length + 1}
        currentZone={currentZone}
        messages={messages}
        remotePlayers={remotePlayers}
        onSendMessage={sendMessage}
        selectedBuilding={selectedBuilding}
        onCloseBuildingDetail={() => setSelectedBuilding(null)}
        onEnterBuilding={handleEnterSelectedBuilding}
        cameraMode={cameraMode}
        onCameraModeChange={setCameraMode}
        isChatFocused={isChatFocused}
        onFocusChatChange={setIsChatFocused}
        onOpenWorkspaceModal={() => setShowJoinModal(true)}
        workspaceName={currentBuilding?.interior.name ?? workspace?.name}
        userStatus={localStatus}
        onStatusChange={handleStatusChange}
        onExit={() => (isLoggedIn ? setEnteredGame(false) : void signOut())}
      />

      <JoinWorkspaceModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        currentWorkspaceId={workspace?.id}
        onJoinByCode={joinByInviteCode}
        onSwitchWorkspace={switchWorkspace}
      />
    </div>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <AppContent />
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
    </>
  );
}
