// src/components/perf/LightingOverlay.tsx
import React from "react";
import { Side, Lighting } from "../../types";

export default function LightingOverlay({
  side,
  lighting,
}: {
  side: Side;
  lighting: Lighting;
}) {
  // Day = outside bright → inside slightly darker
  // Night = inside bright → outside slightly darker
  const overlay =
    lighting === "day"
      ? side === "inside"
        ? "rgba(0,0,0,0.25)"
        : "transparent"
      : side === "outside"
      ? "rgba(0,0,0,0.35)"
      : "transparent";

  if (!overlay || overlay === "transparent") return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: overlay,
        pointerEvents: "none",
      }}
    />
  );
}
