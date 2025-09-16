// lib/lighting.ts
import { Side, Lighting } from "../../types";

/** Tint overlay (white/black wash) */
export function lightingOverlay(side: Side, lighting: Lighting): string | null {
  if (lighting === "day") {
    if (side === "inside") {
      return "rgba(0,0,0,0.35)"; // inside dims
    } else {
      return "rgba(255,255,255,0.15)"; // outside brightens
    }
  } else {
    if (side === "inside") {
      return "rgba(255,255,255,0.25)"; // inside brighter
    } else {
      return "rgba(0,0,0,0.4)"; // outside darker
    }
  }
}

/** Should we show reverse-vision (lit interior leaking through)? */
export function needsReverseVision(side: Side, lighting: Lighting): boolean {
  return side === "outside" && lighting === "night";
}
