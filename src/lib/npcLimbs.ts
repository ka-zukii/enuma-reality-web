// src/lib/npcLimbs.ts
// Animasi kaki dan lengan NPC berjalan. Hanya kosmetik: posisi sudah dari server.
import type { Group } from "three";

const SWING = 0.48;

export function swingBiped(
  walking: boolean,
  phase: number,
  legL: Group | null,
  legR: Group | null,
  armL: Group | null,
  armR: Group | null,
): void {
  if (!walking) {
    for (const g of [legL, legR, armL, armR]) {
      if (g) g.rotation.x *= 0.8;
    }
    return;
  }
  const swing = Math.sin(phase) * SWING;
  if (legL) legL.rotation.x = swing;
  if (legR) legR.rotation.x = -swing;
  if (armL) armL.rotation.x = -swing * 0.65;
  if (armR) armR.rotation.x = swing * 0.65;
}
