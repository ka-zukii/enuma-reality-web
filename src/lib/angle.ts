// src/lib/angle.ts
/** Selisih sudut terpendek dari `from` ke `to` (radian). */
export function angleDiff(from: number, to: number): number {
  const d = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  return d < -Math.PI ? d + Math.PI * 2 : d;
}
