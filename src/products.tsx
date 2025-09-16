// products.ts
import { ProductConfig } from "./types";

export const PRODUCTS: ProductConfig[] = [
  {
    id: "p20",
    label: "20% Perf",
    openArea: 0.2,
    holeDiamMm: 1.5,
    pitchMm: 3.0, // derived from OA & Ø
    lattice: "hex",
    enabledDefault: true,
    notes: "20% open, 1.5mm holes, ~3.0mm pitch",
  },
  {
    id: "p30",
    label: "30% Perf",
    openArea: 0.3,
    holeDiamMm: 1.5,
    pitchMm: 2.4, // derived
    lattice: "hex",
    enabledDefault: true,
    notes: "30% open, 1.5mm holes, ~2.4mm pitch",
  },
  {
    id: "p40",
    label: "40% Perf",
    openArea: 0.4,
    holeDiamMm: 1.6,
    pitchMm: 2.1, // derived
    lattice: "hex",
    enabledDefault: true,
    notes: "40% open, 1.6mm holes, ~2.1mm pitch",
  },
  {
    id: "p50",
    label: "50% Perf",
    openArea: 0.5,
    holeDiamMm: 1.5,
    pitchMm: 2.0, // derived
    lattice: "hex",
    enabledDefault: true,
    notes: "50% open, 1.5mm holes, ~2.0mm pitch",
  },
  {
    id: "p40hd",
    label: "40% HD",
    openArea: 0.4,
    holeDiamMm: 1.0,
    pitchMm: 1.3, // derived
    lattice: "hex",
    enabledDefault: true,
    notes: "40% HD open, 1.0mm holes, ~1.3mm pitch",
  },
];
