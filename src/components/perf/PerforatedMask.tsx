import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Lattice, Side } from "../../types";
import { radiusScaleFromDistance } from "../../lib/distance";

export type PerforatedMaskProps = {
  openArea: number; // 0..1
  pitchPx: number; // already distance-scaled
  lattice?: Lattice; // "hex" | "square"
  side: Side; // "inside" | "outside"
  distanceM?: number;
  printSrc?: string; // artwork on white (outside only)
  __containerW?: number; // injected by slider
  __containerH?: number;
  __sliceFromPct?: number; // slice offset % across container
};

export default function PerforatedMask({
  openArea,
  pitchPx,
  lattice = "hex",
  side,
  distanceM = 3,
  printSrc,
  __containerW = 0,
  __containerH = 0,
  __sliceFromPct = 0,
}: PerforatedMaskProps) {
  // container size fallback
  const W = Math.max(1, __containerW || 1000);
  const H = Math.max(1, __containerH || 600);

  // base radius from OA + pitch
  const rBase =
    lattice === "hex"
      ? pitchPx * Math.sqrt((openArea * Math.sqrt(3)) / (2 * Math.PI))
      : pitchPx * Math.sqrt(openArea / Math.PI);

  // perceptual tightening (no blur)
  const holeR = Math.max(0.5, rBase * radiusScaleFromDistance(distanceM));

  // tile geometry (no tiling used; just to layout rows/cols)
  const tileX = pitchPx;
  const tileY = lattice === "hex" ? (Math.sqrt(3) / 2) * pitchPx : pitchPx;

  // we bake a mask image once per prop change
  const [maskURL, setMaskURL] = useState<string | null>(null);

  useEffect(() => {
    // draw white background (keep), black circles (cut) → luminance mask
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(W);
    canvas.height = Math.ceil(H);
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // fill white (opaque in mask = keep)
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw holes in black (transparent in mask = cut)
    ctx.fillStyle = "#000";

    // overdraw slightly to defeat AA seams
    const rAA = holeR + 0.2;

    if (lattice === "hex") {
      const rows = Math.ceil(H / tileY) + 2;
      const cols = Math.ceil(W / tileX) + 2;
      for (let ry = -1; ry <= rows; ry++) {
        const y = ry * tileY;
        const offsetX = ry & 1 ? tileX / 2 : 0;
        for (let cx = -1; cx <= cols; cx++) {
          const x = cx * tileX + offsetX;
          ctx.beginPath();
          ctx.arc(x, y, rAA, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      const rows = Math.ceil(H / tileY) + 2;
      const cols = Math.ceil(W / tileX) + 2;
      for (let ry = -1; ry <= rows; ry++) {
        const y = ry * tileY + tileY / 2;
        for (let cx = -1; cx <= cols; cx++) {
          const x = cx * tileX + tileX / 2;
          ctx.beginPath();
          ctx.arc(x, y, rAA, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // export PNG data URL for CSS mask
    const url = canvas.toDataURL("image/png");
    setMaskURL((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });

    // cleanup old blob URLs (none here since toDataURL)
    return () => {};
  }, [W, H, tileX, tileY, holeR, lattice]);

  // slice alignment: render a fixed-size layer and shift left by slice offset
  const sliceLeftPx = (__sliceFromPct / 100) * W;

  // shared styles
  const maskStyles: React.CSSProperties = maskURL
    ? {
        WebkitMaskImage: `url(${maskURL})`,
        maskImage: `url(${maskURL})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: `${W}px ${H}px`,
        maskSize: `${W}px ${H}px`,
        WebkitMaskPosition: `0px 0px`,
        maskPosition: `0px 0px`,
        // Force luminance interpretation (white keep / black cut)
        WebkitMaskComposite: "source-over",
        maskMode: "luminance",
      }
    : {};

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: -sliceLeftPx,
          width: `${W}px`,
          height: `${H}px`,
        }}
      >
        {/* Film face, masked by the canvas bitmap */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: side === "outside" ? "#fff" : "#000",
            ...maskStyles,
          }}
        />

        {/* Printed artwork over white, also masked */}
        {side === "outside" && printSrc && (
          <img
            src={printSrc}
            alt="Printed artwork"
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              ...maskStyles,
            }}
          />
        )}
      </div>
    </div>
  );
}
