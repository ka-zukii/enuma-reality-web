import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { authFetch } from "@/lib/api";
import { createSocketConnection } from "@/lib/socket";
import type {
  ChatMessage,
  MemberRole,
  PlayerStatus,
  RemotePlayer,
  WorkspaceData,
} from "@/types";
import type { Vec3 } from "@/config/buildings";

export interface PlayerTickData {
  position: Vec3;
  rotationY: number;
  animation: "idle" | "walk";
  zone: string;
}

type JoinMode = "auto" | "code";

interface SelfInfo {
  role: MemberRole;
  jobTitle: string | null;
  status: PlayerStatus;
}

interface ApiChatMessage {
  id: string;
  content: string;
  createdAt?: string;
  sender: { id: string; fullName: string };
}

const MAX_AUTO_ATTEMPTS = 3;
const ROOM_JOIN_TIMEOUT_MS = 8000;
const BUBBLE_DURATION_MS = 6000;

interface PendingJoin {
  resolve: () => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Koneksi ke server kantor.
 *
 * Hook ini hanya bergantung pada `userId`, bukan pada objek session:
 * - Refresh token Supabase (sekitar tiap jam) TIDAK memicu join ulang atau reconnect.
 * - Socket dan request HTTP mengambil token terbaru lewat `getAccessToken()`.
 * - Sign-out (`userId` = null) memutus socket dan mengosongkan semua state.
 */
export function useOfficeSocket(userId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [bubbles, setBubbles] = useState<Record<string, string>>({});
  const [selfInfo, setSelfInfo] = useState<SelfInfo | null>(null);

  // Ref khusus untuk koordinat 20Hz agar tidak memicu re-render React 20x/detik
  const remoteTicksRef = useRef<Record<string, PlayerTickData>>({});

  const socketRef = useRef<Socket | null>(null);
  const userIdRef = useRef<string | null>(userId);
  const workspaceRef = useRef<WorkspaceData | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);
  const pendingJoinRef = useRef<PendingJoin | null>(null);
  const bubbleTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const autoAttemptRef = useRef(0);
  /**
   * Nomor generasi koneksi. Naik setiap kali socket diganti atau diputus, sehingga
   * operasi async yang masih berjalan (fetch history, connect) tahu hasilnya sudah usang.
   */
  const connGenRef = useRef(0);
  /** Nomor sesi. Naik hanya saat user berganti atau hook di-unmount (sign-out, dll.) */
  const sessionEpochRef = useRef(0);
  const quickJoinRef = useRef<((attempt?: number) => Promise<void>) | null>(
    null,
  );

  const clearAllBubbleTimers = useCallback(() => {
    Object.values(bubbleTimersRef.current).forEach((timer) =>
      clearTimeout(timer),
    );
    bubbleTimersRef.current = {};
    setBubbles({});
  }, []);

  /** Selesaikan permintaan pindah ruangan yang sedang menunggu room:state */
  const settlePendingJoin = useCallback((failure?: Error) => {
    const pending = pendingJoinRef.current;
    if (!pending) return;
    pendingJoinRef.current = null;
    clearTimeout(pending.timer);
    if (failure) pending.reject(failure);
    else pending.resolve();
  }, []);

  /** Putus socket aktif dan bersihkan data pemain. State workspace & pesan tidak disentuh. */
  const disconnectSocket = useCallback(
    (reason: string) => {
      settlePendingJoin(new Error(reason));

      const current = socketRef.current;
      socketRef.current = null;
      current?.removeAllListeners();
      current?.disconnect();

      setSocket(null);
      setIsConnected(false);
      clearAllBubbleTimers();
      remoteTicksRef.current = {};
    },
    [settlePendingJoin, clearAllBubbleTimers],
  );

  /** Kosongkan seluruh state. Dipakai saat sign-out. */
  const resetState = useCallback(() => {
    workspaceRef.current = null;
    currentRoomIdRef.current = null;
    setWorkspace(null);
    setRemotePlayers([]);
    setMessages([]);
    setSelfInfo(null);
    setError(null);
  }, []);

  const connectToWorkspace = useCallback(
    async (targetWorkspace: WorkspaceData, mode: JoinMode = "code") => {
      const uid = userIdRef.current;
      if (!uid) return;

      const gen = ++connGenRef.current;
      const isStale = () => gen !== connGenRef.current;

      disconnectSocket("Koneksi diganti");

      const exteriorRoom =
        targetWorkspace.rooms.find((r) => !r.buildingKey) ??
        targetWorkspace.rooms[0];

      if (!exteriorRoom) {
        setError("Server ini belum memiliki ruangan.");
        return;
      }

      workspaceRef.current = targetWorkspace;
      currentRoomIdRef.current = exteriorRoom.id;
      setWorkspace(targetWorkspace);
      setRemotePlayers([]);

      const [globalRes, dmRes] = await Promise.all([
        authFetch(`/api/rooms/${exteriorRoom.id}/messages`),
        authFetch(`/api/workspaces/${targetWorkspace.id}/dms`),
      ]);
      const globalHistory: ApiChatMessage[] = globalRes.ok
        ? await globalRes.json()
        : [];
      const dmHistory: ChatMessage[] = dmRes.ok ? await dmRes.json() : [];
      if (isStale()) return;

      const formattedGlobal: ChatMessage[] = Array.isArray(globalHistory)
        ? globalHistory.map((m) => ({
            id: m.id,
            channel: "GLOBAL",
            senderId: m.sender.id,
            senderName: m.sender.fullName,
            content: m.content,
            createdAt: m.createdAt,
          }))
        : [];

      const mergedHistory = [
        ...formattedGlobal,
        ...(Array.isArray(dmHistory) ? dmHistory : []),
      ].sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime(),
      );
      setMessages(mergedHistory);

      const newSocket = createSocketConnection();
      socketRef.current = newSocket;
      setSocket(newSocket);

      // Menentukan perilaku server:full (gagal saat masuk pertama, atau saat pindah ruangan)
      let joined = false;

      newSocket.on("connect", () => {
        setIsConnected(true);
        setError(null);
        // Setiap connect (termasuk auto-reconnect) kembali ke ruangan aktif
        newSocket.emit("room:join", {
          workspaceId: targetWorkspace.id,
          roomId: currentRoomIdRef.current ?? exteriorRoom.id,
          mode,
        });
      });

      newSocket.on("server:full", () => {
        if (joined) {
          // Pindah ruangan gagal, socket tetap hidup dan ditangani di enterRoom
          settlePendingJoin(
            new Error("Ruangan ini sudah penuh (maks 15 pemain)."),
          );
          return;
        }

        // Gagal saat pertama masuk server
        newSocket.disconnect();
        setIsConnected(false);

        if (mode === "auto") {
          void quickJoinRef.current?.(autoAttemptRef.current + 1);
        } else {
          setError("Server ini sudah penuh (maks 15 pemain).");
        }
      });

      newSocket.on("error:message", (msg: string) => {
        setError(msg);
      });

      newSocket.on("connect_error", (err) => {
        setIsConnected(false);
        setError(`Socket Error: ${err.message}`);
      });

      newSocket.on("disconnect", (reason) => {
        console.warn("[Client Socket Disconnected]:", reason);
        setIsConnected(false);
      });

      newSocket.on("room:state", (players: RemotePlayer[]) => {
        joined = true;
        settlePendingJoin();

        // Simpan role dan jabatan kita sendiri untuk overhead label
        const me = players.find((p) => p.userId === uid);
        if (me) {
          setSelfInfo({
            role: me.role,
            jobTitle: me.jobTitle ?? null,
            status: me.status,
          });
        }

        // Dedup by userId dan kecualikan akun diri sendiri
        const others = Array.from(
          new Map(
            players
              .filter((p) => p.userId !== uid)
              .map((p) => [p.userId, p] as const),
          ).values(),
        );

        others.forEach((p) => {
          remoteTicksRef.current[p.userId] = {
            position: p.position,
            rotationY: p.rotationY,
            animation: p.animation,
            zone: p.zone,
          };
        });
        setRemotePlayers(others);
      });

      newSocket.on("player:joined", (player: RemotePlayer) => {
        if (player.userId === uid) return;
        const prevTick = remoteTicksRef.current[player.userId];
        // Pertahankan posisi terakhir jika pemain hanya reconnect/update socket
        const keepPos = prevTick?.position || player.position;
        remoteTicksRef.current[player.userId] = {
          position: keepPos,
          rotationY: player.rotationY ?? prevTick?.rotationY ?? 0,
          animation: player.animation ?? prevTick?.animation ?? "idle",
          zone: player.zone ?? prevTick?.zone ?? "jalan-utama",
        };
        setRemotePlayers((prev) => [
          ...prev.filter((p) => p.userId !== player.userId),
          player,
        ]);
      });

      // Update ref secara langsung tanpa memicu React re-render
      newSocket.on(
        "room:tick",
        (ticks: Array<PlayerTickData & { userId: string }>) => {
          for (const t of ticks) {
            if (t.userId === uid) continue;
            remoteTicksRef.current[t.userId] = {
              position: t.position,
              rotationY: t.rotationY,
              animation: t.animation,
              zone: t.zone,
            };
          }
        },
      );

      newSocket.on(
        "player:left",
        ({ userId: leftId, socketId }: { userId: string; socketId?: string }) => {
          // Hanya hapus jika socket yang disconnect memang socket aktif pemain tersebut
          setRemotePlayers((prev) => {
            const target = prev.find((p) => p.userId === leftId);
            if (socketId && target && target.socketId !== socketId) {
              return prev;
            }
            delete remoteTicksRef.current[leftId];
            return prev.filter((p) => p.userId !== leftId);
          });
        },
      );

      newSocket.on(
        "player:status",
        ({ userId: changedId, status }: { userId: string; status: PlayerStatus }) => {
          if (changedId === uid) {
            setSelfInfo((prev) => (prev ? { ...prev, status } : prev));
            return;
          }
          setRemotePlayers((prev) =>
            prev.map((p) => (p.userId === changedId ? { ...p, status } : p)),
          );
        },
      );

      newSocket.on("chat:receive", (msg: ChatMessage) => {
        setMessages((prev) => [...prev.slice(-99), msg]);

        // Bubble chat untuk PROXIMITY maupun GLOBAL
        if (msg.channel === "PROXIMITY" || msg.channel === "GLOBAL") {
          const senderId = msg.senderId;
          if (bubbleTimersRef.current[senderId]) {
            clearTimeout(bubbleTimersRef.current[senderId]);
          }

          setBubbles((prev) => ({ ...prev, [senderId]: msg.content }));

          bubbleTimersRef.current[senderId] = setTimeout(() => {
            setBubbles((prev) => {
              const copy = { ...prev };
              delete copy[senderId];
              return copy;
            });
            delete bubbleTimersRef.current[senderId];
          }, BUBBLE_DURATION_MS);
        }
      });
    },
    [disconnectSocket, settlePendingJoin],
  );

  const quickJoin = useCallback(
    async (attempt = 1) => {
      if (!userIdRef.current) return;
      const epoch = sessionEpochRef.current;

      autoAttemptRef.current = attempt;
      if (attempt > MAX_AUTO_ATTEMPTS) {
        setError("Gagal menemukan server kosong, coba lagi nanti.");
        return;
      }

      try {
        setError(null);
        const res = await authFetch("/api/servers/quick-join", {
          method: "POST",
        });
        if (epoch !== sessionEpochRef.current) return;

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          throw new Error(`Quick join gagal (${res.status}) ${detail}`);
        }

        const { workspace: target } = await res.json();
        await connectToWorkspace(target, "auto");
      } catch (err) {
        console.error("Quick Join Error:", err);
        if (epoch !== sessionEpochRef.current) return;
        setError(
          err instanceof Error
            ? err.message
            : "Gagal terhubung ke server backend",
        );
      }
    },
    [connectToWorkspace],
  );

  quickJoinRef.current = quickJoin;

  /**
   * Pindah ke ruangan lain di server yang sama (mis. interior gedung).
   * Resolve saat server mengirim room:state, reject jika penuh atau timeout.
   */
  const enterRoom = useCallback(
    (roomId: string, spawn: Vec3): Promise<void> => {
      const socket = socketRef.current;
      const ws = workspaceRef.current;
      if (!socket || !ws || !socket.connected) {
        return Promise.reject(new Error("Belum terhubung ke server"));
      }

      settlePendingJoin(new Error("Perpindahan ruangan dibatalkan"));

      const previousRoomId = currentRoomIdRef.current;
      currentRoomIdRef.current = roomId;
      remoteTicksRef.current = {};
      setRemotePlayers([]);

      return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => settlePendingJoin(new Error("Waktu habis saat masuk ruangan")),
          ROOM_JOIN_TIMEOUT_MS,
        );

        pendingJoinRef.current = {
          resolve,
          reject: (err) => {
            // Server tetap menempatkan pemain di ruangan lama, jadi kembalikan state-nya
            currentRoomIdRef.current = previousRoomId;
            if (previousRoomId) {
              socket.emit("room:join", {
                workspaceId: ws.id,
                roomId: previousRoomId,
                mode: "code",
              });
            }
            reject(err);
          },
          timer,
        };

        socket.emit("room:join", {
          workspaceId: ws.id,
          roomId,
          currentPosition: spawn,
          mode: "code",
        });
      });
    },
    [settlePendingJoin],
  );

  /** Masuk ke interior gedung: server membuat room jika belum ada, lalu pindah ke sana */
  const enterBuilding = useCallback(
    async (buildingKey: string, spawn: Vec3) => {
      const ws = workspaceRef.current;
      if (!ws) throw new Error("Belum terhubung");

      const res = await authFetch(
        `/api/workspaces/${ws.id}/interiors/${buildingKey}`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error(`Gagal masuk gedung (${res.status})`);

      const { room } = (await res.json()) as { room: { id: string } };
      await enterRoom(room.id, spawn);
    },
    [enterRoom],
  );

  /* ----------------------------------------------------------------------
   * Siklus hidup koneksi, hanya dipicu oleh perubahan userId.
   * Urutan effect penting: sinkronisasi ref dulu, baru koneksi.
   * ---------------------------------------------------------------------- */
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      // Sign-out: cleanup effect sebelumnya sudah memutus socket, tinggal kosongkan state
      resetState();
      return;
    }

    void quickJoin(1);

    return () => {
      // Batalkan semua operasi async yang masih berjalan lalu putus socket.
      // Di React StrictMode effect ini berjalan dua kali, dan hal itu aman.
      sessionEpochRef.current++;
      connGenRef.current++;
      disconnectSocket("Koneksi ditutup");
    };
  }, [userId, quickJoin, disconnectSocket, resetState]);

  const joinByInviteCode = useCallback(
    async (inviteCode: string) => {
      if (!userIdRef.current) return { ok: false, error: "Unauthorized" };

      const res = await authFetch("/api/workspaces/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await res.json();
      if (!res.ok)
        return { ok: false, error: data.error || "Kode undangan tidak valid" };

      await connectToWorkspace(data, "code");
      return { ok: true };
    },
    [connectToWorkspace],
  );

  const switchWorkspace = useCallback(
    (target: WorkspaceData) => connectToWorkspace(target, "code"),
    [connectToWorkspace],
  );

  const sendMessage = useCallback(
    (
      channel: "PROXIMITY" | "GLOBAL" | "PRIVATE",
      content: string,
      receiverId?: string,
    ) => {
      if (!socketRef.current || !content.trim()) return;
      socketRef.current.emit("chat:send", {
        channel,
        content: content.trim(),
        receiverId,
      });
    },
    [],
  );

  /** Ubah status presence. Update langsung di UI, lalu dikirim ke server */
  const setStatus = useCallback((status: PlayerStatus) => {
    setSelfInfo((prev) => (prev ? { ...prev, status } : prev));
    socketRef.current?.emit("player:status", { status });
  }, []);

  return {
    socket,
    isConnected,
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
  };
}
