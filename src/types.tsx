// types.ts
export type Lattice = "hex" | "square";
export type Side = "inside" | "outside";
export type Lighting = "day" | "night";

export type ProductConfig = {
  id: string;
  label: string;
  openArea: number; // 0..1
  holeDiamMm: number; // spec Ø (mm)
  pitchMm: number; // derived from OA + Ø, documented here
  lattice: Lattice;
  enabledDefault?: boolean;
  notes?: string;
};
