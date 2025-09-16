// src/config/products.ts
import type { ProductConfig } from "../types";

/**
 * Contra Vision product presets
 * - OA = open area (0..1)
 * - holeDiamMm = physical hole diameter (mm)
 * - pitchMm = centre-to-centre spacing (mm), derived to hit OA with given Ø
 * - lattice = "hex" (default packing)
 */
export const PRODUCTS: ProductConfig[] = [
  {
    id: "p20",
    label: "20%",
    openArea: 0.2,
    holeDiamMm: 1.5,
    pitchMm: 3.0, // derived from OA + Ø (hex)
    lattice: "hex",
    enabledDefault: true,
    notes: "20% open • Ø1.5 mm • ~3.0 mm pitch (hex)",
  },
  {
    id: "p30",
    label: "30%",
    openArea: 0.3,
    holeDiamMm: 1.5,
    pitchMm: 2.4, // derived
    lattice: "hex",
    enabledDefault: true,
    notes: "30% open • Ø1.5 mm • ~2.4 mm pitch (hex)",
  },
  {
    id: "p40",
    label: "40%",
    openArea: 0.4,
    holeDiamMm: 1.6,
    pitchMm: 2.1, // derived
    lattice: "hex",
    enabledDefault: true,
    notes: "40% open • Ø1.6 mm • ~2.1 mm pitch (hex)",
  },
  {
    id: "p50",
    label: "50%",
    openArea: 0.5,
    holeDiamMm: 1.5,
    pitchMm: 2.0, // derived
    lattice: "hex",
    enabledDefault: true,
    notes: "50% open • Ø1.5 mm • ~2.0 mm pitch (hex)",
  },
  {
    id: "p40hd",
    label: "40% HD",
    openArea: 0.4,
    holeDiamMm: 1.0,
    pitchMm: 1.3, // derived (smaller Ø for HD, still 40% OA)
    lattice: "hex",
    enabledDefault: true,
    notes: "40% open • Ø1.0 mm • ~1.3 mm pitch (hex, HD)",
  },
];

/** Convenience map: id → product */
export const PRODUCTS_BY_ID: Record<string, ProductConfig> = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, p])
);

export default PRODUCTS;
