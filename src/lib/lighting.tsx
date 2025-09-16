// lib/lighting.ts
import type { Side, Lighting } from "../types";

/**
 * Returns a tint overlay for the background scene to mimic lighting.
 * We apply it to whatever scene is behind the film (outside when side="inside",
 * inside when side="outside").
 *
 * DAY:
 *  - inside (viewing out): outside should appear BRIGHTER  → lighten
 *  - outside (viewing in): interior is relatively DARKER   → darken
 *
 * NIGHT:
 *  - inside (viewing out): outside is DARK                 → darken
 *  - outside (viewing in): interior is LIT                 → lighten
 */
export function lightingOverlay(side: Side, lighting: Lighting): string | null {
  if (lighting === "day") {
    return side === "inside"
      ? "rgba(255,255,255,0.08)" // brighten outside a little
      : "rgba(0,0,0,0.15)"; // darken interior slightly
  } else {
    // night
    return side === "inside"
      ? "rgba(0,0,0,0.25)" // outside darker
      : "rgba(255,255,255,0.12)"; // interior lit
  }
}

/** Apply reverse-vision only when outside at night. */
export function needsReverseVision(side: Side, lighting: Lighting): boolean {
  return side === "outside" && lighting === "night";
}
