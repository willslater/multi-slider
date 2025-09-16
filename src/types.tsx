// types.ts
export type Lattice = "hex" | "square";

export type ProductConfig = {
  id: string;
  label: string;
  /** 0..1 (e.g., 0.40 = 40% open area) */
  openArea: number;
  /** Physical hole Ø in mm (HD = 1.0; standard ≈ 1.6) */
  holeDiamMm: number;
  /** Dot layout */
  lattice: Lattice;
  /** Initially shown? */
  enabledDefault?: boolean;
  /** Optional brand color, notes, etc. */
  color?: string;
  notes?: string;
};

/** Pitch (mm) from hole Ø and open area.
 *  - square:    OA = (π r²) / a²
 *  - hex/tri:   OA = (π r²) / ((√3/2) a²)
 */
export function pitchMmFrom(config: ProductConfig): number {
  const r = config.holeDiamMm / 2;
  if (config.lattice === "hex") {
    // a = pitch; solve OA = π r² / ((√3/2) a²)
    return Math.sqrt(
      (Math.PI * r * r) / (config.openArea * (Math.sqrt(3) / 2))
    );
  }
  // square
  return Math.sqrt((Math.PI * r * r) / config.openArea);
}

/** Convert pitch to pixels for a given screen scale and distance model. */
export function pitchPxFrom(
  config: ProductConfig,
  pxPerMm: number,
  distanceM: number,
  refM = 3,
  clamp: { min?: number; max?: number } = { min: 2, max: 48 }
): number {
  const pitchMm = pitchMmFrom(config);
  // Closer viewer -> bigger apparent holes (inverse factor)
  const factor = refM / Math.max(0.5, Math.min(25, distanceM));
  const px = pitchMm * pxPerMm * factor;
  const min = clamp.min ?? 2;
  const max = clamp.max ?? 48;
  return Math.max(min, Math.min(max, px));
}
