import type { RefObject } from "react";
import type { Socket } from "socket.io-client";
import { OfficeScene } from "@/components/OfficeScene";
import type { BuildingConfig } from "@/config/buildings";
import type { RemotePlayer } from "@/types";
import type { PlayerTickData } from "@/hooks/useOfficeSocket";
import type { CameraMode } from "@/config/camera";

interface InteriorPageProps {
  building: BuildingConfig;
  socket: Socket | null;
  currentUser: { id: string; fullName: string; color: string };
  remotePlayers: RemotePlayer[];
  remoteTicksRef: RefObject<Record<string, PlayerTickData>>;
  bubbles: Record<string, string>;
  onZoneChange: (zone: string) => void;
  cameraMode: CameraMode;
  isChatFocused: boolean;
  onSceneReady?: () => void;
  onExit: () => void;
}

export default function InteriorPage({
  building,
  socket,
  currentUser,
  remotePlayers,
  remoteTicksRef,
  bubbles,
  onZoneChange,
  cameraMode,
  isChatFocused,
  onSceneReady,
  onExit,
}: InteriorPageProps) {
  return (
    <OfficeScene
      socket={socket}
      currentUser={currentUser}
      remotePlayers={remotePlayers}
      remoteTicksRef={remoteTicksRef}
      bubbles={bubbles}
      onZoneChange={onZoneChange}
      isChatFocused={isChatFocused}
      cameraMode={cameraMode}
      onSceneReady={onSceneReady}
      interior={{ config: building.interior, onExit }}
    />
  );
}
