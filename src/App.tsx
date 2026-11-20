import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { AlertCircle, Building2, LogOut, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOfficeSocket } from "@/hooks/useOfficeSocket";
import { GuestJoinModal } from "@/components/entry/GuestJoinModal";
import {
  LandingOverlay,
  type LandingMenuKey,
} from "@/components/entry/LandingOverlay";
import { OfficeScene } from "@/components/OfficeScene";
import { VOfficeOverlay } from "@/components/hud/VOfficeOverlay";
import { JoinWorkspaceModal } from "@/components/hud/JoinWorkspaceModal";
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

const EXTERIOR_CAMERA = { position: [0, 16, 22] as Vec3, fov: 42 };
const INTERIOR_CAMERA = { position: [0, 9, 11] as Vec3, fov: 42 };

function distXZ(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
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
    <Canvas shadows camera={camera} className="w-full h-full">
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
        className="w-full max-w-[420px] rounded-3xl bg-white px-6 py-6 text-center shadow-2xl"
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
  } = useOfficeSocket(userId);

    // Tampilan sebelum masuk (overview kota + modal nama)
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [landingMenu, setLandingMenu] = useState<LandingMenuKey | null>(null);
  const [landingView, setLandingView] = useState("Beranda");
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

  const exteriorRoomId =
    workspace?.rooms.find((r) => !r.buildingKey)?.id ??
    workspace?.rooms[0]?.id ??
    null;

  const urlKeyRef = useRef(urlBuildingKey);
  urlKeyRef.current = urlBuildingKey;

  const shownBuildingRef = useRef<BuildingConfig | null>(null);
  const dismissedKeyRef = useRef<string | null>(null);
  const syncingToRef = useRef<string | null | undefined>(undefined);

  // Dipanggil dari OfficeScene dengan throttle
  const handleLocalPosition = useCallback((pos: Vec3) => {
    if (urlKeyRef.current) return; // popup hanya di kota

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

    const near = BUILDINGS.find(
      (b) => distXZ(pos, b.entrance) <= b.entranceRadius,
    );
    if (!near) {
      dismissedKeyRef.current = null; // sudah menjauh, popup boleh muncul lagi
      return;
    }
    if (near.key === dismissedKeyRef.current) return; // sudah ditolak ("Nanti")

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
    setTransitioning(true);
    setTransitionError(null);

    const run = async () => {
      try {
        if (urlBuildingKey) {
          const building = getBuilding(urlBuildingKey);
          if (!building) {
            navigate("/", { replace: true });
            return;
          }
          await enterBuilding(building.key, building.interior.spawn);
          setActiveBuildingKey(building.key);
        } else {
          const prev = getBuilding(activeBuildingKey);
          // Jangan langsung muncul popup lagi di pintu tempat pemain keluar
          dismissedKeyRef.current = prev?.key ?? null;
          await enterRoom(exteriorRoomId, prev?.entrance ?? DEFAULT_SPAWN);
          setActiveBuildingKey(null);
        }
      } catch (err) {
        console.error("Gagal berpindah ruangan:", err);
        setTransitionError(
          err instanceof Error ? err.message : "Gagal berpindah ruangan",
        );
        navigate("/", { replace: true });
      } finally {
        syncingToRef.current = undefined;
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
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
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

  if (!session) {
    // Belum masuk: tampilkan overview kota sebagai latar, lalu minta nama tamu
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
          />
        </SceneCanvas>
        <div className="pointer-events-none absolute inset-0 bg-slate-900/25" />
        <LandingOverlay
          activeMenu={landingMenu}
          onMenuSelect={setLandingMenu}
          onMenuClose={() => setLandingMenu(null)}
          activeView={landingView}
          onViewSelect={setLandingView}
          onExplore={() => setShowGuestModal(true)}
        />

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
                onBuildingSelect={setSelectedBuilding}
                onLocalPositionChange={handleLocalPosition}
                cameraMode={cameraMode}
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
                    onExit={() => navigate("/")}
                  />
                )}
              </Suspense>
            </SceneCanvas>
          }
        />
      </Routes>

      {/* Indikator pindah ruangan */}
      {transitioning && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-100/70 backdrop-blur-sm text-xs font-semibold text-slate-600">
          Memuat ruangan...
        </div>
      )}

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
          onClick={() => navigate("/")}
          className="absolute top-[72px] left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 border border-white/80 shadow-lg text-xs font-bold text-slate-700 hover:text-blue-600 transition cursor-pointer"
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
        userStatus={selfInfo?.status ?? "LIVE"}
        onStatusChange={setStatus}
        onExit={() => void signOut()}
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