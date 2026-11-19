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
import { AlertCircle, Building2, DoorOpen, LogOut, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOfficeSocket } from "@/hooks/useOfficeSocket";
import { AuthScreen } from "@/components/auth/AuthScreen";
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

function BuildingPrompt({
  building,
  onEnter,
  onDismiss,
}: {
  building: BuildingConfig;
  onEnter: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl p-5 text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900">
            {building.name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Masuk ke dalam gedung?
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onDismiss}
          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
        >
          Nanti
        </button>
        <button
          onClick={onEnter}
          className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <DoorOpen className="w-3.5 h-3.5" />
          Masuk
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
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

  const [currentZone, setCurrentZone] = useState("jalan-utama");
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [cameraMode, setCameraMode] = useState<"iso" | "follow">("iso");
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-xs text-slate-500 font-sans">
        Memuat Virtual Office City...
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
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
          className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 border border-white/80 shadow-lg text-xs font-bold text-slate-700 hover:text-blue-600 transition cursor-pointer"
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
        onToggleCameraMode={() =>
          setCameraMode((prev) => (prev === "iso" ? "follow" : "iso"))
        }
        isChatFocused={isChatFocused}
        onFocusChatChange={setIsChatFocused}
        onOpenWorkspaceModal={() => setShowJoinModal(true)}
        workspaceName={currentBuilding?.interior.name ?? workspace?.name}
        userStatus={selfInfo?.status ?? "LIVE"}
        onStatusChange={setStatus}
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
