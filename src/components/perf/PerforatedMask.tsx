// src/components/perf/PerforatedMask.tsx
import React, { useMemo } from "react";
import type { Lattice, Side } from "../../types";

export type PerforatedMaskProps = {
  openArea: number; // 0..1
  pitchPx: number; // center-to-center spacing (px)
  lattice?: Lattice; // "hex" | "square"
  side: Side; // "inside" | "outside"
  printSrc?: string; // artwork (outside only)
  __containerW?: number; // full container width
  __containerH?: number; // full container height
  __sliceFromPct?: number; // slice start (%)
};

const tileCache = new Map<string, string>(); // key -> dataURL

function buildSquareTile(a: number, r: number): string {
  const rAA = r + 0.2;
  const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
  const key = `sq|${a.toFixed(4)}|${rAA.toFixed(4)}|${dpr}`;
  const cached = tileCache.get(key);
  if (cached) return cached;

  const cw = Math.max(4, Math.round(a * dpr));
  const ch = cw;
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d")!;
  ctx.scale(dpr, dpr);

  // white keeps film, black cuts (luminance mask)
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, a, a);

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(a / 2, a / 2, rAA, 0, Math.PI * 2);
  ctx.fill();

  const url = c.toDataURL("image/png");
  tileCache.set(key, url);
  return url;
}

/**
 * Correct hex tile:
 *  - Tile size = a × (√3 · a)  (two hex row heights)
 *  - Two dots per tile (one per row) → correct density (1 dot per √3/2·a²)
 *  - Positions:
 *      yStep = (√3/2)·a
 *      dot1 at ( a/2, 0.5·yStep )
 *      dot2 at ( 0,   1.5·yStep ) + wrapped copy at (a, 1.5·yStep)
 */
function buildHexTileCombined(a: number, r: number): string {
  const yStep = (Math.sqrt(3) / 2) * a; // row pitch
  const tileW = a;
  const tileH = 2 * yStep; // = √3 · a
  const rAA = r + 0.2;
  const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
  const key = `hexC|${tileW.toFixed(4)}|${tileH.toFixed(4)}|${rAA.toFixed(
    4
  )}|${dpr}`;
  const cached = tileCache.get(key);
  if (cached) return cached;

  const cw = Math.max(4, Math.round(tileW * dpr));
  const ch = Math.max(4, Math.round(tileH * dpr));
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d")!;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, tileW, tileH);

  ctx.fillStyle = "#000";
  const dot = (x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, rAA, 0, Math.PI * 2);
    ctx.fill();
  };

  // Row 0 (centered in first half)
  dot(tileW / 2, 0.5 * yStep);
  // Row 1 (staggered left), plus wrapped copy on right edge
  dot(0, 1.5 * yStep);
  dot(tileW, 1.5 * yStep); // wrap-right for seamless tiling

  const url = c.toDataURL("image/png");
  tileCache.set(key, url);
  return url;
}

export default function PerforatedMask({
  openArea,
  pitchPx,
  lattice = "hex",
  side,
  printSrc,
  __containerW = 0,
  __containerH = 0,
  __sliceFromPct = 0,
}: PerforatedMaskProps) {
  // Geometry: radius from openArea + pitch
  const { holeR, tileW, tileH, tileURL } = useMemo(() => {
    const a = pitchPx;
    if (lattice === "hex") {
      // OA = (π r²) / ((√3/2) a²)  ⇒  r = a * sqrt(OA * √3 / (2π))
      const r = a * Math.sqrt((openArea * Math.sqrt(3)) / (2 * Math.PI));
      return {
        holeR: Math.max(0.5, r),
        tileW: a,
        tileH: Math.sqrt(3) * a, // <-- corrected tile height
        tileURL: buildHexTileCombined(a, Math.max(0.5, r)),
      };
    }
    // square
    const r = a * Math.sqrt(openArea / Math.PI);
    return {
      holeR: Math.max(0.5, r),
      tileW: a,
      tileH: a,
      tileURL: buildSquareTile(a, Math.max(0.5, r)),
    };
  }, [openArea, pitchPx, lattice]);

  // Global alignment across slices
  const W = Math.max(1, __containerW || 1000);
  const H = Math.max(1, __containerH || 600);
  const sliceLeftPx = (__sliceFromPct / 100) * W;

  const maskCommon: React.CSSProperties = {
    WebkitMaskImage: `url(${tileURL})`,
    maskImage: `url(${tileURL})`,
    WebkitMaskRepeat: "repeat",
    maskRepeat: "repeat",
    WebkitMaskSize: `${tileW}px ${tileH}px`,
    maskSize: `${tileW}px ${tileH}px`,
    WebkitMaskPosition: "0 0",
    maskPosition: "0 0",
    maskMode: "luminance", // white keeps film; black cuts holes
  };

  const filmColor = side === "outside" ? "#fff" : "#000";

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: -sliceLeftPx,
          width: `${W}px`,
          height: `${H}px`,
          willChange: "transform",
        }}
      >
        {/* Film base */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: filmColor,
            ...maskCommon,
          }}
        />
        {/* Printed artwork (outside only) */}
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
              ...maskCommon,
            }}
          />
        )}
      </div>
    </div>
  );
}
