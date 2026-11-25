import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const REDUCED_MOTION =
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Angka semu yang stabil per index, dipakai untuk variasi tanpa Math.random saat render */
export function rnd(i: number, salt = 0): number {
  const x = Math.sin((i + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const SHIRTS = [
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#0ea5e9",
  "#ec4899",
];

export const PANTS = ["#1e293b", "#475569", "#312e81", "#44403c"];

export const SKINS = ["#fcd9b6", "#f5c28b", "#d9a273", "#a86f45"];

export const HAIR_COLORS = [
  "#1e1b18",
  "#3b2314",
  "#0f172a",
  "#5b21b6",
  "#7c2d12",
];

/* ============================================================
 * LALU LINTAS
 * Mobil melaju di jalur masing-masing lalu kembali dari ujung.
 * Jika arah mobil terbalik, tukar nilai rotasi di `traffic` (lihat catatan).
 * ============================================================ */
export const CAR_COLORS = [
  "#ef4444",
  "#f8fafc",
  "#2563eb",
  "#0f172a",
  "#eab308",
  "#14b8a6",
];

/* ============================================================
 * POHON BERGOYANG
 * Bungkus pohon dengan Sway. Pivot ada di pangkal pohon,
 * jadi batang tetap menancap di tanah dan hanya tajuk yang bergerak.
 * ============================================================ */
export function Sway({
  position,
  phase = 0,
  children,
}: {
  position: [number, number, number];
  phase?: number;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (REDUCED_MOTION || !ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.z = Math.sin(t * 0.9 + phase) * 0.02;
    ref.current.rotation.x = Math.cos(t * 0.7 + phase * 1.3) * 0.012;
  });

  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}
