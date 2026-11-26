// src/lib/npcRuntime.ts
// NPC kota TIDAK disimulasikan di client. Server mengirim snapshot (event npc:world)
// dan client hanya menginterpolasi posisinya, sama seperti trem di tramRuntime.ts.
import { useSyncExternalStore } from "react";
import { angleDiff } from "@/lib/angle";
import { worldNowMs } from "@/lib/worldClock";

/** Harus sama dengan NpcTuple di server/src/npc/world.ts */
export type NpcTuple = [string, number, number, number, number, number, number, number];

export interface NpcSnapshot {
  t: number;
  signal: "green" | "yellow" | "red";
  npcs: NpcTuple[];
}

export interface NpcPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** 0 diam, 1 jalan, 2 duduk */
  anim: 0 | 1 | 2;
  ride: 0 | 1;
  /** -1 = tidak ada bubble; selain itu indeks dialog/aksi */
  talk: number;
}

/** Sama dengan jeda render trem: cukup untuk menutup jitter jaringan. */
const RENDER_DELAY_MS = 150;
const MAX_BUFFER = 8;

interface Frame {
  t: number;
  signal: NpcSnapshot["signal"];
  byId: Map<string, NpcTuple>;
}

let buffer: Frame[] = [];
let currentSignal: NpcSnapshot["signal"] = "green";
const talkById = new Map<string, number>();
const talkListeners = new Map<string, Set<() => void>>();
let emitInteract: ((id: string) => void) | null = null;

export function setNpcEmitter(fn: ((id: string) => void) | null): void {
  emitInteract = fn;
}

/** Klik NPC: kirim ke server, efeknya datang lewat snapshot berikutnya. */
export function interactNpc(id: string): void {
  emitInteract?.(id);
}

/** Dipanggil setiap kali server mengirim npc:world. */
export function applyNpcSnapshot(s: NpcSnapshot): void {
  const byId = new Map<string, NpcTuple>();
  for (const row of s.npcs) byId.set(row[0], row);
  buffer.push({ t: s.t, signal: s.signal, byId });
  if (buffer.length > MAX_BUFFER) buffer = buffer.slice(-MAX_BUFFER);
  currentSignal = s.signal;

  for (const row of s.npcs) {
    const id = row[0];
    const talk = row[7];
    if (talkById.get(id) === talk) continue;
    talkById.set(id, talk);
    talkListeners.get(id)?.forEach((cb) => cb());
  }
}

/** Dipanggil saat pindah room atau putus, supaya tidak memakai NPC lama. */
export function resetNpcRuntime(): void {
  buffer = [];
  talkById.clear();
  for (const set of talkListeners.values()) set.forEach((cb) => cb());
}

export function getNpcSignal(): NpcSnapshot["signal"] {
  return currentSignal;
}

/**
 * Isi `out` dengan pose NPC `id` pada waktu render (waktu dunia - delay).
 * Mengembalikan false jika NPC belum ada di snapshot.
 */
export function readNpcPose(id: string, out: NpcPose): boolean {
  const n = buffer.length;
  if (n === 0) return false;
  const rt = worldNowMs() - RENDER_DELAY_MS;

  let a = buffer[0];
  let b = buffer[n - 1];
  for (let i = 0; i < n - 1; i++) {
    if (buffer[i].t <= rt && buffer[i + 1].t >= rt) {
      a = buffer[i];
      b = buffer[i + 1];
      break;
    }
  }
  if (rt >= b.t) a = b; // di luar jangkauan buffer: tahan di snapshot terakhir

  const ra = a.byId.get(id);
  const rb = b.byId.get(id);
  const row = ra ?? rb;
  if (!row) return false;

  const span = b.t - a.t;
  const u = a === b || span <= 0 ? 0 : Math.min(1, Math.max(0, (rt - a.t) / span));
  const pa = ra ?? row;
  const pb = rb ?? row;

  out.x = pa[1] + (pb[1] - pa[1]) * u;
  out.y = pa[2] + (pb[2] - pa[2]) * u;
  out.z = pa[3] + (pb[3] - pa[3]) * u;
  out.yaw = pa[4] + angleDiff(pa[4], pb[4]) * u;
  out.anim = (u < 0.5 ? pa[5] : pb[5]) as NpcPose["anim"];
  out.ride = (u < 0.5 ? pa[6] : pb[6]) as NpcPose["ride"];
  out.talk = pb[7];
  return true;
}

export function getNpcTalk(id: string): number {
  return talkById.get(id) ?? -1;
}

function subscribeTalk(id: string, cb: () => void): () => void {
  let set = talkListeners.get(id);
  if (!set) {
    set = new Set();
    talkListeners.set(id, set);
  }
  set.add(cb);
  return () => {
    set.delete(cb);
  };
}

/** Bubble dialog NPC. Re-render hanya saat nilainya berubah. */
export function useNpcTalk(id: string): number {
  return useSyncExternalStore(
    (cb) => subscribeTalk(id, cb),
    () => getNpcTalk(id),
  );
}

/** Pose kosong untuk diisi readNpcPose. Satu objek per komponen sudah cukup (dipakai sinkron). */
export function createNpcPose(): NpcPose {
  return { x: 0, y: 0, z: 0, yaw: 0, anim: 0, ride: 0, talk: -1 };
}
