// MultiCompareSlider.tsx
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  cloneElement,
  isValidElement,
} from "react";

export type Segment = {
  label: string;
  /** Overlay node; we may clone it to pass container metrics. */
  custom?: React.ReactNode;
};

type Props = {
  /** Fixed background node (scene), rendered once behind all slices. */
  background: React.ReactNode;

  /** Segments (Original + products). */
  segments: Segment[];

  /** N segments → N−1 handles, as percents [0..100]. If omitted, evenly spaced. */
  initialPositions?: number[];

  /** Fixed height in px. */
  height?: number;

  /** Legend chips below. */
  showLegend?: boolean;

  /** Per-slice labels overlaid. */
  showSliceLabels?: boolean;

  /** Notify handle positions. */
  onPositionsChange?: (positions: number[]) => void;
};

// ---- Tunables ----
const HANDLE_SIZE = 44;
const MIN_GAP = 2;
const KEY_STEP = 1;
const KEY_STEP_BIG = 5;

export default function MultiCompareSlider({
  background,
  segments,
  initialPositions,
  height = 460,
  showLegend = false,
  showSliceLabels = true,
  onPositionsChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Measure container for consistent artwork alignment
  const [cSize, setCSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setCSize({
        w: Math.max(1, Math.round(r.width)),
        h: Math.max(1, Math.round(r.height)),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clampedSegments = useMemo(
    () =>
      Array.isArray(segments) && segments.length >= 2
        ? segments
        : [{ label: "A" }, { label: "B" }],
    [segments]
  );
  const handleCount = clampedSegments.length - 1;

  const evenPositions = useMemo(() => {
    const cuts: number[] = [];
    for (let i = 1; i < clampedSegments.length; i++)
      cuts.push((i / clampedSegments.length) * 100);
    return cuts;
  }, [clampedSegments.length]);

  const seeded = useMemo(() => {
    const seed = (initialPositions?.slice(0, handleCount) ?? evenPositions).map(
      (p) => Math.max(0, Math.min(100, p))
    );
    for (let i = 0; i < seed.length; i++) {
      const prev = i === 0 ? 0 : seed[i - 1];
      seed[i] = Math.max(prev + MIN_GAP, seed[i]);
    }
    if (seed.length)
      seed[seed.length - 1] = Math.min(100 - MIN_GAP, seed[seed.length - 1]);
    return seed;
  }, [initialPositions, handleCount, evenPositions]);

  const [positions, setPositions] = useState<number[]>(seeded);

  // Reset to even if count changes (parent usually forces remount on toggle; this is a safety)
  useEffect(() => {
    setPositions(evenPositions);
    onPositionsChange?.(evenPositions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evenPositions.join("|")]);

  // Drag logic
  const draggingIndexRef = useRef<number | null>(null);

  const pxToPercent = useCallback((clientX: number) => {
    const el = containerRef.current!;
    const rect = el.getBoundingClientRect();
    const x = Math.max(rect.left, Math.min(clientX, rect.right));
    return ((x - rect.left) / rect.width) * 100;
  }, []);

  const clampForIndex = useCallback(
    (pct: number, idx: number) => {
      const min = idx === 0 ? MIN_GAP : positions[idx - 1] + MIN_GAP;
      const max =
        idx === positions.length - 1
          ? 100 - MIN_GAP
          : positions[idx + 1] - MIN_GAP;
      return Math.max(min, Math.min(max, pct));
    },
    [positions]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (draggingIndexRef.current == null) return;
      const idx = draggingIndexRef.current;
      const pct = pxToPercent(e.clientX);
      setPositions((prev) => {
        const next = prev.slice();
        next[idx] = clampForIndex(pct, idx);
        return next;
      });
      e.preventDefault();
    },
    [pxToPercent, clampForIndex]
  );

  const endDrag = useCallback(() => {
    draggingIndexRef.current = null;
    window.removeEventListener("pointermove", onPointerMove as any);
    window.removeEventListener("pointerup", endDrag as any);
    onPositionsChange?.(positions);
  }, [onPointerMove, positions, onPositionsChange]);

  const startDrag = useCallback(
    (idx: number) => (e: React.PointerEvent) => {
      draggingIndexRef.current = idx;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      window.addEventListener("pointermove", onPointerMove as any, {
        passive: false,
      });
      window.addEventListener("pointerup", endDrag as any);
      e.preventDefault();
    },
    [onPointerMove, endDrag]
  );

  // Keyboard
  const onHandleKeyDown = (idx: number) => (e: React.KeyboardEvent) => {
    const big = e.shiftKey;
    const step = big ? KEY_STEP_BIG : KEY_STEP;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      setPositions((prev) => {
        const next = prev.slice();
        next[idx] = clampForIndex(
          prev[idx] + (e.key === "ArrowLeft" ? -step : step),
          idx
        );
        return next;
      });
      e.preventDefault();
    }
  };
  useEffect(() => {
    onPositionsChange?.(positions);
  }, [positions, onPositionsChange]);

  // Slices mapped 1:1 to segments
  const slices = useMemo(() => {
    const cuts = [0, ...positions, 100];
    return clampedSegments.map((seg, i) => ({
      seg,
      from: cuts[i],
      to: cuts[i + 1],
      idx: i,
    }));
  }, [positions, clampedSegments]);

  // Label chip
  const LabelChip: React.FC<{ text: string }> = ({ text }) => (
    <div
      style={{
        position: "absolute",
        bottom: 8,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "2px 8px",
        fontSize: 12,
        fontWeight: 600,
        background: "rgba(255,255,255,0.85)",
        borderRadius: 8,
        color: "#111",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );

  // Clone custom overlay to pass container metrics and the slice's left %
  const renderOverlay = (node: React.ReactNode, sliceFromPct: number) => {
    if (!isValidElement(node)) return node;
    return cloneElement(node as any, {
      __containerW: cSize.w,
      __containerH: cSize.h,
      __sliceFromPct: sliceFromPct,
    });
  };

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height,
          userSelect: "none",
          overflow: "hidden",
          borderRadius: 16,
          background: "#000",
        }}
      >
        {/* Fixed background (scene) */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {background}
        </div>

        {/* Slices: each only overlays its region; artwork alignment handled via container metrics */}
        {slices.map(({ seg, from, to, idx }) => {
          const width = to - from;
          return (
            <div
              key={`slice-${idx}`}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${from}%`,
                width: `${width}%`,
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: 1,
              }}
              aria-hidden
            >
              {seg.custom && (
                <div style={{ position: "absolute", inset: 0 }}>
                  {renderOverlay(seg.custom, from)}
                </div>
              )}
              {showSliceLabels && <LabelChip text={seg.label} />}
            </div>
          );
        })}

        {/* Handles (your requested styling) */}
        {positions.map((p, i) => (
          <button
            key={`h-${i}`}
            onPointerDown={startDrag(i)}
            onKeyDown={onHandleKeyDown(i)}
            aria-label={`Handle ${i + 1} of ${positions.length}`}
            title="Drag • Shift+Arrow for bigger steps"
            style={{
              position: "absolute",
              left: `calc(${p}% - ${HANDLE_SIZE / 2}px)`,
              top: `calc(50% - ${HANDLE_SIZE / 2}px)`,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              borderRadius: "50%",
              backgroundColor: "#000",
              backgroundImage: `url("/cv-logo-vv.png")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: `60% 40%`,
              border: "2px solid #fff",
              boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
              cursor: "ew-resize",
              outline: "none",
              zIndex: 2,
            }}
          />
        ))}

        {/* Guides */}
        {positions.map((p, i) => (
          <div
            key={`guide-${i}`}
            aria-hidden
            style={{
              position: "absolute",
              left: `${p}%`,
              top: 0,
              bottom: 0,
              width: 0,
              borderLeft: "1px dashed rgba(255,255,255,0.6)",
              pointerEvents: "none",
              zIndex: 0.5 as any,
            }}
          />
        ))}
      </div>

      {showLegend && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
            color: "#333",
            fontSize: 13,
          }}
        >
          {clampedSegments.map((s, i) => (
            <span
              key={`leg-${i}`}
              style={{
                padding: "4px 8px",
                border: "1px solid #e5e5e5",
                borderRadius: 999,
                background: "#fff",
              }}
            >
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
