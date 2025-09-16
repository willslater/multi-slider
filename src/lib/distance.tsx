// lib/distance.ts

/** Distance→perceptual radius scale (closer looks “tighter”). */
export function radiusScaleFromDistance(distanceM: number): number {
  const d = Math.max(0.5, Math.min(25, distanceM));
  if (d <= 3) return 0.82 + (d - 0.5) * ((1.0 - 0.82) / 2.5); // 0.82 → 1.0
  return 1.0;
}

/** Convert physical pitch (mm) to pixels, with inverse distance factor. */
export function pitchPxFromMm(
  pitchMm: number,
  pxPerMm = 4,
  distanceM = 3,
  refM = 3
): number {
  const factor = refM / Math.max(0.5, Math.min(25, distanceM));
  return Math.max(2, Math.min(64, pitchMm * pxPerMm * factor));
}

/** Back-compat alias (some code may import pitchPxFrom). */
export const pitchPxFrom = pitchPxFromMm;
