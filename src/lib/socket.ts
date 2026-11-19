import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/config";
import { getAccessToken } from "@/lib/api";

/**
 * Membuat koneksi socket baru. `auth` berupa fungsi, sehingga socket.io memanggilnya
 * ulang pada setiap percobaan connect (termasuk auto-reconnect). Token yang dikirim
 * selalu yang terbaru, tidak terkunci pada token saat koneksi pertama dibuat.
 */
export function createSocketConnection(): Socket {
  return io(API_URL || undefined, {
    auth: (cb) => {
      getAccessToken()
        .then((token) => cb({ token: token ?? "" }))
        .catch(() => cb({ token: "" }));
    },
    // Mulai dari polling lalu auto-upgrade ke websocket (aman untuk tunnel & reverse proxy)
    transports: ["polling", "websocket"],
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });
}
