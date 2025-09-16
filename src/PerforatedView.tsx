import React, { useMemo, useState, useEffect, useRef } from "react";

export type PerforatedViewProps = {
  /** Optional printed artwork shown on the WHITE outside face (non-hole area). */
  printSrc?: string;

  /** 0..1 open area (e.g., 0.40 = 40%) */
  openArea?: number;
  /** Visual pitch in pixels (computed upstream from mm → px and distance) */
  pitchPx?: number;
  /** inside = black web; outside = white + print (holes transparent) */
  mode?: "inside" | "outside";
  /** Lighting: day (outside brighter) or night (inside brighter) */
  lighting?: "day" | "night";

  /** Overlay only (no scene), since background is fixed in the slider. */
  overlayOnly?: boolean;

  /** INTERNAL: injected by MultiCompareSlider for global artwork alignment */
  __containerW?: number;
  __containerH?: number;
  __sliceFromPct?: number;

  alt?: string;
};

export default function PerforatedView({
  printSrc,
  openArea = 0.4,
  pitchPx = 6,
  mode = "inside",
  lighting = "day",
  overlayOnly = true,
  __containerW = 0,
  __containerH = 0,
  __sliceFromPct = 0,
}: PerforatedViewProps) {
  // From pitch & openArea → hole diameter (px)
  const { dotDiameter, maskSizeX, maskSizeY } = useMemo(() => {
    const r = pitchPx * Math.sqrt(openArea / Math.PI);
    const d = Math.max(1, 2 * r);
    return { dotDiameter: d, maskSizeX: pitchPx, maskSizeY: pitchPx };
  }, [openArea, pitchPx]);

  const holeR = dotDiameter / 2;
  const holeStop = `${holeR}px`;

  const maskRemoveHoles = `radial-gradient(circle at center, transparent 0 ${holeStop}, black ${holeStop})`;
  const isOutside = mode === "outside";

  // Subtle white boost for tiny pitch (HD) so face doesn’t look grey on screens
  const whiteBoostAlpha = (() => {
    const t = Math.max(0, Math.min(1, (6 - pitchPx) / 6));
    return 0.22 * t;
  })();

  // --- Global artwork alignment ---
  // Compute a cover transform for the artwork as if it fills the WHOLE CONTAINER.
  // Then, inside each slice, we offset it left by the slice's starting X in pixels,
  // so the visible portion matches the same global image.
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(
    null
  );
  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const t = e.currentTarget;
    if (t.naturalWidth && t.naturalHeight) {
      setImgNatural({ w: t.naturalWidth, h: t.naturalHeight });
    }
  };

  // Compute CSS for artwork image (size + offset) to simulate "object-fit: cover" on the full container
  const artworkStyle = useMemo<React.CSSProperties>(() => {
    if (!imgNatural || !__containerW || !__containerH)
      return { display: "none" };

    const { w: iw, h: ih } = imgNatural;
    const cw = __containerW;
    const ch = __containerH;

    const scale = Math.max(cw / iw, ch / ih); // cover
    const drawW = iw * scale;
    const drawH = ih * scale;

    // Center the image in the full container coords
    const leftInContainer = (cw - drawW) / 2;
    const topInContainer = (ch - drawH) / 2;

    // Convert slice left % to pixels and shift image left by that amount
    const sliceLeftPx = (Math.max(0, Math.min(100, __sliceFromPct)) / 100) * cw;

    return {
      position: "absolute",
      width: `${drawW}px`,
      height: `${drawH}px`,
      transform: `translate(${
        leftInContainer - sliceLeftPx
      }px, ${topInContainer}px)`,
      pointerEvents: "none",
    };
  }, [imgNatural, __containerW, __containerH, __sliceFromPct]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* OUTSIDE: white base + (globally aligned) artwork in non-hole area */}
      {isOutside ? (
        <>
          {/* White base in non-hole area */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: "#fff",
              WebkitMaskImage: maskRemoveHoles as any,
              maskImage: maskRemoveHoles as any,
              WebkitMaskSize: `${maskSizeX}px ${maskSizeY}px`,
              maskSize: `${maskSizeX}px ${maskSizeY}px`,
              WebkitMaskRepeat: "repeat",
              maskRepeat: "repeat",
            }}
          />

          {/* Printed artwork — globally aligned across slices */}
          {printSrc && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                WebkitMaskImage: maskRemoveHoles as any,
                maskImage: maskRemoveHoles as any,
                WebkitMaskSize: `${maskSizeX}px ${maskSizeY}px`,
                maskSize: `${maskSizeX}px ${maskSizeY}px`,
                WebkitMaskRepeat: "repeat",
                maskRepeat: "repeat",
              }}
            >
              {/* The image itself is drawn once 'as if' it covered the whole container.
                  We offset it by the slice-left px so all slices share the same print. */}
              <img
                src={printSrc}
                alt="Printed artwork"
                onLoad={onImgLoad}
                draggable={false}
                style={artworkStyle}
              />
            </div>
          )}

          {/* White boost for tiny pitch */}
          {whiteBoostAlpha > 0 && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: `rgba(255,255,255,${whiteBoostAlpha})`,
                WebkitMaskImage: maskRemoveHoles as any,
                maskImage: maskRemoveHoles as any,
                WebkitMaskSize: `${maskSizeX}px ${maskSizeY}px`,
                maskSize: `${maskSizeX}px ${maskSizeY}px`,
                WebkitMaskRepeat: "repeat",
                maskRepeat: "repeat",
              }}
            />
          )}
        </>
      ) : (
        // INSIDE: black web (non-hole area)
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "#000",
            WebkitMaskImage: maskRemoveHoles as any,
            maskImage: maskRemoveHoles as any,
            WebkitMaskSize: `${maskSizeX}px ${maskSizeY}px`,
            maskSize: `${maskSizeX}px ${maskSizeY}px`,
            WebkitMaskRepeat: "repeat",
            maskRepeat: "repeat",
          }}
        />
      )}
    </div>
  );
}
