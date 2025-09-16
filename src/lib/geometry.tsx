// lib/geometry.ts
import { Lattice } from "../types";

/** Pitch (mm) from OA + hole Ø for hex or square packing. */
export function pitchMmFrom(
  openArea: number,
  holeDiamMm: number,
  lattice: Lattice
): number {
  const r = holeDiamMm / 2;
  if (lattice === "hex") {
    // OA = (π r²) / ((√3/2) a²)
    return Math.sqrt((Math.PI * r * r) / (openArea * (Math.sqrt(3) / 2)));
  }
  // OA = (π r²) / a²
  return Math.sqrt((Math.PI * r * r) / openArea);
}

/** Hole radius (px) from OA + pitch (px). */
export function holeRadiusPxFrom(
  openArea: number,
  pitchPx: number,
  lattice: Lattice
): number {
  if (lattice === "hex") {
    // r = a * sqrt(OA * √3 / (2π))
    return pitchPx * Math.sqrt((openArea * Math.sqrt(3)) / (2 * Math.PI));
  }
  // r = a * sqrt(OA / π)
  return pitchPx * Math.sqrt(openArea / Math.PI);
}

/** Vertical step (px) for lattice given pitch (px). */
export function pitchY(pitchPx: number, lattice: Lattice): number {
  return lattice === "hex" ? (Math.sqrt(3) / 2) * pitchPx : pitchPx;
}
