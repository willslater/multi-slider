// ProductOverlay.tsx
import React from "react";
import PerforatedView from "./PerforatedView";
import { ProductConfig } from "./types";

export type ProductOverlayProps = {
  config: ProductConfig;
  printSrc?: string;
  pitchPx: number;
  mode: "inside" | "outside";
  lighting: "day" | "night";
  // injected by MultiCompareSlider for global artwork alignment; pass-through
  __containerW?: number;
  __containerH?: number;
  __sliceFromPct?: number;
};

export default function ProductOverlay({
  config,
  printSrc,
  pitchPx,
  mode,
  lighting,
  __containerW,
  __containerH,
  __sliceFromPct,
}: ProductOverlayProps) {
  return (
    <PerforatedView
      printSrc={printSrc}
      mode={mode}
      lighting={lighting}
      openArea={config.openArea}
      pitchPx={pitchPx}
      overlayOnly
      lattice={config.lattice}
      __containerW={__containerW}
      __containerH={__containerH}
      __sliceFromPct={__sliceFromPct}
    />
  );
}
