// components/perf/ProductOverlay.tsx
import React from "react";
import { Lighting, Side, ProductConfig } from "../../types";
import PerforatedMask from "./PerforatedMask";

export default function ProductOverlay({
  config,
  pitchPx,
  side,
  lighting,
  printSrc,
  distanceM,
  __containerW,
  __containerH,
  __sliceFromPct,
}: {
  config: ProductConfig;
  pitchPx: number;
  side: Side;
  lighting: Lighting;
  printSrc?: string;
  distanceM?: number;
  __containerW?: number;
  __containerH?: number;
  __sliceFromPct?: number;
}) {
  return (
    <PerforatedMask
      openArea={config.openArea}
      pitchPx={pitchPx}
      lattice={config.lattice}
      side={side}
      printSrc={printSrc}
      distanceM={distanceM}
      __containerW={__containerW}
      __containerH={__containerH}
      __sliceFromPct={__sliceFromPct}
    />
  );
}
