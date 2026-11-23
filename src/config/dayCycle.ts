// src/config/dayCycle.ts
import * as THREE from "three";

/** Satu hari dunia dalam milidetik waktu nyata. 20 menit = 1 hari. */
export const DAY_CYCLE_MS = 20 * 60 * 1000;

/**
 * Jam dunia saat fase = 0. Matahari terbit tepat pukul 06:00 dan terbenam pukul 18:00,
 * sehingga posisi matahari (sin/cos fase) selalu sesuai dengan jam di keyframe.
 */
const DAWN_HOUR = 6;

/** Fase siklus 0..1 dari waktu dunia (ms). */
export function cyclePhase(worldNowMs: number): number {
  const p = (worldNowMs % DAY_CYCLE_MS) / DAY_CYCLE_MS;
  return p < 0 ? p + 1 : p;
}

/** Jam dunia 0..24 dari fase. Contoh: 0.25 -> 12. */
export function gameHour(phase: number): number {
  return (phase * 24 + DAWN_HOUR) % 24;
}

/* ---------- Keyframe langit & cahaya per jam ---------- */

interface Key {
  h: number;          // jam dunia
  bg: string;         // warna langit (background)
  fog: string;        // warna kabut, sebaiknya dekat horizon
  sun: string;        // warna cahaya matahari/bulan
  sunI: number;       // intensitas cahaya utama
  amb: number;        // cahaya ambient
  hemi: number;       // intensitas hemisphere
  hemiSky: string;    // warna pantulan dari langit
  hemiGround: string; // warna pantulan dari tanah
  turb: number;       // Sky: kekeruhan atmosfer
  ray: number;        // Sky: hamburan Rayleigh (warna biru)
  mie: number;        // Sky: koefisien Mie (kabut/cahaya matahari)
  mieG: number;       // Sky: fokus cahaya matahari
  stars: number;      // 0..1, seberapa terlihat bintang
}

const KEYS: Key[] = [
  { h: 0, bg: "#070d1d", fog: "#121c33", sun: "#7a8fc4", sunI: 0.1, amb: 0.22, hemi: 0.18,
    hemiSky: "#24325a", hemiGround: "#0c1020", turb: 1.5, ray: 0.15, mie: 0.004, mieG: 0.7, stars: 1 },
  { h: 4.5, bg: "#0e1a33", fog: "#1d2a48", sun: "#8c9cd0", sunI: 0.14, amb: 0.26, hemi: 0.2,
    hemiSky: "#2e3d66", hemiGround: "#12161f", turb: 2.5, ray: 0.25, mie: 0.005, mieG: 0.75, stars: 0.8 },
  { h: 6, bg: "#f2a57a", fog: "#f7c7a2", sun: "#ffa86b", sunI: 0.9, amb: 0.5, hemi: 0.4,
    hemiSky: "#f8c8a6", hemiGround: "#8a6d5c", turb: 6, ray: 1.3, mie: 0.02, mieG: 0.88, stars: 0.1 },
  { h: 8, bg: "#8fcbf5", fog: "#d2eafb", sun: "#fff1dc", sunI: 1.3, amb: 0.75, hemi: 0.55,
    hemiSky: "#dcecfd", hemiGround: "#c2c9b8", turb: 3.5, ray: 0.9, mie: 0.008, mieG: 0.8, stars: 0 },
  { h: 12, bg: "#6fbcf7", fog: "#dcefff", sun: "#ffffff", sunI: 1.5, amb: 0.9, hemi: 0.6,
    hemiSky: "#ffffff", hemiGround: "#cbd5e1", turb: 2, ray: 0.6, mie: 0.005, mieG: 0.8, stars: 0 },
  { h: 15, bg: "#7fb9ee", fog: "#e2f0ff", sun: "#fff4e0", sunI: 1.4, amb: 0.86, hemi: 0.58,
    hemiSky: "#e4f1ff", hemiGround: "#c9ccbd", turb: 3, ray: 0.75, mie: 0.007, mieG: 0.8, stars: 0 },
  { h: 17, bg: "#f7b56a", fog: "#f9d7aa", sun: "#ffc27c", sunI: 1.15, amb: 0.7, hemi: 0.5,
    hemiSky: "#ffe2b8", hemiGround: "#9c8064", turb: 5, ray: 1.1, mie: 0.02, mieG: 0.9, stars: 0 },
  { h: 18, bg: "#e46d4d", fog: "#f2a48a", sun: "#ff8a5c", sunI: 0.65, amb: 0.45, hemi: 0.38,
    hemiSky: "#f5a58a", hemiGround: "#6b5160", turb: 7, ray: 1.4, mie: 0.03, mieG: 0.9, stars: 0.05 },
  { h: 19.5, bg: "#3d2f63", fog: "#55407a", sun: "#9080d4", sunI: 0.18, amb: 0.3, hemi: 0.25,
    hemiSky: "#4d4f85", hemiGround: "#1d2033", turb: 4, ray: 0.55, mie: 0.006, mieG: 0.8, stars: 0.5 },
  { h: 21, bg: "#0a1024", fog: "#18213b", sun: "#7a8fc4", sunI: 0.12, amb: 0.22, hemi: 0.18,
    hemiSky: "#283760", hemiGround: "#0c1020", turb: 1.8, ray: 0.2, mie: 0.004, mieG: 0.7, stars: 1 },
  // Salinan jam 0 agar interpolasi 21..24 mulus
  { h: 24, bg: "#070d1d", fog: "#121c33", sun: "#7a8fc4", sunI: 0.1, amb: 0.22, hemi: 0.18,
    hemiSky: "#24325a", hemiGround: "#0c1020", turb: 1.5, ray: 0.15, mie: 0.004, mieG: 0.7, stars: 1 },
];

/** Hasil interpolasi keyframe untuk satu jam. */
export interface Frame {
  bg: THREE.Color;
  fog: THREE.Color;
  sun: THREE.Color;
  sunI: number;
  amb: number;
  hemi: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  turb: number;
  ray: number;
  mie: number;
  mieG: number;
  stars: number;
}

export interface SkyLighting extends Frame {
  /** Posisi matahari untuk komponen Sky */
  sunPosition: [number, number, number];
  /** Posisi cahaya utama (sumber bayangan) */
  lightPosition: [number, number, number];
}

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(a: string, b: string, t: number): THREE.Color {
  return new THREE.Color(a).lerp(new THREE.Color(b), t);
}

/** Interpolasi halus antara dua keyframe yang mengapit jam `hour`. */
export function frameAt(hour: number): Frame {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KEYS.length - 2 && h >= KEYS[i + 1].h) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = smoothstep((h - a.h) / (b.h - a.h));

  return {
    bg: lerpColor(a.bg, b.bg, t),
    fog: lerpColor(a.fog, b.fog, t),
    sun: lerpColor(a.sun, b.sun, t),
    sunI: lerp(a.sunI, b.sunI, t),
    amb: lerp(a.amb, b.amb, t),
    hemi: lerp(a.hemi, b.hemi, t),
    hemiSky: lerpColor(a.hemiSky, b.hemiSky, t),
    hemiGround: lerpColor(a.hemiGround, b.hemiGround, t),
    turb: lerp(a.turb, b.turb, t),
    ray: lerp(a.ray, b.ray, t),
    mie: lerp(a.mie, b.mie, t),
    mieG: lerp(a.mieG, b.mieG, t),
    stars: lerp(a.stars, b.stars, t),
  };
}

/** Pencahayaan lengkap untuk fase siklus tertentu. */
export function lightingAt(phase: number): SkyLighting {
  const a = phase * Math.PI * 2;
  const sinA = Math.sin(a); // > 0: matahari di atas horizon
  const cosA = Math.cos(a);

  return {
    ...frameAt(gameHour(phase)),
    sunPosition: [cosA * 100, sinA * 150, 80],
    lightPosition: [cosA * 45, Math.max(sinA, 0.12) * 45, 25],
  };
}
